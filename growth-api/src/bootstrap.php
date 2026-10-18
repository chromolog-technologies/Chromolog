<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/portal/schema.php';

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
        $pdo = new PDO('sqlite:' . config()['db_path']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
        migrate($pdo);
        portal_migrate($pdo);
    }
    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS conversations (
            session_id   TEXT PRIMARY KEY,
            ip_hash      TEXT NOT NULL,
            page         TEXT,
            turns        INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS messages (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id    TEXT NOT NULL,
            role          TEXT NOT NULL,
            text          TEXT NOT NULL,
            input_tokens  INTEGER,
            output_tokens INTEGER,
            created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
        CREATE TABLE IF NOT EXISTS leads (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id       TEXT UNIQUE,
            source           TEXT NOT NULL DEFAULT 'website_chat',
            full_name        TEXT,
            email            TEXT,
            phone            TEXT,
            company          TEXT,
            industry         TEXT,
            location         TEXT,
            service_interest TEXT,
            budget_range     TEXT,
            timeline         TEXT,
            role             TEXT,
            summary          TEXT,
            score            TEXT,
            status           TEXT NOT NULL DEFAULT 'new',
            notes            TEXT,
            created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS requests (
            ip_hash    TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_requests ON requests(ip_hash, created_at);
    SQL);
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
