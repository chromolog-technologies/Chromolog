<?php

declare(strict_types=1);

/**
 * Daily automation, run once a day by cron (growth-api/cron.php) or by an admin from the portal:
 *   1. create due recurring invoices
 *   2. back up the database and uploads
 *   3. email each person a digest of what needs their attention
 * Each job runs at most once per business date unless forced.
 */

const DAILY_JOBS = ['recurring', 'backup', 'digest'];

function run_daily_jobs(bool $force = false): array
{
    $results = [];
    $context = ['invoices_created' => []];
    sync_overdue();
    foreach (DAILY_JOBS as $job) {
        $done = q("SELECT 1 FROM job_runs WHERE job = ? AND run_date = ? AND status = 'ok'", [$job, today()])->fetchColumn();
        if ($done && !$force) {
            $results[$job] = ['status' => 'skipped', 'detail' => 'Already ran today'];
            continue;
        }
        try {
            $detail = match ($job) {
                'recurring' => $context['invoices_created'] = generate_recurring_invoices(),
                'backup' => run_backup(),
                'digest' => send_digests($context),
            };
            $results[$job] = ['status' => 'ok', 'detail' => $detail];
        } catch (Throwable $e) {
            error_log("Chromolog daily job {$job} failed: " . $e->getMessage());
            $results[$job] = ['status' => 'error', 'detail' => $e->getMessage()];
        }
        q('INSERT INTO job_runs (job, run_date, status, detail) VALUES (?, ?, ?, ?)',
            [$job, today(), $results[$job]['status'], json_encode($results[$job]['detail'], JSON_UNESCAPED_UNICODE)]);
    }
    return $results;
}

// ── 1. Recurring invoices ───────────────────────────────────────────────

const RECURRING_FREQUENCIES = ['monthly' => 1, 'quarterly' => 3, 'half_yearly' => 6, 'yearly' => 12];

/**
 * Add whole months on the given billing day, clamped to the month's last day:
 * anchor 31 → 31 Jan, 28 Feb, 31 Mar, 30 Apr …
 */
function add_months(string $date, int $months, ?int $anchorDay = null): string
{
    [$y, $m, $d] = array_map('intval', explode('-', $date));
    $d = $anchorDay ?: $d;
    $m += $months;
    $y += intdiv($m - 1, 12);
    $m = ($m - 1) % 12 + 1;
    $last = (int) date('t', mktime(0, 0, 0, $m, 1, $y));
    return sprintf('%04d-%02d-%02d', $y, $m, min($d, $last));
}

/** Create one invoice from a recurring template (issued at once if auto-send is on) and advance its next date. */
function issue_recurring_invoice(array $r): int
{
    $issue = $r['next_date'];
    [$data, $items] = invoice_input([
        'client_id' => $r['client_id'],
        'items' => document_items('recurring_items', 'recurring_id', (int) $r['id']),
        'issue_date' => $issue,
        // Payment terms count from when the client actually receives it (catch-up invoices are issued today).
        'due_date' => date('Y-m-d', strtotime(max($issue, today()) . ' +' . (int) setting('payment_terms_days') . ' days')),
        'notes' => $r['notes'],
        'terms' => setting('invoice_terms'),
    ], 'invoice');
    $invoiceId = invoice_insert($data + ['doc_type' => 'invoice', 'status' => 'draft', 'recurring_id' => $r['id'], 'created_by' => $r['created_by']], $items);
    invoice_log($invoiceId, 'created', "Recurring schedule: {$r['title']}");
    if ($r['auto_send']) {
        issue_invoice($invoiceId);
    }

    $next = add_months($r['next_date'], RECURRING_FREQUENCIES[$r['frequency']] ?? 1, $r['anchor_day'] ? (int) $r['anchor_day'] : null);
    $active = $r['end_date'] && $next > $r['end_date'] ? 0 : 1;
    update('recurring_invoices', (int) $r['id'], ['next_date' => $next, 'last_invoice_id' => $invoiceId, 'active' => $active]);
    return $invoiceId;
}

/** @return list<array{id: int, number: string, client: string, total: float}> */
function generate_recurring_invoices(): array
{
    $created = [];
    $due = q("SELECT * FROM recurring_invoices WHERE active = 1 AND next_date <= ? AND (end_date IS NULL OR next_date <= end_date)", [today()])->fetchAll();
    foreach ($due as $r) {
        // Catch up missed periods (e.g. the job didn't run for a while), at most 12 at once.
        for ($i = 0; $i < 12 && $r['active'] && $r['next_date'] <= today() && (!$r['end_date'] || $r['next_date'] <= $r['end_date']); $i++) {
            $invoiceId = transaction(fn () => issue_recurring_invoice($r));
            $inv = q("SELECT i.id, i.number, i.total, COALESCE(c.company, c.name) AS client FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?", [$invoiceId])->fetch();
            $created[] = $inv;
            $r = find_or_404('recurring_invoices', (int) $r['id'], 'Recurring invoice');
        }
    }
    return $created;
}

