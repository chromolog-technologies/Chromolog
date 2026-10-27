<?php

declare(strict_types=1);

/**
 * One-time move from the old SQLite file to MySQL.
 *
 * When config 'db_path' points at the old SQLite file and the MySQL database is still empty, the
 * first request copies every table across in one transaction, checks the row counts and records
 * the result in app_meta ('sqlite_import'). The SQLite file is only read, never changed.
 * If anything fails nothing is kept, the error is logged and the next request tries again.
 */
function import_sqlite_once(PDO $pdo): void
{
    $path = config()['db_path'] ?? null;
    if (!$path || !is_file($path) || !extension_loaded('pdo_sqlite')) {
        return;
    }
    if ($pdo->query("SELECT 1 FROM app_meta WHERE name = 'sqlite_import'")->fetchColumn()) {
        return;
    }
    $pdo->query("SELECT GET_LOCK('chromolog_import', 300)");
    try {
        if ($pdo->query("SELECT 1 FROM app_meta WHERE name = 'sqlite_import'")->fetchColumn()) {
            return;
        }
        $hasData = (int) $pdo->query('SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM leads) + (SELECT COUNT(*) FROM settings)')->fetchColumn();
        $result = $hasData > 0
            ? ['skipped' => 'MySQL database already had data', 'at' => gmdate('c')]
            : copy_sqlite_to_mysql(new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]), $pdo);
        $pdo->prepare("INSERT INTO app_meta (name, value) VALUES ('sqlite_import', ?)")->execute([json_encode($result)]);
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('chromolog_import')");
    }
}

/** @return array{at: string, rows: array<string, int>} */
function copy_sqlite_to_mysql(PDO $src, PDO $dst): array
{
    $src->exec('PRAGMA query_only = ON');
    $srcTables = $src->query("SELECT name FROM sqlite_master WHERE type = 'table'")->fetchAll(PDO::FETCH_COLUMN);
    $rows = [];
    $dst->exec('SET FOREIGN_KEY_CHECKS = 0');
    $dst->beginTransaction();
    try {
        foreach (array_keys(schema_tables()) as $table) {
            if (!in_array($table, $srcTables, true)) {
                continue;
            }
            $srcCols = array_column($src->query("PRAGMA table_info(\"{$table}\")")->fetchAll(), 'name');
            $dstCols = [];
            foreach ($dst->query("SHOW COLUMNS FROM `{$table}`")->fetchAll() as $c) {
                $dstCols[$c['Field']] = $c;
            }
            $cols = array_values(array_filter($srcCols, fn ($c) => isset($dstCols[$c])));
            $select = $src->query('SELECT ' . implode(', ', array_map(fn ($c) => "\"{$c}\"", $cols)) . " FROM \"{$table}\"");
            $insertCols = implode(', ', array_map(fn ($c) => "`{$c}`", $cols));
            $placeholders = '(' . implode(', ', array_fill(0, count($cols), '?')) . ')';
            $batch = [];
            $count = 0;
            $flush = function () use (&$batch, $dst, $table, $insertCols, $placeholders) {
                if ($batch) {
                    $sql = "INSERT INTO `{$table}` ({$insertCols}) VALUES " . implode(', ', array_fill(0, count($batch), $placeholders));
                    $dst->prepare($sql)->execute(array_merge(...$batch));
                    $batch = [];
                }
            };
            while ($row = $select->fetch()) {
                $batch[] = array_map(fn ($c) => mysql_value($row[$c], $dstCols[$c]), $cols);
                $count++;
                if (count($batch) >= 200) {
                    $flush();
                }
            }
            $flush();
            $copied = (int) $dst->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
            if ($copied !== $count) {
                throw new RuntimeException("{$table}: copied {$copied} of {$count} rows");
            }
            $rows[$table] = $count;
        }
        // Columns that are new in MySQL: accounts that existed before invites are already active.
        if (isset($rows['users']) && !in_array('activated_at', array_column($src->query('PRAGMA table_info(users)')->fetchAll(), 'name'), true)) {
            $dst->exec('UPDATE users SET activated_at = created_at');
        }
        $dst->commit();
    } catch (Throwable $e) {
        $dst->rollBack();
        error_log('Chromolog: SQLite → MySQL copy failed: ' . $e->getMessage());
        throw new RuntimeException('Database move from SQLite failed: ' . $e->getMessage(), 0, $e);
    } finally {
        $dst->exec('SET FOREIGN_KEY_CHECKS = 1');
    }
    return ['at' => gmdate('c'), 'rows' => $rows];
}

/** Turn a SQLite value into one MySQL (strict mode) accepts for the column. */
function mysql_value(mixed $v, array $col): mixed
{
    $type = strtolower($col['Type']);
    $nullable = $col['Null'] === 'YES';
    $blank = $v === null || (is_string($v) && trim($v) === '');
    if (preg_match('/^(tinyint|smallint|int|bigint|double|float|decimal)/', $type)) {
        if ($blank || !is_numeric($v)) {
            return $nullable ? null : (is_numeric($col['Default']) ? $col['Default'] + 0 : 0);
        }
        return str_starts_with($type, 'double') || str_starts_with($type, 'float') ? (float) $v : (int) $v;
    }
    if ($type === 'date' || $type === 'datetime') {
        $s = $blank ? '' : str_replace('T', ' ', substr((string) $v, 0, 19));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}/', $s)) {
            return $nullable ? null : ($type === 'date' ? gmdate('Y-m-d') : gmdate('Y-m-d H:i:s'));
        }
        return $type === 'date' ? substr($s, 0, 10) : (strlen($s) === 10 ? "{$s} 00:00:00" : $s);
    }
    if ($v === null) {
        return null;
    }
    if (preg_match('/^(?:var)?char\((\d+)\)/', $type, $m)) {
        return mb_substr((string) $v, 0, (int) $m[1]);
    }
    return (string) $v;
}
