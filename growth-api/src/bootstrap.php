<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/portal/schema.php';
require_once __DIR__ . '/portal/sqlite_import.php';

/**
 * Secrets and data live OUTSIDE public_html. On Hostinger the API is deployed to
 * public_html/api/ai/, so the default config path is
 * /home/<user>/domains/chromologtechnologies.com/chromolog-private/config.php.
 * Locally, point CHROMOLOG_CONFIG at your own copy of config.example.php.
 */
function config(): array
{
    static $config = null;
    if ($config === null) {
        $path = getenv('CHROMOLOG_CONFIG') ?: dirname(__DIR__, 4) . '/chromolog-private/config.php';
        if (!is_file($path)) {
            http_response_code(500);
            error_log("Chromolog growth-api: config not found at {$path}");
            exit(json_encode(['error' => 'Service not configured']));
        }
        $config = require $path;
        date_default_timezone_set($config['timezone'] ?? 'Asia/Kolkata');
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config()['db'] ?? null;
        if (!is_array($c) || empty($c['name'])) {
            throw new RuntimeException('MySQL database is not configured (config "db").');
        }
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'] ?? 'localhost', (int) ($c['port'] ?? 3306), $c['name']),
            $c['user'] ?? '',
            $c['password'] ?? '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Real prepared statements, so numbers come back as numbers (not strings).
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ]
        );
        // Timestamps are stored in UTC (CURRENT_TIMESTAMP, UTC_TIMESTAMP()); business dates come from PHP.
        $pdo->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        ensure_schema($pdo);
        import_sqlite_once($pdo);
    }
    return $pdo;
}

/** The private folder outside public_html that holds config.php, uploads and backups. */
function private_dir(): string
{
    return dirname(getenv('CHROMOLOG_CONFIG') ?: dirname(__DIR__, 4) . '/chromolog-private/config.php');
}

/** UTC timestamp relative to now, e.g. utc_at('-15 minutes'), for comparing with DATETIME columns. */
function utc_at(string $modifier = 'now'): string
{
    return gmdate('Y-m-d H:i:s', strtotime($modifier));
}

function client_ip_hash(): string
{
    // Hash so raw visitor IPs are never stored.
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . config()['ip_salt']);
}

function json_response(array $body, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apply_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, config()['allowed_origins'], true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function load_brain(): string
{
    return file_get_contents(__DIR__ . '/../brain/company-brain.md');
}
