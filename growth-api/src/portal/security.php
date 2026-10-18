<?php

declare(strict_types=1);

/**
 * Portal security: password policy & hashing, login lockout, cookie sessions.
 *
 * Sessions: the portal signs in with an HttpOnly, SameSite=Strict cookie that page scripts can't
 * read. State-changing cookie requests must also send "X-Portal-Request: 1" (blocks cross-site
 * request forgery). Scripts/tools use personal API keys as Bearer tokens instead.
 */

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_HOURS = 12;          // absolute lifetime of a normal sign-in
const SESSION_REMEMBER_DAYS = 7;   // "keep me signed in"
const SESSION_IDLE_MINUTES = 120;  // normal sign-ins end after 2 hours without activity
const SESSION_COOKIE = 'chromolog_session';

const COMMON_PASSWORDS = [
    'password', 'passw0rd', 'qwerty', 'qwertyuiop', 'asdfgh', 'zxcvbn', 'letmein', 'welcome', 'admin', 'administrator',
    'iloveyou', 'monkey', 'dragon', 'football', 'cricket', 'sunshine', 'princess', 'master', 'login', 'abc123', 'changeme',
    'secret', 'trustno1', 'superman', 'batman', 'india', 'kerala', 'kochi', 'dubai', 'chromolog', 'chromologtechnologies',
    'company', 'portal', 'test', 'testing', 'default', 'computer', 'internet', 'google', 'whatsapp',
];

/** @return list<string> human-readable problems; empty when the password is acceptable */
function password_problems(string $password, array $user = []): array
{
    $problems = [];
    $len = mb_strlen($password);
    if ($len < PASSWORD_MIN_LENGTH) {
        $problems[] = 'Use at least ' . PASSWORD_MIN_LENGTH . ' characters.';
    }
    if ($len > PASSWORD_MAX_LENGTH) {
        $problems[] = 'Use at most ' . PASSWORD_MAX_LENGTH . ' characters.';
    }
    $classes = (int) preg_match('/[a-z]/', $password) + (int) preg_match('/[A-Z]/', $password)
        + (int) preg_match('/\d/', $password) + (int) preg_match('/[^A-Za-z0-9]/', $password);
    if ($classes < 3) {
        $problems[] = 'Mix at least three of: lowercase, uppercase, numbers, symbols.';
    }
    if (preg_match('/(.)\1{3,}/u', $password) || count(array_unique(mb_str_split($password))) < 6) {
        $problems[] = 'Avoid repeating the same characters.';
    }
    $lower = mb_strtolower($password);
    $core = preg_replace('/[^a-z]/', '', $lower);
    foreach (COMMON_PASSWORDS as $common) {
        if ($core === $common || ($len < 16 && str_contains($core, $common) && strlen($common) >= 5 && strlen($core) - strlen($common) < 4)) {
            $problems[] = 'This password is too common or easy to guess.';
            break;
        }
    }
    if (preg_match('/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/', $lower)) {
        $problems[] = 'Avoid simple sequences like 1234 or abcd.';
    }
    $personal = [];
    if (!empty($user['email'])) {
        $personal[] = mb_strtolower(explode('@', (string) $user['email'])[0]);
    }
    foreach (preg_split('/\s+/', mb_strtolower((string) ($user['name'] ?? ''))) as $part) {
        $personal[] = $part;
    }
    foreach ($personal as $p) {
        if (mb_strlen($p) >= 4 && str_contains($lower, $p)) {
            $problems[] = "Don't include your name or email in the password.";
            break;
        }
    }
    return array_values(array_unique($problems));
}

function assert_strong_password(string $password, array $user = []): void
{
    $problems = password_problems($password, $user);
    if ($problems) {
        throw new ApiError('Password is not strong enough: ' . implode(' ', $problems), 422);
    }
}

function hash_password(string $password): string
{
    return defined('PASSWORD_ARGON2ID')
        ? password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1])
        : password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function password_needs_upgrade(string $hash): bool
{
    return defined('PASSWORD_ARGON2ID')
        ? password_needs_rehash($hash, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1])
        : password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12]);
}

/** Security event for the admin Security log. */
function security_event(string $action, ?int $userId, ?string $detail = null): void
{
    q('INSERT INTO audit_log (user_id, action, entity, detail, ip_hash) VALUES (?, ?, ?, ?, ?)',
        [$userId, $action, 'auth', $detail, substr(client_ip_hash(), 0, 16)]);
}

function mask_email(string $email): string
{
    [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');
    return mb_substr($local, 0, 2) . str_repeat('*', max(1, mb_strlen($local) - 2)) . ($domain !== '' ? "@{$domain}" : '');
}

// ── Sessions ────────────────────────────────────────────────────────────

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

function set_session_cookie(string $token, bool $remember): void
{
    setcookie(SESSION_COOKIE, $token, [
        'expires' => $remember ? time() + SESSION_REMEMBER_DAYS * 86400 : 0,
        'path' => '/api/ai/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function clear_session_cookie(): void
{
    setcookie(SESSION_COOKIE, '', ['expires' => time() - 3600, 'path' => '/api/ai/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Strict']);
}

function start_session(int $userId, bool $remember): string
{
    $token = bin2hex(random_bytes(32));
    $expires = $remember ? '+' . SESSION_REMEMBER_DAYS . ' days' : '+' . SESSION_HOURS . ' hours';
    q("INSERT INTO api_tokens (user_id, token_hash, label, kind, expires_at, last_used_at) VALUES (?, ?, ?, ?, datetime('now', ?), CURRENT_TIMESTAMP)",
        [$userId, hash('sha256', $token), 'Portal sign-in', $remember ? 'session_remember' : 'session', $expires]);
    return $token;
}
