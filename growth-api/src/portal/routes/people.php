<?php

declare(strict_types=1);

/** Auth, own profile & API keys, users, settings, dashboard. @var Router $router */

// ── Auth ────────────────────────────────────────────────────────────────

$router->add('POST', 'auth/login', null, function () {
    $b = body();
    $email = str_in($b, 'email', 160, true);
    $password = (string) ($b['password'] ?? '');

    // Slow down guessing: max 10 failed attempts per IP per 15 minutes.
    $ipKey = 'login:' . client_ip_hash();
    $fails = (int) q("SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > datetime('now', '-15 minutes')", [$ipKey])->fetchColumn();
    if ($fails >= 10) {
        throw new ApiError('Too many attempts. Please wait 15 minutes.', 429);
    }

    $user = q('SELECT * FROM users WHERE email = ? AND active = 1', [$email])->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        q('INSERT INTO requests (ip_hash) VALUES (?)', [$ipKey]);
        usleep(400000);
        throw new ApiError('Wrong email or password.', 401);
    }
    $token = issue_token((int) $user['id'], 'login', LOGIN_TOKEN_DAYS);
    return ['token' => $token, 'user' => public_user($user)];
});

$router->add('POST', 'auth/logout', [], function () {
    q('DELETE FROM api_tokens WHERE id = ?', [current_user()['token_id']]);
});

$router->add('GET', 'me', [], fn () => ['user' => public_user(current_user()), 'settings' => public_settings()]);

$router->add('PUT', 'me/password', [], function () {
    $b = body();
    $user = q('SELECT * FROM users WHERE id = ?', [current_user()['id']])->fetch();
    if (!password_verify((string) ($b['current_password'] ?? ''), $user['password_hash'])) {
        throw new ApiError('Current password is wrong.', 422);
    }
    $new = (string) ($b['new_password'] ?? '');
    if (strlen($new) < 8) {
        throw new ApiError('New password must be at least 8 characters.', 422);
    }
    update('users', (int) $user['id'], ['password_hash' => password_hash($new, PASSWORD_DEFAULT)]);
    // Sign out other sessions.
    q('DELETE FROM api_tokens WHERE user_id = ? AND id != ?', [$user['id'], current_user()['token_id']]);
});

// Personal API keys (for submitting daily reports or timesheets from other tools).
$router->add('GET', 'me/api-keys', [], fn () => ['items' => q(
    "SELECT id, label, created_at, expires_at, last_used_at FROM api_tokens WHERE user_id = ? AND label != 'login' ORDER BY id DESC",
    [current_user()['id']]
)->fetchAll()]);

$router->add('POST', 'me/api-keys', [], function () {
    $label = str_in(body(), 'label', 60) ?? 'API key';
    if ($label === 'login') {
        $label = 'API key';
    }
    return ['token' => issue_token((int) current_user()['id'], $label, API_KEY_DAYS), 'note' => 'Copy this key now; it will not be shown again.'];
});

$router->add('DELETE', 'me/api-keys/{id}', [], function ($p) {
    q("DELETE FROM api_tokens WHERE id = ? AND user_id = ? AND label != 'login'", [id_param($p), current_user()['id']]);
});

// ── Users (admin) ───────────────────────────────────────────────────────

$router->add('GET', 'users', [ROLE_ADMIN], fn () => ['items' => array_map(
    'public_user',
    q('SELECT * FROM users ORDER BY active DESC, name')->fetchAll()
)]);

// Lightweight list for assignment dropdowns.
$router->add('GET', 'users/options', [], fn () => ['items' => q(
    'SELECT id, name, role FROM users WHERE active = 1 ORDER BY name'
)->fetchAll()]);

$router->add('POST', 'users', [ROLE_ADMIN], function () {
    $b = body();
    $password = (string) ($b['password'] ?? '');
    if (strlen($password) < 8) {
        throw new ApiError('Password must be at least 8 characters.', 422);
    }
    $email = str_in($b, 'email', 160, true);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ApiError('Please enter a valid email.', 422);
    }
    if (q('SELECT 1 FROM users WHERE email = ?', [$email])->fetchColumn()) {
        throw new ApiError('A user with this email already exists.', 422);
    }
    $id = insert('users', [
        'name' => str_in($b, 'name', 120, true),
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => enum_in($b, 'role', ALL_ROLES, ROLE_EMPLOYEE),
        'phone' => str_in($b, 'phone', 40),
        'hourly_rate' => num_in($b, 'hourly_rate', 0, 0),
    ]);
    audit('create', 'user', $id);
    return ['user' => public_user(find_or_404('users', $id, 'User'))];
});

$router->add('PUT', 'users/{id}', [ROLE_ADMIN], function ($p) {
    $id = id_param($p);
    $user = find_or_404('users', $id, 'User');
    $b = body();
    $data = [];
    foreach (['name' => 120, 'phone' => 40] as $f => $max) {
        if (array_key_exists($f, $b)) {
            $data[$f] = str_in($b, $f, $max, $f === 'name');
        }
    }
    if (array_key_exists('email', $b)) {
        $email = str_in($b, 'email', 160, true);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiError('Please enter a valid email.', 422);
        }
        $data['email'] = $email;
    }
    if (array_key_exists('role', $b)) {
        $data['role'] = enum_in($b, 'role', ALL_ROLES);
    }
    if (array_key_exists('hourly_rate', $b)) {
        $data['hourly_rate'] = num_in($b, 'hourly_rate', 0, 0);
    }
    if (array_key_exists('active', $b)) {
        $data['active'] = $b['active'] ? 1 : 0;
    }
    if ($id === (int) current_user()['id'] && (($data['role'] ?? ROLE_ADMIN) !== ROLE_ADMIN || ($data['active'] ?? 1) === 0)) {
        throw new ApiError('You cannot remove your own admin access.', 422);
    }
    if (!empty($b['password'])) {
        if (strlen((string) $b['password']) < 8) {
            throw new ApiError('Password must be at least 8 characters.', 422);
        }
        $data['password_hash'] = password_hash((string) $b['password'], PASSWORD_DEFAULT);
    }
    update('users', $id, $data);
    if (isset($data['active']) && $data['active'] === 0 || isset($data['password_hash'])) {
        q('DELETE FROM api_tokens WHERE user_id = ?', [$id]);
    }
    audit('update', 'user', $id);
    return ['user' => public_user(find_or_404('users', $id, 'User'))];
});