// ── 2. Backup ───────────────────────────────────────────────────────────

function backup_dir(): string
{
    $dir = rtrim(config()['backup_path'] ?? (dirname(config()['db_path']) . '/backups'), '/');
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException('Backup folder is not writable.');
    }
    return $dir;
}

/** Zip a consistent database snapshot plus all uploaded files; keep the newest N backups. */
function run_backup(): array
{
    $dir = backup_dir();
    $stamp = date('Y-m-d_His');
    $snapshot = "{$dir}/db-{$stamp}.sqlite";
    // VACUUM INTO writes a consistent copy even while the portal is in use.
    db()->exec('VACUUM INTO ' . db()->quote($snapshot));

    $zipPath = "{$dir}/chromolog-backup-{$stamp}.zip";
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        @unlink($snapshot);
        throw new RuntimeException('Could not create the backup archive.');
    }
    $zip->addFile($snapshot, 'database.sqlite');
    $files = 0;
    $uploads = upload_root();
    if (is_dir($uploads)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploads, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if ($file->isFile()) {
                $zip->addFile($file->getPathname(), 'uploads/' . substr($file->getPathname(), strlen($uploads) + 1));
                $files++;
            }
        }
    }
    $zip->close();
    @unlink($snapshot);

    $keep = max(1, (int) (config()['backup_keep'] ?? 14));
    $all = glob("{$dir}/chromolog-backup-*.zip") ?: [];
    rsort($all);
    foreach (array_slice($all, $keep) as $old) {
        @unlink($old);
    }
    return ['file' => basename($zipPath), 'size' => filesize($zipPath), 'uploads' => $files, 'kept' => min(count($all), $keep)];
}

function list_backups(): array
{
    $files = glob(backup_dir() . '/chromolog-backup-*.zip') ?: [];
    rsort($files);
    return array_map(fn ($f) => ['file' => basename($f), 'size' => filesize($f), 'created_at' => gmdate('Y-m-d H:i:s', filemtime($f))], $files);
}

// ── 3. Daily digests ────────────────────────────────────────────────────

