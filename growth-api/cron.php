<?php

declare(strict_types=1);

/**
 * Daily automation for the company portal. Run once a day from Hostinger cron
 * (hPanel → Advanced → Cron Jobs), e.g. at 08:00 India time:
 *   /usr/bin/php /home/u818464796/domains/chromologtechnologies.com/public_html/api/ai/cron.php
 * Add --force to run again on the same day. Command-line only.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Forbidden');
}

require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/mailer.php';
require __DIR__ . '/src/portal/core.php';
require __DIR__ . '/src/portal/security.php';
require __DIR__ . '/src/portal/jobs.php';

// Route files define helpers the jobs reuse (invoice lines, transactions).
$router = new Router();
foreach (['people', 'crm', 'sales', 'accounting', 'projects', 'recurring', 'tickets', 'system'] as $module) {
    require __DIR__ . "/src/portal/routes/{$module}.php";
}

$results = run_daily_jobs(in_array('--force', $argv, true));
foreach ($results as $job => $r) {
    echo str_pad($job, 10) . strtoupper($r['status']) . '  ' . json_encode($r['detail'], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
exit(in_array('error', array_column($results, 'status'), true) ? 1 : 0);
