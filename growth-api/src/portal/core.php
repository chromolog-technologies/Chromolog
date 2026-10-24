<?php

declare(strict_types=1);

/**
 * Portal API core: routing, auth, roles, validation, uploads, settings.
 */

const ROLE_ADMIN = 'admin';
const ROLE_MARKETING = 'marketing';
const ROLE_ACCOUNTS = 'accounts';
const ROLE_PROJECT = 'project';
const ROLE_EMPLOYEE = 'employee';
const ALL_ROLES = [ROLE_ADMIN, ROLE_MARKETING, ROLE_ACCOUNTS, ROLE_PROJECT, ROLE_EMPLOYEE];

const LOGIN_TOKEN_DAYS = 7;
const API_KEY_DAYS = 365;

final class ApiError extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400)
    {
        parent::__construct($message);
    }
}

// ── Routing ─────────────────────────────────────────────────────────────

final class Router
{
    /** @var list<array{string, string, list<string>|null, callable}> */
    private array $routes = [];

    /** $roles: null = public, [] = any signed-in user, otherwise allowed roles (admin always allowed). */
    public function add(string $method, string $pattern, ?array $roles, callable $handler): void
    {
        $this->routes[] = [$method, $pattern, $roles, $handler];
    }

    public function dispatch(string $method, string $path): array
    {
        $path = trim($path, '/');
        $allowed = [];
        foreach ($this->routes as [$m, $pattern, $roles, $handler]) {
            $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
            if (!preg_match($regex, $path, $match)) {
                continue;
            }
            if ($m !== $method) {
                $allowed[] = $m;
                continue;
            }
            if ($roles !== null) {
                require_role(...$roles);
            }
            $params = array_filter($match, 'is_string', ARRAY_FILTER_USE_KEY);
            return $handler($params) ?? ['ok' => true];
        }
        throw new ApiError($allowed ? 'Method not allowed' : 'Not found', $allowed ? 405 : 404);
    }
}

// ── Request helpers ─────────────────────────────────────────────────────

function body(): array
{
    static $body = null;
    if ($body === null) {
        $type = $_SERVER['CONTENT_TYPE'] ?? '';
        $body = str_contains($type, 'application/json')
            ? (json_decode(file_get_contents('php://input'), true) ?? [])
            : $_POST;
    }
    return $body;
}

function query(string $key, ?string $default = null): ?string
{
    $v = $_GET[$key] ?? null;
    return is_string($v) && $v !== '' ? $v : $default;
}

function str_in(array $src, string $key, int $max = 255, bool $required = false): ?string
{
    $v = trim((string) ($src[$key] ?? ''));
    if ($v === '') {
        if ($required) {
            throw new ApiError(ucfirst(str_replace('_', ' ', $key)) . ' is required.', 422);
        }
        return null;
    }
    return mb_substr($v, 0, $max);
}

function num_in(array $src, string $key, ?float $default = null, float $min = -PHP_FLOAT_MAX): ?float
{
    $v = $src[$key] ?? null;
    if ($v === null || $v === '') {
        return $default;
    }
    if (!is_numeric($v)) {
        throw new ApiError(ucfirst(str_replace('_', ' ', $key)) . ' must be a number.', 422);
    }
    $n = round((float) $v, 2);
    if ($n < $min) {
        throw new ApiError(ucfirst(str_replace('_', ' ', $key)) . ' is too small.', 422);
    }
    return $n;
}

function date_in(array $src, string $key, bool $required = false): ?string
{
    $v = str_in($src, $key, 10, $required);
    if ($v !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
        throw new ApiError(ucfirst(str_replace('_', ' ', $key)) . ' must be a date (YYYY-MM-DD).', 422);
    }
    return $v;
}

function enum_in(array $src, string $key, array $allowed, ?string $default = null): ?string
{
    $v = str_in($src, $key, 40);
    if ($v === null) {
        return $default;
    }
    if (!in_array($v, $allowed, true)) {
        throw new ApiError('Invalid ' . str_replace('_', ' ', $key) . '.', 422);
    }
    return $v;
}

function id_param(array $params, string $key = 'id'): int
{
    return (int) ($params[$key] ?? 0);
}

