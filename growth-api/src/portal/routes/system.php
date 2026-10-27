<?php

declare(strict_types=1);

/** Admin: daily automation status, manual run, backups. @var Router $router */

$router->add('GET', 'system/jobs', [ROLE_ADMIN], function () {
    $runs = q('SELECT job, run_date, status, detail, created_at FROM job_runs ORDER BY id DESC LIMIT 30')->fetchAll();
    foreach ($runs as &$r) {
        $r['detail'] = json_decode((string) $r['detail'], true);
    }
    $meta = q('SELECT name, value FROM app_meta')->fetchAll(PDO::FETCH_KEY_PAIR);
    $tables = ['users', 'leads', 'clients', 'quotations', 'invoices', 'payments', 'invoice_history', 'projects', 'tasks', 'timesheets', 'expenses', 'tickets'];
    $counts = [];
    foreach ($tables as $t) {
        $counts[$t] = (int) q("SELECT COUNT(*) FROM {$t}")->fetchColumn();
    }
    return ['runs' => $runs, 'backups' => list_backups(), 'today' => today(), 'database' => [
        'server' => q('SELECT VERSION()')->fetchColumn(),
        'schema_version' => (int) ($meta['schema_version'] ?? 0),
        'protected_by_triggers' => array_values(array_filter(explode(',', $meta['triggers'] ?? ''))),
        'sqlite_import' => isset($meta['sqlite_import']) ? json_decode($meta['sqlite_import'], true) : null,
        'rows' => $counts,
    ]];
});

// Run today's jobs now (force=1 runs them again even if they already ran today).
$router->add('POST', 'system/run-daily', [ROLE_ADMIN], function () {
    return ['results' => run_daily_jobs(!empty(body()['force']))];
});

$router->add('POST', 'system/backup', [ROLE_ADMIN], function () {
    $result = run_backup();
    q('INSERT INTO job_runs (job, run_date, status, detail) VALUES (?, ?, ?, ?)', ['backup', today(), 'ok', json_encode($result)]);
    return ['backup' => $result];
});

$router->add('GET', 'system/backups/{file}', [ROLE_ADMIN], function ($p) {
    $file = (string) ($p['file'] ?? '');
    if (!preg_match('/^chromolog-backup-[0-9_-]+\.zip$/', $file) || !is_file(backup_dir() . "/{$file}")) {
        throw new ApiError('Backup not found.', 404);
    }
    $path = backup_dir() . "/{$file}";
    header('Content-Type: application/zip');
    header('Content-Length: ' . filesize($path));
    header("Content-Disposition: attachment; filename=\"{$file}\"");
    readfile($path);
    exit;
});