function send_digests(array $context): array
{
    if (setting('reminders_enabled') !== '1') {
        return ['sent' => 0, 'note' => 'Reminders are switched off in settings'];
    }
    $today = today();
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $reportDays = array_map('intval', explode(',', setting('report_days')));
    $checkReports = in_array((int) date('N', strtotime($yesterday)), $reportDays, true);
    $portal = rtrim(setting('company_website'), '/') . '/portal';

    // Shared data, computed once.
    $overdueInvoices = q("SELECT i.number, i.due_date, ROUND(i.total + i.adjustment - i.amount_paid, 2) AS balance, COALESCE(c.company, c.name) AS client
        FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.doc_type = 'invoice' AND i.status IN ('issued','partially_paid','overdue') AND i.due_date < ? ORDER BY i.due_date", [$today])->fetchAll();
    $renewals = array_values(array_filter(
        q("SELECT k.title, k.end_date, k.renewal_reminder_days, COALESCE(c.company, c.name) AS client FROM contracts k JOIN clients c ON c.id = k.client_id
            WHERE k.status = 'active' AND k.end_date IS NOT NULL")->fetchAll(),
        function ($k) use ($today) {
            $days = (int) round((strtotime($k['end_date']) - strtotime($today)) / 86400);
            return $days === -1 || ($days >= 0 && $days <= (int) $k['renewal_reminder_days'] && in_array($days, [(int) $k['renewal_reminder_days'], 14, 7, 3, 1, 0], true));
        }
    ));
    $pendingPayouts = (float) q("SELECT COALESCE(SUM(total),0) FROM payouts WHERE status = 'pending'")->fetchColumn();
    $missing = $checkReports ? q("SELECT id, name FROM users WHERE active = 1 AND role != 'admin' AND id NOT IN (SELECT user_id FROM daily_reports WHERE date = ?) ORDER BY name", [$yesterday])->fetchAll() : [];
    $pendingTimesheets = (int) q("SELECT COUNT(*) FROM timesheets WHERE status = 'pending'")->fetchColumn();
    $overdueTasksAll = (int) q("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date < ?", [$today])->fetchColumn();
    $breached = q("SELECT t.number, t.subject, t.priority, u.name AS assignee FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.status NOT IN ('resolved','closed') AND ((t.first_response_at IS NULL AND t.response_due_at < ?) OR t.resolve_due_at < ?) ORDER BY t.priority = 'urgent' DESC, t.resolve_due_at",
        [now_utc(), now_utc()])->fetchAll();
    $created = $context['invoices_created'] ?? [];

    $sent = 0;
    $users = q('SELECT * FROM users WHERE active = 1')->fetchAll();
    foreach ($users as $u) {
        $role = $u['role'];
        $isAdmin = $role === ROLE_ADMIN;
        $sections = [];

        if ($isAdmin || $role === ROLE_MARKETING) {
            $follow = q("SELECT full_name, company, next_follow_up, status FROM leads WHERE next_follow_up <= ? AND status NOT IN ('won','lost','spam')
                AND (? OR assigned_to = ? OR (assigned_to IS NULL AND ?)) ORDER BY next_follow_up LIMIT 20",
                [$today, $isAdmin ? 1 : 0, $u['id'], $role === ROLE_MARKETING ? 1 : 0])->fetchAll();
            if ($follow) {
                $sections[] = digest_section('Lead follow-ups due', array_map(fn ($l) => "{$l['full_name']}" . ($l['company'] ? " ({$l['company']})" : '') . " — {$l['status']}, due {$l['next_follow_up']}", $follow));
            }
        }
        if ($isAdmin || $role === ROLE_ACCOUNTS) {
            if ($overdueInvoices) {
                $sections[] = digest_section('Overdue invoices', array_map(fn ($i) => "{$i['number']} · {$i['client']} · balance " . fmt_money($i['balance']) . " · due {$i['due_date']}", $overdueInvoices));
            }
            if ($created) {
                $sections[] = digest_section('Recurring invoices created today', array_map(fn ($i) => "{$i['number']} · {$i['client']} · " . fmt_money($i['total']), $created));
            }
            if ($renewals) {
                $sections[] = digest_section('Contract renewals', array_map(fn ($k) => "{$k['title']} · {$k['client']} · ends {$k['end_date']}", $renewals));
            }
            if ($pendingPayouts > 0) {
                $sections[] = digest_section('Freelancer payouts to pay', ['Total pending: ' . fmt_money($pendingPayouts)]);
            }
        }
        if ($isAdmin || $role === ROLE_PROJECT) {
            if ($missing) {
                $sections[] = digest_section("No daily report for {$yesterday}", array_column($missing, 'name'));
            }
            $team = [];
            if ($pendingTimesheets) {
                $team[] = "{$pendingTimesheets} timesheet entries waiting for approval";
            }
            if ($overdueTasksAll) {
                $team[] = "{$overdueTasksAll} overdue tasks across projects";
            }
            if ($team) {
                $sections[] = digest_section('Team', $team);
            }
            if ($breached) {
                $sections[] = digest_section('Support tickets past their response/resolution target', array_map(fn ($t) => "{$t['number']} [{$t['priority']}] {$t['subject']} — " . ($t['assignee'] ?: 'unassigned'), $breached));
            }
        }

        // Personal items for everyone.
        $mine = [];
        if (!$isAdmin && $checkReports && in_array((int) $u['id'], array_map('intval', array_column($missing, 'id')), true)) {
            $mine[] = "You haven't submitted your daily report for {$yesterday}. You can still add it: {$portal}/my/report";
        }
        foreach (q("SELECT t.title, t.due_date, p.name AS project FROM tasks t JOIN projects p ON p.id = t.project_id
            WHERE t.assignee_id = ? AND t.status != 'done' AND t.due_date <= ? ORDER BY t.due_date LIMIT 15", [$u['id'], $today])->fetchAll() as $t) {
            $mine[] = ($t['due_date'] < $today ? 'Overdue' : 'Due today') . ": {$t['title']} ({$t['project']}, {$t['due_date']})";
        }
        foreach (q("SELECT number, subject, priority FROM tickets WHERE assignee_id = ? AND status NOT IN ('resolved','closed') ORDER BY id", [$u['id']])->fetchAll() as $t) {
            $mine[] = "Open ticket {$t['number']} [{$t['priority']}]: {$t['subject']}";
        }
        if ($mine) {
            $sections[] = digest_section('Your to-do', $mine);
        }

        if (!$sections) {
            continue;
        }
        $first = explode(' ', trim($u['name']))[0];
        $body = "Hi {$first},\n\nHere's what needs attention today ({$today}).\n\n" . implode("\n", $sections)
            . "\nOpen the portal: {$portal}\n\n— Chromolog Growth OS (daily digest)\n";
        if (send_email($u['email'], 'Your Chromolog daily digest — ' . date('j M', strtotime($today)), $body)) {
            $sent++;
        }
    }
    return ['sent' => $sent, 'users' => count($users)];
}

function digest_section(string $title, array $lines): string
{
    return strtoupper($title) . "\n" . implode('', array_map(fn ($l) => "  • {$l}\n", $lines));
}

function fmt_money(float|string $n): string
{
    return trim(setting('currency_symbol') . number_format((float) $n, 2));
}
