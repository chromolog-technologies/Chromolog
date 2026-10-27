<?php

declare(strict_types=1);

/**
 * Projects, tasks, timesheets, daily reports and freelancer payouts.
 * Pay model: approved timesheet hours × rate (project rate, else the person's hourly rate)
 * plus fixed amounts on completed tasks. @var Router $router
 */

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function is_manager(): bool
{
    return has_role(ROLE_PROJECT);
}

function is_member(int $projectId, int $userId): bool
{
    return (bool) q('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [$projectId, $userId])->fetchColumn();
}

function require_project_access(int $projectId): array
{
    $project = find_or_404('projects', $projectId, 'Project');
    if (!is_manager() && !is_member($projectId, (int) current_user()['id'])) {
        throw new ApiError('You are not a member of this project.', 403);
    }
    return $project;
}

/** Sum of approved-but-unpaid hours × rate plus unpaid fixed task amounts. */
function unpaid_earnings(int $userId): float
{
    $hours = (float) q('SELECT COALESCE(SUM(t.hours * COALESCE(pm.rate, u.hourly_rate)),0) FROM timesheets t
        JOIN users u ON u.id = t.user_id LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = t.user_id
        WHERE t.user_id = ? AND t.status = \'approved\' AND t.payout_id IS NULL', [$userId])->fetchColumn();
    $tasks = (float) q("SELECT COALESCE(SUM(fixed_amount),0) FROM tasks WHERE assignee_id = ? AND status = 'done' AND payout_id IS NULL", [$userId])->fetchColumn();
    return money($hours + $tasks);
}

// ── Projects ────────────────────────────────────────────────────────────

function project_data(array $b, bool $creating): array
{
    $d = [];
    if ($creating || array_key_exists('name', $b)) {
        $d['name'] = str_in($b, 'name', 160, true);
    }
    if (array_key_exists('client_id', $b)) {
        $d['client_id'] = ($b['client_id'] ?? null) ? (int) $b['client_id'] : null;
    }
    if (array_key_exists('description', $b)) {
        $d['description'] = str_in($b, 'description', 4000);
    }
    if (array_key_exists('status', $b) || $creating) {
        $d['status'] = enum_in($b, 'status', PROJECT_STATUSES, 'active');
    }
    foreach (['start_date', 'deadline'] as $f) {
        if (array_key_exists($f, $b)) {
            $d[$f] = date_in($b, $f);
        }
    }
    if (array_key_exists('budget', $b)) {
        $d['budget'] = num_in($b, 'budget', 0, 0);
    }
    return $d;
}

$projectSummary = "SELECT p.*, COALESCE(c.company, c.name) AS client,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS tasks_done,
        (SELECT COALESCE(SUM(hours),0) FROM timesheets ts WHERE ts.project_id = p.id) AS hours_logged
    FROM projects p LEFT JOIN clients c ON c.id = p.client_id";

$router->add('GET', 'projects', [], function () use ($projectSummary) {
    $where = ['1=1'];
    $args = [];
    if (!is_manager()) {
        $where[] = 'p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
        $args[] = current_user()['id'];
    }
    if ($s = query('status')) {
        $where[] = 'p.status = ?';
        $args[] = $s;
    }
    return ['items' => q("{$projectSummary} WHERE " . implode(' AND ', $where) . " ORDER BY
        CASE p.status WHEN 'active' THEN 0 WHEN 'planning' THEN 1 WHEN 'on_hold' THEN 2 ELSE 3 END, p.deadline IS NULL, p.deadline", $args)->fetchAll()];
});

$router->add('GET', 'projects/{id}', [], function ($p) use ($projectSummary) {
    $id = id_param($p);
    require_project_access($id);
    $project = q("{$projectSummary} WHERE p.id = ?", [$id])->fetch();
    $members = q('SELECT u.id, u.name, u.role, pm.rate, u.hourly_rate, COALESCE(pm.rate, u.hourly_rate) AS effective_rate,
            (SELECT COALESCE(SUM(hours),0) FROM timesheets t WHERE t.project_id = pm.project_id AND t.user_id = u.id) AS hours
        FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ? ORDER BY u.name', [$id])->fetchAll();
    $tasks = q('SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.project_id = ? ORDER BY CASE t.status WHEN \'in_progress\' THEN 0 WHEN \'review\' THEN 1 WHEN \'todo\' THEN 2 ELSE 3 END, t.due_date IS NULL, t.due_date', [$id])->fetchAll();
    if (!is_manager()) {
        // People only see their own rate and their own fixed task pay.
        $me = (int) current_user()['id'];
        foreach ($members as &$m) {
            if ((int) $m['id'] !== $me) {
                unset($m['rate'], $m['hourly_rate'], $m['effective_rate']);
            }
        }
        unset($m);
        foreach ($tasks as &$t) {
            if ((int) $t['assignee_id'] !== $me) {
                unset($t['fixed_amount']);
            }
        }
        unset($t);
        unset($project['budget']);
    }
    $out = ['project' => $project, 'members' => $members, 'tasks' => $tasks];
    if (has_role(ROLE_PROJECT, ROLE_ACCOUNTS)) {
        // Effort cost so far = approved hours × rate + fixed task amounts done.
        $out['cost'] = [
            'labour' => money((float) q('SELECT COALESCE(SUM(t.hours * COALESCE(pm.rate, u.hourly_rate)),0) FROM timesheets t
                JOIN users u ON u.id = t.user_id LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = t.user_id
                WHERE t.project_id = ? AND t.status = \'approved\'', [$id])->fetchColumn()),
            'fixed_tasks' => money((float) q("SELECT COALESCE(SUM(fixed_amount),0) FROM tasks WHERE project_id = ? AND status = 'done'", [$id])->fetchColumn()),
            'expenses' => money((float) q('SELECT COALESCE(SUM(amount),0) FROM expenses WHERE project_id = ? AND payout_id IS NULL', [$id])->fetchColumn()),
            'invoiced' => money((float) q("SELECT COALESCE(SUM(total),0) FROM invoices WHERE project_id = ? AND status != 'cancelled'", [$id])->fetchColumn()),
        ];
    }
    return $out;
});

$router->add('POST', 'projects', [ROLE_ADMIN], function () {
    $b = body();
    $id = transaction(function () use ($b) {
        $id = insert('projects', project_data($b, true) + ['created_by' => current_user()['id']]);
        foreach ((array) ($b['members'] ?? []) as $m) {
            $uid = (int) (is_array($m) ? ($m['user_id'] ?? 0) : $m);
            if ($uid) {
                q('INSERT IGNORE INTO project_members (project_id, user_id, rate) VALUES (?, ?, ?)', [$id, $uid, is_array($m) ? num_in($m, 'rate', null, 0) : null]);
            }
        }
        return $id;
    });
    audit('create', 'project', $id);
    return ['project' => find_or_404('projects', $id, 'Project')];
});

$router->add('PUT', 'projects/{id}', [ROLE_PROJECT], function ($p) {
    $id = id_param($p);
    find_or_404('projects', $id, 'Project');
    update('projects', $id, project_data(body(), false));
    audit('update', 'project', $id);
    return ['project' => find_or_404('projects', $id, 'Project')];
});

$router->add('DELETE', 'projects/{id}', [ROLE_ADMIN], function ($p) {
    $id = id_param($p);
    if (q('SELECT 1 FROM timesheets WHERE project_id = ? AND payout_id IS NOT NULL', [$id])->fetchColumn()) {
        throw new ApiError('This project has paid timesheets; mark it cancelled or completed instead.', 422);
    }
    transaction(function () use ($id) {
        q('DELETE FROM timesheets WHERE project_id = ?', [$id]);
        q('DELETE FROM projects WHERE id = ?', [$id]);
    });
    audit('delete', 'project', $id);
});

// Replace the member list: [{user_id, rate|null}, ...]
$router->add('PUT', 'projects/{id}/members', [ROLE_PROJECT], function ($p) {
    $id = id_param($p);
    find_or_404('projects', $id, 'Project');
    transaction(function () use ($id) {
        q('DELETE FROM project_members WHERE project_id = ?', [$id]);
        foreach ((array) (body()['members'] ?? []) as $m) {
            $uid = (int) ($m['user_id'] ?? 0);
            if ($uid) {
                q('INSERT IGNORE INTO project_members (project_id, user_id, rate) VALUES (?, ?, ?)', [$id, $uid, num_in((array) $m, 'rate', null, 0)]);
            }
        }
    });
    audit('update', 'project_members', $id);
});

// ── Tasks ───────────────────────────────────────────────────────────────

$router->add('GET', 'tasks', [], function () {
    $where = ['1=1'];
    $args = [];
    if (query('mine') || !is_manager()) {
        $where[] = 't.assignee_id = ?';
        $args[] = current_user()['id'];
    }
    foreach (['project_id' => 't.project_id', 'assignee_id' => 't.assignee_id', 'status' => 't.status'] as $k => $col) {
        if ($s = query($k)) {
            $where[] = "{$col} = ?";
            $args[] = $s;
        }
    }
    if (query('open')) {
        $where[] = "t.status != 'done'";
    }
    return ['items' => q('SELECT t.*, p.name AS project_name, u.name AS assignee_name,
            (SELECT COALESCE(SUM(hours),0) FROM timesheets ts WHERE ts.task_id = t.id) AS hours_logged
        FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id
        WHERE ' . implode(' AND ', $where) . " ORDER BY t.status = 'done', t.due_date IS NULL, t.due_date, t.id DESC LIMIT 1000", $args)->fetchAll()];
});

function task_data(array $b, bool $creating): array
{
    $d = [];
    if ($creating || array_key_exists('title', $b)) {
        $d['title'] = str_in($b, 'title', 200, true);
    }
    if (array_key_exists('description', $b)) {
        $d['description'] = str_in($b, 'description', 4000);
    }
    if (array_key_exists('assignee_id', $b)) {
        $d['assignee_id'] = ($b['assignee_id'] ?? null) ? (int) $b['assignee_id'] : null;
    }
    if (array_key_exists('priority', $b) || $creating) {
        $d['priority'] = enum_in($b, 'priority', TASK_PRIORITIES, 'medium');
    }
    if (array_key_exists('status', $b) || $creating) {
        $d['status'] = enum_in($b, 'status', TASK_STATUSES, 'todo');
    }
    if (array_key_exists('due_date', $b)) {
        $d['due_date'] = date_in($b, 'due_date');
    }
    if (array_key_exists('estimated_hours', $b)) {
        $d['estimated_hours'] = num_in($b, 'estimated_hours', null, 0);
    }
    if (array_key_exists('fixed_amount', $b)) {
        $d['fixed_amount'] = num_in($b, 'fixed_amount', 0, 0);
    }
    return $d;
}

$router->add('POST', 'tasks', [ROLE_PROJECT], function () {
    $b = body();
    $projectId = (int) ($b['project_id'] ?? 0);
    find_or_404('projects', $projectId, 'Project');
    $d = task_data($b, true) + ['project_id' => $projectId, 'created_by' => current_user()['id']];
    if (!empty($d['assignee_id'])) {
        // Assigning someone makes them a project member.
        q('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [$projectId, $d['assignee_id']]);
    }
    if ($d['status'] === 'done') {
        $d['completed_at'] = now_utc();
    }
    $id = insert('tasks', $d);
    audit('create', 'task', $id);
    return ['task' => find_or_404('tasks', $id, 'Task')];
});

$router->add('PUT', 'tasks/{id}', [], function ($p) {
    $id = id_param($p);
    $task = find_or_404('tasks', $id, 'Task');
    $b = body();
    if (is_manager()) {
        $d = task_data($b, false);
    } elseif ((int) $task['assignee_id'] === (int) current_user()['id']) {
        $d = array_intersect_key(task_data($b, false), ['status' => 1]); // assignees may only move status
    } else {
        throw new ApiError('Only the assignee or the project team can update this task.', 403);
    }
    if ($task['payout_id'] && (isset($d['fixed_amount']) || (isset($d['status']) && $d['status'] !== 'done'))) {
        throw new ApiError('This task has been paid out and can no longer change.', 422);
    }
    if (isset($d['status'])) {
        $d['completed_at'] = $d['status'] === 'done' ? ($task['completed_at'] ?: now_utc()) : null;
    }
    if (!empty($d['assignee_id'])) {
        q('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [$task['project_id'], $d['assignee_id']]);
    }
    $d['updated_at'] = now_utc();
    update('tasks', $id, $d);
    audit('update', 'task', $id);
    return ['task' => find_or_404('tasks', $id, 'Task')];
});

$router->add('DELETE', 'tasks/{id}', [ROLE_PROJECT], function ($p) {
    $task = find_or_404('tasks', id_param($p), 'Task');
    if ($task['payout_id']) {
        throw new ApiError('This task has been paid out and cannot be deleted.', 422);
    }
    q('UPDATE timesheets SET task_id = NULL WHERE task_id = ?', [$task['id']]);
    q('DELETE FROM tasks WHERE id = ?', [$task['id']]);
    audit('delete', 'task', (int) $task['id']);
});

// ── Timesheets ──────────────────────────────────────────────────────────

$router->add('GET', 'timesheets', [], function () {
    $where = ['1=1'];
    $args = [];
    if (!is_manager() && !has_role(ROLE_ACCOUNTS) || query('mine')) {
        $where[] = 't.user_id = ?';
        $args[] = current_user()['id'];
    } elseif ($s = query('user_id')) {
        $where[] = 't.user_id = ?';
        $args[] = (int) $s;
    }
    foreach (['project_id' => 't.project_id', 'status' => 't.status'] as $k => $col) {
        if ($s = query($k)) {
            $where[] = "{$col} = ?";
            $args[] = $s;
        }
    }
    if ($s = query('from')) {
        $where[] = 't.date >= ?';
        $args[] = $s;
    }
    if ($s = query('to')) {
        $where[] = 't.date <= ?';
        $args[] = $s;
    }
    $sqlWhere = implode(' AND ', $where);
    $items = q("SELECT t.*, u.name AS user_name, p.name AS project_name, k.title AS task_title
        FROM timesheets t JOIN users u ON u.id = t.user_id JOIN projects p ON p.id = t.project_id LEFT JOIN tasks k ON k.id = t.task_id
        WHERE {$sqlWhere} ORDER BY t.date DESC, t.id DESC LIMIT 1000", $args)->fetchAll();
    $hours = (float) q("SELECT COALESCE(SUM(t.hours),0) FROM timesheets t WHERE {$sqlWhere}", $args)->fetchColumn();
    return ['items' => $items, 'total_hours' => $hours];
});

function timesheet_data(array $b, bool $creating): array
{
    $d = [];
    if ($creating || array_key_exists('project_id', $b)) {
        $d['project_id'] = (int) ($b['project_id'] ?? 0);
        require_project_access($d['project_id']);
    }
    if (array_key_exists('task_id', $b)) {
        $d['task_id'] = ($b['task_id'] ?? null) ? (int) $b['task_id'] : null;
    }
    if ($creating || array_key_exists('date', $b)) {
        $d['date'] = date_in($b, 'date') ?? today();
        if ($d['date'] > today()) {
            throw new ApiError('You cannot log time for a future date.', 422);
        }
    }
    if ($creating || array_key_exists('hours', $b)) {
        $hours = num_in($b, 'hours', null, 0.25);
        if ($hours === null || $hours > 24) {
            throw new ApiError('Hours must be between 0.25 and 24.', 422);
        }
        $d['hours'] = $hours;
    }
    if (array_key_exists('description', $b)) {
        $d['description'] = str_in($b, 'description', 2000);
    }
    if (!empty($d['task_id'])) {
        $task = find_or_404('tasks', $d['task_id'], 'Task');
        if (isset($d['project_id']) && (int) $task['project_id'] !== $d['project_id']) {
            throw new ApiError('That task belongs to a different project.', 422);
        }
    }
    return $d;
}

$router->add('POST', 'timesheets', [], function () {
    $id = insert('timesheets', timesheet_data(body(), true) + ['user_id' => current_user()['id']]);
    return ['timesheet' => find_or_404('timesheets', $id, 'Timesheet')];
});

function own_pending_timesheet(int $id): array
{
    $t = find_or_404('timesheets', $id, 'Timesheet');
    if ((int) $t['user_id'] !== (int) current_user()['id'] && !is_manager()) {
        throw new ApiError('You can only change your own entries.', 403);
    }
    if ($t['status'] !== 'pending' || $t['payout_id']) {
        throw new ApiError('Only pending entries can be changed.', 422);
    }
    return $t;
}

$router->add('PUT', 'timesheets/{id}', [], function ($p) {
    $t = own_pending_timesheet(id_param($p));
    update('timesheets', (int) $t['id'], timesheet_data(body(), false));
    return ['timesheet' => find_or_404('timesheets', (int) $t['id'], 'Timesheet')];
});

$router->add('DELETE', 'timesheets/{id}', [], function ($p) {
    $t = own_pending_timesheet(id_param($p));
    q('DELETE FROM timesheets WHERE id = ?', [$t['id']]);
});

// Approve / reject one or many: {ids: [..], status: approved|rejected}
$router->add('POST', 'timesheets/review', [ROLE_PROJECT], function () {
    $b = body();
    $status = enum_in($b, 'status', ['approved', 'rejected', 'pending']);
    $ids = array_values(array_filter(array_map('intval', (array) ($b['ids'] ?? []))));
    if (!$status || !$ids) {
        throw new ApiError('Choose entries and a status.', 422);
    }
    $in = implode(',', array_fill(0, count($ids), '?'));
    $n = q("UPDATE timesheets SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id IN ({$in}) AND payout_id IS NULL", [$status, current_user()['id'], ...$ids])->rowCount();
    audit("review:{$status}", 'timesheets', null);
    return ['updated' => $n];
});

// ── Daily reports (also the external API for employees) ─────────────────

$router->add('POST', 'reports', [], function () {
    $b = body();
    $date = date_in($b, 'date') ?? today();
    if ($date > today() || $date < date('Y-m-d', strtotime('-7 days'))) {
        throw new ApiError('Reports can be submitted for today or the last 7 days.', 422);
    }
    $data = [
        'summary' => str_in($b, 'summary', 4000, true),
        'tasks_completed' => str_in($b, 'tasks_completed', 4000),
        'blockers' => str_in($b, 'blockers', 2000),
        'plan_tomorrow' => str_in($b, 'plan_tomorrow', 2000),
        'hours' => num_in($b, 'hours', null, 0),
    ];
    $uid = (int) current_user()['id'];
    $existing = q('SELECT id FROM daily_reports WHERE user_id = ? AND date = ?', [$uid, $date])->fetchColumn();
    if ($existing) {
        update('daily_reports', (int) $existing, $data + ['updated_at' => now_utc()]);
        $id = (int) $existing;
    } else {
        $id = insert('daily_reports', $data + ['user_id' => $uid, 'date' => $date]);
    }
    return ['report' => find_or_404('daily_reports', $id, 'Report'), 'updated' => (bool) $existing];
});

$router->add('GET', 'reports', [], function () {
    $where = ['1=1'];
    $args = [];
    if (!is_manager() || query('mine')) {
        $where[] = 'r.user_id = ?';
        $args[] = current_user()['id'];
    } elseif ($s = query('user_id')) {
        $where[] = 'r.user_id = ?';
        $args[] = (int) $s;
    }
    if ($s = query('date')) {
        $where[] = 'r.date = ?';
        $args[] = $s;
    }
    if ($s = query('from')) {
        $where[] = 'r.date >= ?';
        $args[] = $s;
    }
    if ($s = query('to')) {
        $where[] = 'r.date <= ?';
        $args[] = $s;
    }
    return ['items' => q('SELECT r.*, u.name AS user_name, u.role AS user_role FROM daily_reports r JOIN users u ON u.id = r.user_id
        WHERE ' . implode(' AND ', $where) . ' ORDER BY r.date DESC, u.name LIMIT 500', $args)->fetchAll()];
});

// Who has not submitted a report for a date (default today).
$router->add('GET', 'reports/missing', [ROLE_PROJECT], function () {
    $date = query('date') ?? today();
    return ['date' => $date, 'items' => q("SELECT id, name, role FROM users WHERE active = 1 AND role != 'admin'
        AND id NOT IN (SELECT user_id FROM daily_reports WHERE date = ?) ORDER BY name", [$date])->fetchAll()];
});

// ── Payouts (freelancer pay from effort) ────────────────────────────────

/** Unpaid approved hours and completed fixed-price tasks for a person within a period. */
function payout_lines(int $userId, string $from, string $to): array
{
    $timesheets = q('SELECT t.id, t.date, t.hours, t.description, p.name AS project_name, k.title AS task_title,
            COALESCE(pm.rate, u.hourly_rate) AS rate, ROUND(t.hours * COALESCE(pm.rate, u.hourly_rate), 2) AS amount
        FROM timesheets t JOIN users u ON u.id = t.user_id JOIN projects p ON p.id = t.project_id
        LEFT JOIN tasks k ON k.id = t.task_id LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = t.user_id
        WHERE t.user_id = ? AND t.status = \'approved\' AND t.payout_id IS NULL AND t.date BETWEEN ? AND ? ORDER BY t.date', [$userId, $from, $to])->fetchAll();
    $tasks = q("SELECT k.id, k.title, k.fixed_amount AS amount, k.completed_at, p.name AS project_name FROM tasks k JOIN projects p ON p.id = k.project_id
        WHERE k.assignee_id = ? AND k.status = 'done' AND k.fixed_amount > 0 AND k.payout_id IS NULL AND date(k.completed_at) BETWEEN ? AND ?", [$userId, $from, $to])->fetchAll();
    return [
        'timesheets' => $timesheets,
        'tasks' => $tasks,
        'hours' => round(array_sum(array_column($timesheets, 'hours')), 2),
        'hours_amount' => money(array_sum(array_column($timesheets, 'amount'))),
        'task_amount' => money(array_sum(array_column($tasks, 'amount'))),
    ];
}

$payoutRoles = [ROLE_ACCOUNTS];

$router->add('GET', 'payouts/preview', $payoutRoles, function () {
    $userId = (int) (query('user_id') ?? 0);
    find_or_404('users', $userId, 'Person');
    $lines = payout_lines($userId, query('from') ?? date('Y-m-01'), query('to') ?? today());
    return $lines + ['total' => money($lines['hours_amount'] + $lines['task_amount'])];
});

$router->add('GET', 'payouts', $payoutRoles, function () {
    $args = [];
    $where = '1=1';
    if ($s = query('status')) {
        $where = 'po.status = ?';
        $args[] = $s;
    }
    return ['items' => q("SELECT po.*, u.name AS user_name FROM payouts po JOIN users u ON u.id = po.user_id WHERE {$where} ORDER BY po.id DESC LIMIT 500", $args)->fetchAll()];
});

$router->add('POST', 'payouts', $payoutRoles, function () {
    $b = body();
    $userId = (int) ($b['user_id'] ?? 0);
    find_or_404('users', $userId, 'Person');
    $from = date_in($b, 'period_start', true);
    $to = date_in($b, 'period_end', true);
    $adjust = num_in($b, 'adjustments', 0);
    $id = transaction(function () use ($userId, $from, $to, $adjust, $b) {
        $lines = payout_lines($userId, $from, $to);
        $total = money($lines['hours_amount'] + $lines['task_amount'] + $adjust);
        if ($total <= 0) {
            throw new ApiError('Nothing to pay for this person in this period.', 422);
        }
        $id = insert('payouts', [
            'user_id' => $userId, 'period_start' => $from, 'period_end' => $to,
            'hours' => $lines['hours'], 'hours_amount' => $lines['hours_amount'], 'task_amount' => $lines['task_amount'],
            'adjustments' => $adjust, 'total' => $total, 'notes' => str_in($b, 'notes', 2000), 'created_by' => current_user()['id'],
        ]);
        foreach ($lines['timesheets'] as $t) {
            q('UPDATE timesheets SET payout_id = ? WHERE id = ?', [$id, $t['id']]);
        }
        foreach ($lines['tasks'] as $t) {
            q('UPDATE tasks SET payout_id = ? WHERE id = ?', [$id, $t['id']]);
        }
        return $id;
    });
    audit('create', 'payout', $id);
    return ['payout' => find_or_404('payouts', $id, 'Payout')];
});

$router->add('GET', 'payouts/{id}', $payoutRoles, function ($p) {
    $po = find_or_404('payouts', id_param($p), 'Payout');
    $po['user_name'] = q('SELECT name FROM users WHERE id = ?', [$po['user_id']])->fetchColumn();
    return [
        'payout' => $po,
        'timesheets' => q('SELECT t.date, t.hours, t.description, p.name AS project_name FROM timesheets t JOIN projects p ON p.id = t.project_id WHERE t.payout_id = ? ORDER BY t.date', [$po['id']])->fetchAll(),
        'tasks' => q('SELECT k.title, k.fixed_amount, p.name AS project_name FROM tasks k JOIN projects p ON p.id = k.project_id WHERE k.payout_id = ?', [$po['id']])->fetchAll(),
    ];
});

// Mark paid → records the matching expense automatically.
$router->add('POST', 'payouts/{id}/pay', $payoutRoles, function ($p) {
    $po = find_or_404('payouts', id_param($p), 'Payout');
    if ($po['status'] === 'paid') {
        throw new ApiError('This payout is already paid.', 422);
    }
    $b = body();
    $date = date_in($b, 'paid_date') ?? today();
    $method = enum_in($b, 'payment_method', MONEY_METHODS, 'bank_transfer');
    transaction(function () use ($po, $b, $date, $method) {
        $name = q('SELECT name FROM users WHERE id = ?', [$po['user_id']])->fetchColumn();
        $expenseId = insert('expenses', [
            'date' => $date, 'category' => 'Freelancer Payouts', 'vendor' => $name,
            'description' => "Payout #{$po['id']} for {$po['period_start']} to {$po['period_end']}",
            'amount' => $po['total'], 'payment_method' => $method, 'reference' => str_in($b, 'reference', 120),
            'payout_id' => $po['id'], 'created_by' => current_user()['id'],
        ]);
        update('payouts', (int) $po['id'], ['status' => 'paid', 'paid_date' => $date, 'payment_method' => $method,
            'reference' => str_in($b, 'reference', 120), 'expense_id' => $expenseId]);
    });
    audit('pay', 'payout', (int) $po['id']);
    return ['payout' => find_or_404('payouts', (int) $po['id'], 'Payout')];
});

$router->add('DELETE', 'payouts/{id}', $payoutRoles, function ($p) {
    $po = find_or_404('payouts', id_param($p), 'Payout');
    if ($po['status'] === 'paid') {
        throw new ApiError('Paid payouts cannot be deleted.', 422);
    }
    transaction(function () use ($po) {
        q('UPDATE timesheets SET payout_id = NULL WHERE payout_id = ?', [$po['id']]);
        q('UPDATE tasks SET payout_id = NULL WHERE payout_id = ?', [$po['id']]);
        q('DELETE FROM payouts WHERE id = ?', [$po['id']]);
    });
    audit('delete', 'payout', (int) $po['id']);
});

// Own earnings for any signed-in person.
$router->add('GET', 'me/earnings', [], function () {
    $uid = (int) current_user()['id'];
    return [
        'unpaid' => unpaid_earnings($uid),
        'pending_approval_hours' => (float) q("SELECT COALESCE(SUM(hours),0) FROM timesheets WHERE user_id = ? AND status = 'pending'", [$uid])->fetchColumn(),
        'payouts' => q('SELECT id, period_start, period_end, hours, total, status, paid_date FROM payouts WHERE user_id = ? ORDER BY id DESC', [$uid])->fetchAll(),
    ];
});
