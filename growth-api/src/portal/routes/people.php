<?php

declare(strict_types=1);

/** Auth, own profile & API keys, users, settings, dashboard. @var Router $router */

// ── Auth ────────────────────────────────────────────────────────────────

// Used to spend the same time verifying when the email doesn't exist (no user enumeration).
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=4,p=1$ZVViQ2o5Q0Q4akc0amxyRA$EdSTUDXQVdn1ZnjYy0gmkuVOSjPYpT7VS31vLezoDh4';

$router->add('POST', 'auth/login', null, function () {
    $b = body();
    $email = str_in($b, 'email', 160, true);
    $password = (string) ($b['password'] ?? '');
    $remember = !empty($b['remember']);

    // Per-IP limit: 10 failed attempts per 15 minutes, whatever the email.
    $ipKey = 'login:' . client_ip_hash();
    $ipFails = (int) q('SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > ?', [$ipKey, utc_at('-15 minutes')])->fetchColumn();
    if ($ipFails >= 10) {
        throw new ApiError('Too many sign-in attempts from this network. Please wait 15 minutes.', 429);
    }

    $user = q('SELECT * FROM users WHERE email = ? AND active = 1', [$email])->fetch();
    if ($user && $user['locked_until'] && strtotime($user['locked_until'] . ' UTC') > time()) {
        $mins = (int) ceil((strtotime($user['locked_until'] . ' UTC') - time()) / 60);
        q('INSERT INTO requests (ip_hash) VALUES (?)', [$ipKey]);
        throw new ApiError("This account is locked after too many wrong passwords. Try again in {$mins} minute(s), or ask an admin to unlock it.", 429);
    }

    $ok = password_verify($password, $user ? $user['password_hash'] : DUMMY_HASH);
    if (!$user || !$ok) {
        q('INSERT INTO requests (ip_hash) VALUES (?)', [$ipKey]);
        if ($user) {
            $fails = (int) $user['failed_logins'] + 1;
            if ($fails >= LOCKOUT_ATTEMPTS) {
                q('UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?', [utc_at('+' . LOCKOUT_MINUTES . ' minutes'), $user['id']]);
                security_event('account_locked', (int) $user['id'], LOCKOUT_ATTEMPTS . ' wrong passwords');
            } else {
                q('UPDATE users SET failed_logins = ? WHERE id = ?', [$fails, $user['id']]);
            }
        }
        security_event('login_failed', $user ? (int) $user['id'] : null, mask_email($email));
        usleep(300000);
        throw new ApiError('Wrong email or password.', 401);
    }

    $update = ['failed_logins' => 0, 'locked_until' => null, 'last_login_at' => now_utc()];
    if (password_needs_upgrade($user['password_hash'])) {
        $update['password_hash'] = hash_password($password); // upgrade old bcrypt hashes to Argon2id
    }
    update('users', (int) $user['id'], $update);
    security_event('login', (int) $user['id']);

    $token = start_session((int) $user['id'], $remember);
    // Scripts may ask for the token in the body; the portal gets an HttpOnly cookie only.
    if (!empty($b['api_client'])) {
        return ['token' => $token, 'user' => public_user($user)];
    }
    set_session_cookie($token, $remember);
    return ['user' => public_user($user)];
});

$router->add('POST', 'auth/logout', [], function () {
    q('DELETE FROM api_tokens WHERE id = ?', [current_user()['token_id']]);
    clear_session_cookie();
    security_event('logout', (int) current_user()['id']);
});

$router->add('GET', 'me', [], fn () => ['user' => public_user(current_user()), 'settings' => public_settings()]);

// Password rules for the UI checklist (the server enforces them on every change).
$router->add('GET', 'auth/password-policy', null, fn () => ['min_length' => PASSWORD_MIN_LENGTH, 'max_length' => PASSWORD_MAX_LENGTH]);