// ── Settings ────────────────────────────────────────────────────────────

function public_settings(): array
{
    $s = settings_all();
    $s['expense_categories'] = array_values(array_filter(array_map('trim', explode("\n", $s['expense_categories']))));
    $s['income_categories'] = array_values(array_filter(array_map('trim', explode("\n", $s['income_categories']))));
    $s['timezone'] = date_default_timezone_get();
    $s['today'] = today();
    return $s;
}

$router->add('GET', 'settings', [], fn () => ['settings' => public_settings()]);

$router->add('PUT', 'settings', [ROLE_ADMIN], function () {
    $b = body();
    foreach (array_keys(SETTING_DEFAULTS) as $key) {
        if (!array_key_exists($key, $b)) {
            continue;
        }
        $value = is_array($b[$key]) ? implode("\n", array_map('strval', $b[$key])) : (string) $b[$key];
        q('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [$key, mb_substr($value, 0, 4000)]);
    }
    audit('update', 'settings');
    return ['settings' => public_settings()];
});

// ── Dashboard (numbers depend on role) ──────────────────────────────────

$router->add('GET', 'dashboard', [], function () {
    $u = current_user();
    $uid = (int) $u['id'];
    $monthStart = date('Y-m-01');
    $out = ['role' => $u['role']];
    $one = fn (string $sql, array $a = []) => q($sql, $a)->fetchColumn() ?: 0;

    if (has_role(ROLE_MARKETING)) {
        $out['leads'] = [
            'new_this_month' => (int) $one("SELECT COUNT(*) FROM leads WHERE created_at >= ?", [$monthStart]),
            'open' => (int) $one("SELECT COUNT(*) FROM leads WHERE status IN ('new','contacted','meeting','proposal')"),
            'won_this_month' => (int) $one("SELECT COUNT(*) FROM leads WHERE status = 'won' AND updated_at >= ?", [$monthStart]),
            'follow_ups_due' => (int) $one("SELECT COUNT(*) FROM leads WHERE next_follow_up IS NOT NULL AND next_follow_up <= ? AND status NOT IN ('won','lost','spam')", [today()]),
            'by_status' => q("SELECT status, COUNT(*) AS count FROM leads GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR),
        ];
    }
    if (has_role(ROLE_ACCOUNTS)) {
        $income = (float) $one("SELECT COALESCE(SUM(amount),0) FROM payments WHERE date >= ?", [$monthStart])
            + (float) $one("SELECT COALESCE(SUM(amount),0) FROM other_income WHERE date >= ?", [$monthStart]);
        $expense = (float) $one("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date >= ?", [$monthStart]);
        $out['accounts'] = [
            'income_this_month' => money($income),
            'expenses_this_month' => money($expense),
            'net_this_month' => money($income - $expense),
            'outstanding' => money((float) $one("SELECT COALESCE(SUM(total - amount_paid),0) FROM invoices WHERE status IN ('sent','partially_paid')")),
            'overdue_invoices' => (int) $one("SELECT COUNT(*) FROM invoices WHERE status IN ('sent','partially_paid') AND due_date < ?", [today()]),
            'pending_payouts' => money((float) $one("SELECT COALESCE(SUM(total),0) FROM payouts WHERE status = 'pending'")),
            'contracts_expiring' => (int) $one("SELECT COUNT(*) FROM contracts WHERE status = 'active' AND end_date IS NOT NULL AND end_date <= date('now', '+' || renewal_reminder_days || ' days')"),
        ];
    }
    if (has_role(ROLE_PROJECT)) {
        $out['projects'] = [
            'active' => (int) $one("SELECT COUNT(*) FROM projects WHERE status = 'active'"),
            'overdue_tasks' => (int) $one("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date < ?", [today()]),
            'pending_timesheets' => (int) $one("SELECT COUNT(*) FROM timesheets WHERE status = 'pending'"),
            'reports_today' => (int) $one("SELECT COUNT(*) FROM daily_reports WHERE date = ?", [today()]),
            'people' => (int) $one("SELECT COUNT(*) FROM users WHERE active = 1"),
        ];
    }
    // Everyone: own work.
    $out['me'] = [
        'open_tasks' => (int) $one("SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status != 'done'", [$uid]),
        'hours_this_month' => (float) $one("SELECT COALESCE(SUM(hours),0) FROM timesheets WHERE user_id = ? AND date >= ?", [$uid, $monthStart]),
        'report_submitted_today' => (bool) $one("SELECT 1 FROM daily_reports WHERE user_id = ? AND date = ?", [$uid, today()]),
        'unpaid_earnings' => money(unpaid_earnings($uid)),
    ];
    return $out;
});
