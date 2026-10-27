<?php

declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/SalesAgent.php';

use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\RateLimitException;

const MAX_MESSAGE_CHARS = 2000;
const MAX_TURNS_PER_SESSION = 30;

apply_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$sessionId = (string) ($input['session_id'] ?? '');
$message = trim((string) ($input['message'] ?? ''));
$page = mb_substr((string) ($input['page'] ?? ''), 0, 200);

if (!preg_match('/^[A-Za-z0-9-]{16,64}$/', $sessionId)) {
    json_response(['error' => 'Invalid session'], 400);
}
if ($message === '' || mb_strlen($message) > MAX_MESSAGE_CHARS) {
    json_response(['error' => 'Message must be 1–' . MAX_MESSAGE_CHARS . ' characters'], 400);
}

$cfg = config();
$pdo = db();
$ipHash = client_ip_hash();

// ── Guardrails: per-visitor rate limit and a global daily cap on AI calls ──
$perIp = $pdo->prepare('SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > ?');
$perIp->execute([$ipHash, utc_at('-1 hour')]);
if ((int) $perIp->fetchColumn() >= $cfg['rate_limit_per_hour']) {
    json_response(['error' => 'Too many messages. Please try again later or WhatsApp us at +91 94002 30723.'], 429);
}
$daily = $pdo->prepare('SELECT COUNT(*) FROM requests WHERE created_at > ?');
$daily->execute([utc_at('-1 day')]);
$daily = (int) $daily->fetchColumn();
if ($daily >= $cfg['daily_message_cap']) {
    json_response(['error' => 'Our assistant is busy right now. Please WhatsApp us at +91 94002 30723.'], 503);
}

$conv = $pdo->prepare('SELECT turns FROM conversations WHERE session_id = ?');
$conv->execute([$sessionId]);
$turns = $conv->fetchColumn();
if ($turns === false) {
    $pdo->prepare('INSERT INTO conversations (session_id, ip_hash, page) VALUES (?, ?, ?)')
        ->execute([$sessionId, $ipHash, $page]);
    $turns = 0;
}
if ((int) $turns >= MAX_TURNS_PER_SESSION) {
    json_response(['error' => 'This chat has reached its limit. Please contact us on WhatsApp at +91 94002 30723.'], 429);
}

$pdo->prepare('INSERT INTO requests (ip_hash) VALUES (?)')->execute([$ipHash]);

$historyStmt = $pdo->prepare('SELECT role, text FROM messages WHERE session_id = ? ORDER BY id');
$historyStmt->execute([$sessionId]);
$history = $historyStmt->fetchAll();

try {
    $result = (new SalesAgent($sessionId))->reply($history, $message);
} catch (RateLimitException | APIConnectionException $e) {
    error_log('Chromolog growth-api: ' . $e->getMessage());
    json_response(['error' => 'Our assistant is busy right now. Please try again in a minute.'], 503);
} catch (APIStatusException $e) {
    error_log('Chromolog growth-api: ' . $e->getMessage());
    json_response(['error' => 'Something went wrong. Please WhatsApp us at +91 94002 30723.'], 502);
}

$save = $pdo->prepare('INSERT INTO messages (session_id, role, text, input_tokens, output_tokens) VALUES (?, ?, ?, ?, ?)');
$save->execute([$sessionId, 'user', $message, null, null]);
$save->execute([$sessionId, 'assistant', $result['reply'], $result['input_tokens'], $result['output_tokens']]);
$pdo->prepare('UPDATE conversations SET turns = turns + 1, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?')
    ->execute([$sessionId]);

json_response(['reply' => $result['reply'], 'lead_saved' => $result['lead_saved']]);