$router->add('PUT', 'me/password', [], function () {
    $b = body();
    $user = q('SELECT * FROM users WHERE id = ?', [current_user()['id']])->fetch();
    if (!password_verify((string) ($b['current_password'] ?? ''), $user['password_hash'])) {
        security_event('password_change_failed', (int) $user['id'], 'wrong current password');
        throw new ApiError('Current password is wrong.', 422);
    }
    $new = (string) ($b['new_password'] ?? '');
    if (hash_equals((string) ($b['current_password'] ?? ''), $new)) {
        throw new ApiError('The new password must be different from the current one.', 422);
    }
    assert_strong_password($new, $user);
    update('users', (int) $user['id'], [
        'password_hash' => hash_password($new), 'must_change_password' => 0, 'password_changed_at' => now_utc(),
    ]);
    // Sign out every other session and API key holder of the old password's sessions.
    q("DELETE FROM api_tokens WHERE user_id = ? AND id != ? AND kind != 'api_key'", [$user['id'], current_user()['token_id']]);
    security_event('password_changed', (int) $user['id']);
});

// Personal API keys (for submitting daily reports or timesheets from other tools).
$router->add('GET', 'me/api-keys', [], fn () => ['items' => q(
    "SELECT id, label, created_at, expires_at, last_used_at FROM api_tokens WHERE user_id = ? AND kind = 'api_key' ORDER BY id DESC",
    [current_user()['id']]
)->fetchAll()]);

$router->add('POST', 'me/api-keys', [], function () {
    $label = str_in(body(), 'label', 60) ?? 'API key';
    $count = (int) q("SELECT COUNT(*) FROM api_tokens WHERE user_id = ? AND kind = 'api_key' AND expires_at > UTC_TIMESTAMP()", [current_user()['id']])->fetchColumn();
    if ($count >= 5) {
        throw new ApiError('You already have 5 API keys. Revoke one first.', 422);
    }
    $token = issue_token((int) current_user()['id'], $label, API_KEY_DAYS);
    security_event('api_key_created', (int) current_user()['id'], $label);
    return ['token' => $token, 'note' => 'Copy this key now; it will not be shown again.'];
});

$router->add('DELETE', 'me/api-keys/{id}', [], function ($p) {
    q("DELETE FROM api_tokens WHERE id = ? AND user_id = ? AND kind = 'api_key'", [id_param($p), current_user()['id']]);
    security_event('api_key_revoked', (int) current_user()['id']);
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

function assert_unique_email(string $email, ?int $exceptId = null): void
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ApiError('Please enter a valid email.', 422);
    }
    if (q('SELECT 1 FROM users WHERE email = ? AND id != ?', [$email, $exceptId ?? 0])->fetchColumn()) {
        throw new ApiError('A user with this email already exists.', 422);
    }
}

// ── Activation and password-reset links ─────────────────────────────────

const LINK_HOURS = ['invite' => 7 * 24, 'reset' => 24];

function portal_url(): string
{
    return rtrim(config()['portal_url'] ?? (rtrim(setting('company_website'), '/') . '/portal'), '/');
}

/**
 * Email a one-time link: 'invite' activates a new account, 'reset' sets a new password.
 * Earlier unused links for the person stop working. Sent from the company mailbox (info@).
 */
function send_user_link(array $user, string $kind): bool
{
    q('UPDATE user_links SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL', [$user['id']]);
    $token = bin2hex(random_bytes(32));
    q('INSERT INTO user_links (user_id, kind, token_hash, expires_at, created_by) VALUES (?, ?, ?, ?, ?)',
        [$user['id'], $kind, hash('sha256', $token), utc_at('+' . LINK_HOURS[$kind] . ' hours'), current_user()['id'] ?? null]);
    $company = setting('company_name') ?: 'Chromolog Technologies';
    $link = portal_url() . '/activate?token=' . $token;
    $roles = ['admin' => 'Admin', 'marketing' => 'Marketing', 'accounts' => 'Accounts', 'project' => 'Project team', 'employee' => 'Employee'];
    if ($kind === 'invite') {
        $subject = "Activate your {$company} portal account";
        $body = "Hello {$user['name']},\n\n"
            . "An account has been created for you on the {$company} company portal (role: {$roles[$user['role']]}).\n\n"
            . "Set your password to activate it:\n{$link}\n\n"
            . "Your sign-in email is {$user['email']}. The link works once and expires in 7 days.\n\n"
            . "If you weren't expecting this, you can ignore this email.\n\n{$company}\n" . setting('company_email');
    } else {
        $subject = "Reset your {$company} portal password";
        $body = "Hello {$user['name']},\n\n"
            . "Use this link to set a new password for your {$company} portal account:\n{$link}\n\n"
            . "The link works once and expires in 24 hours. Until you use it, your current password keeps working.\n\n"
            . "If you didn't ask for this, you can ignore this email.\n\n{$company}\n" . setting('company_email');
    }
    $sent = send_email($user['email'], $subject, $body, setting('company_email') ?: null, null, $company);
    security_event($kind === 'invite' ? 'invite_sent' : 'reset_link_sent', (int) $user['id'], ($sent ? '' : 'email failed; ') . 'by ' . (current_user()['name'] ?? 'system'));
    return $sent;
}

