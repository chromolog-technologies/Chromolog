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
    ], 'offsite' => [
        'method' => (string) (config()['offsite_backup']['method'] ?? ''),
        'locked' => (string) (config()['backup_password'] ?? '') !== '',
        'last' => isset($meta['offsite_backup']) ? json_decode($meta['offsite_backup'], true) : null,
        'google' => [
            'configured' => gdrive_configured(),
            'connected' => ($conn = gdrive_connection()) !== null,
            'connected_at' => $conn['connected_at'] ?? null,
            'folder_url' => $conn ? 'https://drive.google.com/drive/folders/' . rawurlencode($conn['folder_id']) : null,
            'redirect_uri' => gdrive_redirect_uri(),
        ],
    ]];
});

// Run today's jobs now (force=1 runs them again even if they already ran today).
$router->add('POST', 'system/run-daily', [ROLE_ADMIN], function () {
    return ['results' => run_daily_jobs(!empty(body()['force']))];
});

$router->add('POST', 'system/backup', [ROLE_ADMIN], function () {
    try {
        $result = run_backup();
    } catch (RuntimeException $e) {
        q('INSERT INTO job_runs (job, run_date, status, detail) VALUES (?, ?, ?, ?)', ['backup', today(), 'error', json_encode($e->getMessage(), JSON_UNESCAPED_UNICODE)]);
        throw new ApiError($e->getMessage(), 502);
    }
    q('INSERT INTO job_runs (job, run_date, status, detail) VALUES (?, ?, ?, ?)', ['backup', today(), 'ok', json_encode($result, JSON_UNESCAPED_UNICODE)]);
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

// ── Google Drive (off-site backups) ─────────────────────────────────────

$router->add('POST', 'system/google/connect', [ROLE_ADMIN], function () {
    security_event('google_drive_connect_started', (int) current_user()['id']);
    return ['url' => gdrive_auth_url((int) current_user()['id'])];
});

// Google sends the browser back here after sign-in. Public: the sign-in cookie is SameSite=Strict, so
// it isn't sent on this cross-site redirect; the one-time state value proves who started it.
$router->add('GET', 'system/google/callback', null, function () {
    $portal = rtrim(config()['portal_url'] ?? (rtrim(setting('company_website'), '/') . '/portal'), '/');
    try {
        if ($error = query('error')) {
            throw new RuntimeException($error === 'access_denied' ? 'Google access was not granted.' : "Google returned an error ({$error}).");
        }
        $conn = gdrive_finish((string) query('code', ''), (string) query('state', ''));
        security_event('google_drive_connected', $conn['connected_by']);
        $target = "{$portal}/automation?drive=connected";
    } catch (RuntimeException $e) {
        error_log('Chromolog Google Drive: ' . $e->getMessage());
        $target = "{$portal}/automation?drive_error=" . rawurlencode($e->getMessage());
    }
    header('Location: ' . $target, true, 302);
    exit;
});

$router->add('DELETE', 'system/google', [ROLE_ADMIN], function () {
    gdrive_disconnect();
    security_event('google_drive_disconnected', (int) current_user()['id']);
});