/** Make a CSV row safe to open in Excel: text starting with = + - @ would run as a formula. */
function csv_safe(array $row): array
{
    return array_map(function ($v) {
        if (is_string($v) && $v !== '' && !is_numeric($v) && in_array($v[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'" . $v;
        }
        return $v;
    }, array_values($row));
}

function money(float $n): float
{
    return round($n, 2);
}

/** Business date in the company timezone (config 'timezone', default Asia/Kolkata). */
function today(): string
{
    return date('Y-m-d');
}

/** Timestamps are stored in UTC, matching SQLite's CURRENT_TIMESTAMP. */
function now_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

// ── Data helpers ────────────────────────────────────────────────────────

function q(string $sql, array $args = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($args);
    return $stmt;
}

function find_or_404(string $table, int $id, string $label): array
{
    $row = q("SELECT * FROM {$table} WHERE id = ?", [$id])->fetch();
    if (!$row) {
        throw new ApiError("{$label} not found.", 404);
    }
    return $row;
}

/** Insert a row from an associative array (keys are trusted column names). */
function insert(string $table, array $data): int
{
    $cols = array_keys($data);
    q(sprintf('INSERT INTO %s (%s) VALUES (%s)', $table, implode(', ', $cols), implode(', ', array_fill(0, count($cols), '?'))), array_values($data));
    return (int) db()->lastInsertId();
}

function update(string $table, int $id, array $data): void
{
    if (!$data) {
        return;
    }
    $sets = implode(', ', array_map(fn ($c) => "{$c} = ?", array_keys($data)));
    q("UPDATE {$table} SET {$sets} WHERE id = ?", [...array_values($data), $id]);
}

/** Run $fn in a database transaction and return its result. */
function transaction(callable $fn): mixed
{
    $pdo = db();
    if ($pdo->inTransaction()) {
        return $fn();
    }
    // IMMEDIATE takes the write lock up front, so two people saving at once can't
    // both read the same "next invoice number".
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        $result = $fn();
        $pdo->exec('COMMIT');
        return $result;
    } catch (Throwable $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

function audit(string $action, string $entity, ?int $entityId = null): void
{
    q('INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)', [current_user()['id'] ?? null, $action, $entity, $entityId]);
}

// ── Auth ────────────────────────────────────────────────────────────────

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        return $m[1];
    }
    // Some shared hosts strip Authorization; X-Auth-Token is the fallback.
    $alt = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    return $alt !== '' ? $alt : null;
}

function current_user(): ?array
{
    static $user = false;
    if ($user === false) {
        $user = null;
        $token = bearer_token();
        $fromCookie = false;
        if ($token === null && !empty($_COOKIE[SESSION_COOKIE])) {
            $token = (string) $_COOKIE[SESSION_COOKIE];
            $fromCookie = true;
        }
        if ($token !== null) {
            $row = q(
                "SELECT u.*, t.id AS token_id, t.kind AS token_kind, t.last_used_at AS token_last_used FROM api_tokens t
                 JOIN users u ON u.id = t.user_id
                 WHERE t.token_hash = ? AND t.expires_at > datetime('now') AND u.active = 1",
                [hash('sha256', $token)]
            )->fetch();
            // Normal sign-ins end after a period without activity.
            if ($row && $row['token_kind'] === 'session' && $row['token_last_used']
                && strtotime($row['token_last_used'] . ' UTC') < time() - SESSION_IDLE_MINUTES * 60) {
                q('DELETE FROM api_tokens WHERE id = ?', [$row['token_id']]);
                $row = false;
            }
            if ($row) {
                // Cookie sessions: state-changing requests must carry the portal header (CSRF guard).
                $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
                if ($fromCookie && !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true) && ($_SERVER['HTTP_X_PORTAL_REQUEST'] ?? '') !== '1') {
                    throw new ApiError('Request blocked for security reasons. Please refresh the page.', 403);
                }
                q('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [$row['token_id']]);
                unset($row['password_hash']);
                $user = $row;
            }
        }
    }
    return $user;
}

/** Routes a user who must change their password may still call. */
const PASSWORD_CHANGE_ALLOWED = ['me', 'me/password', 'auth/logout', 'settings'];

function require_role(string ...$roles): array
{
    $user = current_user();
    if (!$user) {
        throw new ApiError('Please sign in.', 401);
    }
    if ((int) $user['must_change_password'] === 1 && $user['token_kind'] !== 'api_key'
        && !in_array($GLOBALS['portal_route'] ?? '', PASSWORD_CHANGE_ALLOWED, true)) {
        throw new ApiError('Please set a new password first.', 403);
    }
    if ($roles && $user['role'] !== ROLE_ADMIN && !in_array($user['role'], $roles, true)) {
        throw new ApiError('You do not have access to this.', 403);
    }
    return $user;
}

function has_role(string ...$roles): bool
{
    $user = current_user();
    return $user && ($user['role'] === ROLE_ADMIN || in_array($user['role'], $roles, true));
}

function issue_token(int $userId, string $label, int $days): string
{
    $token = bin2hex(random_bytes(32));
    q("INSERT INTO api_tokens (user_id, token_hash, label, kind, expires_at) VALUES (?, ?, ?, 'api_key', datetime('now', ?))",
        [$userId, hash('sha256', $token), $label, "+{$days} days"]);
    return $token;
}

function public_user(array $u): array
{
    return [
        'id' => (int) $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'],
        'phone' => $u['phone'] ?? null, 'hourly_rate' => (float) ($u['hourly_rate'] ?? 0),
        'active' => (bool) ($u['active'] ?? 1), 'created_at' => $u['created_at'] ?? null,
        'last_login_at' => $u['last_login_at'] ?? null,
        'locked' => !empty($u['locked_until']) && strtotime($u['locked_until'] . ' UTC') > time(),
        'must_change_password' => (bool) ($u['must_change_password'] ?? 0),
    ];
}

/** First run: create the admin account from config (admin_email + the existing admin password). */
function ensure_admin_user(): void
{
    if ((int) q('SELECT COUNT(*) FROM users')->fetchColumn() > 0) {
        return;
    }
    $cfg = config();
    if (empty($cfg['admin_password_hash'])) {
        return;
    }
    insert('users', [
        'name' => 'Administrator',
        'email' => $cfg['admin_email'] ?? 'info@chromologtechnologies.com',
        'password_hash' => $cfg['admin_password_hash'],
        'role' => ROLE_ADMIN,
    ]);
}

// ── Settings ────────────────────────────────────────────────────────────

const SETTING_DEFAULTS = [
    'company_name' => 'Chromolog Technologies',
    'company_address' => "Ernakulam, Kerala, India",
    'company_email' => 'info@chromologtechnologies.com',
    'company_phone' => '+91 94002 30723',
    'company_website' => 'https://chromologtechnologies.com',
    'tax_id' => '',
    'company_pan' => '',
    // GST state code of the business (32 = Kerala); decides CGST+SGST vs IGST.
    'company_state' => '32',
    'currency' => 'INR',
    'currency_symbol' => '₹',
    'tax_enabled' => '0',
    'tax_label' => 'GST',
    'default_gst_rate' => '18',
    'invoice_prefix' => 'INV',
    // 1 = numbers include the financial year (INV/26-27/0001) and restart each April.
    'invoice_number_fy' => '1',
    'invoice_start_number' => '1',
    'credit_note_prefix' => 'CN',
    'debit_note_prefix' => 'DN',
    'quotation_prefix' => 'QT',
    'payment_terms_days' => '15',
    'bank_account_name' => '',
    'bank_name' => '',
    'bank_branch' => '',
    'bank_account_number' => '',
    'bank_ifsc' => '',
    'upi_id' => '',
    'bank_details' => '',
    'payment_methods' => 'Bank transfer (NEFT / RTGS / IMPS), UPI, Cheque',
    'invoice_declaration' => 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
    'signatory_name' => '',
    'signatory_title' => 'Authorised Signatory',
    'thank_you_message' => 'Thank you for your business!',
    // Uploaded images (paths under uploads/branding); set through the branding upload, not PUT settings.
    'logo_file' => '',
    'seal_file' => '',
    'signature_file' => '',
    'upi_qr_file' => '',
    'invoice_terms' => 'Payment is due within 15 days of the invoice date.',
    'quotation_terms' => 'This quotation is valid for 30 days. Final scope will be confirmed in writing.',
    'expense_categories' => "Software & Subscriptions\nHosting & Domains\nFreelancer Payouts\nSalaries\nRent & Utilities\nMarketing & Ads\nEquipment\nTravel\nBank Charges\nTaxes & Fees\nOther",
    'income_categories' => "Advance / Retainer\nInterest\nRefund\nOther",
    'reminders_enabled' => '1',
    // ISO weekdays (1 = Monday) on which a daily report is expected.
    'report_days' => '1,2,3,4,5,6',
    'ticket_prefix' => 'TKT',
    // Support targets per priority: first response hours, resolution hours (calendar hours).
    'sla_urgent' => '1,8',
    'sla_high' => '4,24',
    'sla_medium' => '8,72',
    'sla_low' => '24,120',
];

function settings_all(): array
{
    $rows = q('SELECT key, value FROM settings')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_merge(SETTING_DEFAULTS, $rows);
}

function setting(string $key): string
{
    return (string) (settings_all()[$key] ?? '');
}

/** Next document number, e.g. INV-2026-0007 (sequence restarts each year). */
function next_number(string $table, string $prefix): string
{
    $year = date('Y');
    $like = "{$prefix}-{$year}-%";
    $last = q("SELECT number FROM {$table} WHERE number LIKE ? ORDER BY id DESC LIMIT 1", [$like])->fetchColumn();
    $seq = $last ? ((int) substr((string) $last, strrpos((string) $last, '-') + 1)) + 1 : 1;
    return sprintf('%s-%s-%04d', $prefix, $year, $seq);
}

// ── File uploads (stored outside public_html) ───────────────────────────

const UPLOAD_TYPES = [
    'pdf' => ['application/pdf'],
    'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'], 'webp' => ['image/webp'],
    'doc' => ['application/msword', 'application/CDFV2', 'application/x-ole-storage'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
    'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** @return array{file_path: string, file_name: string}|null */
function store_upload(string $field, string $folder): ?array
{
    $f = $_FILES[$field] ?? null;
    if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > MAX_UPLOAD_BYTES) {
        throw new ApiError('The file could not be uploaded. Use a PDF, image or Office file under 10 MB.', 422);
    }
    $ext = strtolower(pathinfo((string) $f['name'], PATHINFO_EXTENSION));
    $mime = function_exists('mime_content_type') ? (string) mime_content_type($f['tmp_name']) : '';
    if (!isset(UPLOAD_TYPES[$ext]) || ($mime !== '' && !in_array($mime, UPLOAD_TYPES[$ext], true))) {
        throw new ApiError('Unsupported file type. Use PDF, JPG, PNG, WEBP, DOC, DOCX or XLSX.', 422);
    }
    $dir = upload_root() . '/' . $folder . '/' . date('Y/m');
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new ApiError('Upload folder is not writable.', 500);
    }
    $name = bin2hex(random_bytes(12)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], "{$dir}/{$name}")) {
        throw new ApiError('Could not save the file.', 500);
    }
    $original = preg_replace('/[^A-Za-z0-9 ._()-]/', '', basename((string) $f['name'])) ?: "file.{$ext}";
    return ['file_path' => substr("{$dir}/{$name}", strlen(upload_root()) + 1), 'file_name' => mb_substr($original, 0, 150)];
}

function upload_root(): string
{
    return rtrim(config()['uploads_path'] ?? (dirname(config()['db_path']) . '/uploads'), '/');
}

function send_file(?string $relPath, ?string $name): never
{
    $full = $relPath ? realpath(upload_root() . '/' . $relPath) : false;
    if (!$full || !str_starts_with($full, realpath(upload_root()) . '/') || !is_file($full)) {
        throw new ApiError('File not found.', 404);
    }
    $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
    header('Content-Type: ' . (UPLOAD_TYPES[$ext][0] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($full));
    header('Content-Disposition: inline; filename="' . str_replace('"', '', $name ?: basename($full)) . '"');
    header('X-Content-Type-Options: nosniff');
    readfile($full);
    exit;
}

function delete_upload(?string $relPath): void
{
    if ($relPath) {
        $full = realpath(upload_root() . '/' . $relPath);
        if ($full && str_starts_with($full, realpath(upload_root()) . '/')) {
            @unlink($full);
        }
    }
}