/** The unused, unexpired link for a token, with its user. Repeated bad tokens from one network are slowed down. */
function find_user_link(string $token): array
{
    $ipKey = 'link:' . client_ip_hash();
    if ((int) q('SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > ?', [$ipKey, utc_at('-15 minutes')])->fetchColumn() >= 20) {
        throw new ApiError('Too many attempts from this network. Please wait 15 minutes.', 429);
    }
    $link = preg_match('/^[a-f0-9]{64}$/', $token) ? q("SELECT l.*, u.name, u.email, u.role, u.active FROM user_links l JOIN users u ON u.id = l.user_id
        WHERE l.token_hash = ?", [hash('sha256', $token)])->fetch() : false;
    if (!$link) {
        q('INSERT INTO requests (ip_hash) VALUES (?)', [$ipKey]);
        throw new ApiError('This link is not valid. Ask an admin to send a new one.', 404);
    }
    if ($link['used_at'] || strtotime($link['expires_at'] . ' UTC') < time() || !$link['active']) {
        throw new ApiError('This link has expired or was already used. Ask an admin to send a new one.', 410);
    }
    return $link;
}

$router->add('GET', 'auth/link', null, function () {
    $l = find_user_link((string) query('token', ''));
    return ['kind' => $l['kind'], 'name' => $l['name'], 'email' => $l['email']];
});

// Set the password from an invite/reset link, then sign in.
$router->add('POST', 'auth/link', null, function () {
    $b = body();
    $l = find_user_link((string) ($b['token'] ?? ''));
    $password = (string) ($b['password'] ?? '');
    assert_strong_password($password, ['email' => $l['email'], 'name' => $l['name']]);
    transaction(function () use ($l, $password) {
        q('UPDATE user_links SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [$l['id']]);
        q('UPDATE users SET password_hash = ?, must_change_password = 0, failed_logins = 0, locked_until = NULL,
            password_changed_at = CURRENT_TIMESTAMP, activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP) WHERE id = ?',
            [hash_password($password), $l['user_id']]);
        // Any other sign-ins end (API keys stay).
        q("DELETE FROM api_tokens WHERE user_id = ? AND kind != 'api_key'", [$l['user_id']]);
    });
    security_event($l['kind'] === 'invite' ? 'account_activated' : 'password_reset_by_link', (int) $l['user_id']);
    q('UPDATE users SET last_login_at = ? WHERE id = ?', [now_utc(), $l['user_id']]);
    set_session_cookie(start_session((int) $l['user_id'], false), false);
    return ['user' => public_user(find_or_404('users', (int) $l['user_id'], 'User'))];
});

// The person sets their own password from the emailed link; the admin never chooses or sees it.
$router->add('POST', 'users', [ROLE_ADMIN], function () {
    $b = body();
    $email = str_in($b, 'email', 160, true);
    assert_unique_email($email);
    $name = str_in($b, 'name', 120, true);
    $id = insert('users', [
        'name' => $name,
        'email' => $email,
        // Random, unknown password until activation.
        'password_hash' => hash_password(bin2hex(random_bytes(32))),
        'role' => enum_in($b, 'role', ALL_ROLES, ROLE_EMPLOYEE),
        'phone' => str_in($b, 'phone', 40),
        'hourly_rate' => num_in($b, 'hourly_rate', 0, 0),
        'activated_at' => null,
    ]);
    audit('create', 'user', $id);
    security_event('user_created', $id, 'by ' . current_user()['name']);
    $user = find_or_404('users', $id, 'User');
    return ['user' => public_user($user), 'email_sent' => send_user_link($user, 'invite')];
});

// Resend the activation link (not yet activated) or email a password reset link (active account).
$router->add('POST', 'users/{id}/send-link', [ROLE_ADMIN], function ($p) {
    $user = find_or_404('users', id_param($p), 'User');
    if (!$user['active']) {
        throw new ApiError('This user is disabled. Enable them first.', 422);
    }
    $kind = $user['activated_at'] === null ? 'invite' : 'reset';
    if (!send_user_link($user, $kind)) {
        throw new ApiError('The email could not be sent. Please try again later.', 502);
    }
    return ['kind' => $kind];
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
        $data['email'] = str_in($b, 'email', 160, true);
        assert_unique_email($data['email'], $id);
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
    if (!empty($b['unlock'])) {
        $data['failed_logins'] = 0;
        $data['locked_until'] = null;
    }
    if (!empty($b['password'])) {
        assert_strong_password((string) $b['password'], ['email' => $data['email'] ?? $user['email'], 'name' => $data['name'] ?? $user['name']]);
        $data['password_hash'] = hash_password((string) $b['password']);
        $data['must_change_password'] = $id === (int) current_user()['id'] ? 0 : 1;
        $data['failed_logins'] = 0;
        $data['locked_until'] = null;
    }
    update('users', $id, $data);
    $revoke = (isset($data['active']) && $data['active'] === 0) || isset($data['password_hash'])
        || (isset($data['role']) && $data['role'] !== $user['role']);
    if ($revoke) {
        // Sign the person out everywhere (API keys too when deactivated).
        q(isset($data['active']) && $data['active'] === 0
            ? 'DELETE FROM api_tokens WHERE user_id = ?'
            : "DELETE FROM api_tokens WHERE user_id = ? AND kind != 'api_key'", [$id]);
    }
    audit('update', 'user', $id);
    foreach (['password_hash' => 'password_reset', 'unlock' => 'account_unlocked'] as $k => $event) {
        if (isset($data[$k]) || ($k === 'unlock' && !empty($b['unlock']))) {
            security_event($event, $id, 'by ' . current_user()['name']);
        }
    }
    if (isset($data['role']) && $data['role'] !== $user['role']) {
        security_event('role_changed', $id, "{$user['role']} → {$data['role']} by " . current_user()['name']);
    }
    if (isset($data['active']) && (int) $data['active'] !== (int) $user['active']) {
        security_event($data['active'] ? 'user_enabled' : 'user_disabled', $id, 'by ' . current_user()['name']);
    }
    return ['user' => public_user(find_or_404('users', $id, 'User'))];
});

// Security log: sign-ins, failures, lockouts, password and role changes.
$router->add('GET', 'security/log', [ROLE_ADMIN], function () {
    $where = "a.entity = 'auth'";
    $args = [];
    if ($s = query('user_id')) {
        $where .= ' AND a.user_id = ?';
        $args[] = (int) $s;
    }
    if (query('failures')) {
        $where .= " AND a.action IN ('login_failed','account_locked','password_change_failed')";
    }
    return ['items' => q("SELECT a.id, a.action, a.detail, a.ip_hash, a.created_at, u.name AS user_name, u.email AS user_email
        FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE {$where} ORDER BY a.id DESC LIMIT 500", $args)->fetchAll()];
});

// ── Settings ────────────────────────────────────────────────────────────

function public_settings(): array
{
    $s = settings_all();
    $s['expense_categories'] = array_values(array_filter(array_map('trim', explode("\n", $s['expense_categories']))));
    $s['income_categories'] = array_values(array_filter(array_map('trim', explode("\n", $s['income_categories']))));
    $s['timezone'] = date_default_timezone_get();
    $s['gst_states'] = array_map(fn ($code, $name) => [(string) $code, $name], array_keys(GST_STATES), GST_STATES);
    // Image paths stay on the server; the portal only needs to know whether each image is set.
    foreach (BRANDING_KINDS as $kind => $key) {
        $s["has_{$kind}"] = $s[$key] !== '';
        $s["{$kind}_version"] = $s[$key] !== '' ? substr(md5($s[$key]), 0, 8) : '';
        unset($s[$key]);
    }
    $s['today'] = today();
    return $s;
}

$router->add('GET', 'settings', [], fn () => ['settings' => public_settings()]);

$router->add('PUT', 'settings', [ROLE_ADMIN], function () {
    $b = body();
    if (array_key_exists('company_state', $b) && !isset(GST_STATES[(string) $b['company_state']])) {
        throw new ApiError('Choose a valid state.', 422);
    }
    foreach (['invoice_prefix', 'credit_note_prefix', 'debit_note_prefix'] as $k) {
        if (array_key_exists($k, $b) && !preg_match('#^[A-Za-z0-9-]{1,6}$#', (string) $b[$k])) {
            throw new ApiError('Number prefixes can use letters, digits and "-" (up to 6 characters).', 422);
        }
    }
    foreach (array_keys(SETTING_DEFAULTS) as $key) {
        if (!array_key_exists($key, $b) || in_array($key, BRANDING_KINDS, true)) {
            continue;
        }
        $value = is_array($b[$key]) ? implode("\n", array_map('strval', $b[$key])) : (string) $b[$key];
        set_setting($key, mb_substr($value, 0, 4000));
    }
    if (array_key_exists('invoice_start_number', $b)) {
        bump_invoice_sequence(max(1, (int) $b['invoice_start_number']));
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
        sync_overdue();
        $income = (float) $one("SELECT COALESCE(SUM(amount),0) FROM payments WHERE date >= ?", [$monthStart])
            + (float) $one("SELECT COALESCE(SUM(amount),0) FROM other_income WHERE date >= ?", [$monthStart]);
        $expense = (float) $one("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date >= ?", [$monthStart]);
        $out['accounts'] = [
            'income_this_month' => money($income),
            'expenses_this_month' => money($expense),
            'net_this_month' => money($income - $expense),
            'outstanding' => money((float) $one('SELECT COALESCE(SUM(' . BALANCE_SQL . '),0) FROM invoices WHERE ' . OPEN_INVOICE_SQL)),
            'overdue_invoices' => (int) $one("SELECT COUNT(*) FROM invoices WHERE doc_type = 'invoice' AND status = 'overdue'"),
            'pending_payouts' => money((float) $one("SELECT COALESCE(SUM(total),0) FROM payouts WHERE status = 'pending'")),
            'recurring_due_7_days' => (int) $one('SELECT COUNT(*) FROM recurring_invoices WHERE active = 1 AND next_date <= ?', [date('Y-m-d', strtotime(today() . ' +7 days'))]),
            'contracts_expiring' => (int) $one("SELECT COUNT(*) FROM contracts WHERE status = 'active' AND end_date IS NOT NULL AND end_date <= DATE_ADD(?, INTERVAL renewal_reminder_days DAY)", [today()]),
        ];
    }
    if (has_role(ROLE_PROJECT)) {
        $out['projects'] = [
            'active' => (int) $one("SELECT COUNT(*) FROM projects WHERE status = 'active'"),
            'overdue_tasks' => (int) $one("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date < ?", [today()]),
            'pending_timesheets' => (int) $one("SELECT COUNT(*) FROM timesheets WHERE status = 'pending'"),
            'reports_today' => (int) $one("SELECT COUNT(*) FROM daily_reports WHERE date = ?", [today()]),
            'people' => (int) $one("SELECT COUNT(*) FROM users WHERE active = 1"),
            'open_tickets' => (int) $one("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed')"),
            'breached_tickets' => (int) $one("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed') AND ((first_response_at IS NULL AND response_due_at < ?) OR resolve_due_at < ?)", [now_utc(), now_utc()]),
        ];
    }
    // Everyone: own work.
    $out['me'] = [
        'open_tasks' => (int) $one("SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status != 'done'", [$uid]),
        'hours_this_month' => (float) $one("SELECT COALESCE(SUM(hours),0) FROM timesheets WHERE user_id = ? AND date >= ?", [$uid, $monthStart]),
        'report_submitted_today' => (bool) $one("SELECT 1 FROM daily_reports WHERE user_id = ? AND date = ?", [$uid, today()]),
        // Earnings are admin-only for now.
        'unpaid_earnings' => $u['role'] === ROLE_ADMIN ? money(unpaid_earnings($uid)) : null,
        'open_tickets' => (int) $one("SELECT COUNT(*) FROM tickets WHERE assignee_id = ? AND status NOT IN ('resolved','closed')", [$uid]),
    ];
    return $out;
});
