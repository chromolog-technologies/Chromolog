<?php

declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/leads.php';

/**
 * Free lead capture (no AI): the chat widget's lead form and the website contact form
 * post here, so every inquiry lands in the control panel.
 */

const SOURCES = ['website_chat', 'contact_form', 'digital_audit', 'free_consultation', 'service_quote', 'newsletter'];
const FIELD_LIMITS = [
    'full_name' => 120, 'email' => 160, 'phone' => 40, 'company' => 160, 'industry' => 80,
    'location' => 120, 'service_interest' => 200, 'budget_range' => 80, 'timeline' => 80, 'summary' => 2000,
];

apply_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Honeypot: real visitors never fill the hidden "website" field.
if (!empty($input['website'])) {
    json_response(['ok' => true]);
}

$fields = [];
foreach (FIELD_LIMITS as $name => $max) {
    $value = trim(strip_tags((string) ($input[$name] ?? '')));
    if ($value !== '') {
        $fields[$name] = mb_substr($value, 0, $max);
    }
}
$fields['source'] = in_array($input['source'] ?? '', SOURCES, true) ? $input['source'] : 'website_chat';

if (empty($fields['full_name']) && $fields['source'] === 'newsletter') {
    $fields['full_name'] = 'Newsletter subscriber';
}
if (empty($fields['full_name'])) {
    json_response(['error' => 'Please enter your name.'], 422);
}
if (empty($fields['email']) && empty($fields['phone'])) {
    json_response(['error' => 'Please enter an email or phone number.'], 422);
}
if (!empty($fields['email']) && !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Please enter a valid email address.'], 422);
}

$pdo = db();
$ipHash = client_ip_hash();
$recent = $pdo->prepare('SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > ?');
$recent->execute([$ipHash, utc_at('-1 hour')]);
if ((int) $recent->fetchColumn() >= config()['rate_limit_per_hour']) {
    json_response(['error' => 'Too many submissions. Please WhatsApp us at +91 94002 30723.'], 429);
}
$pdo->prepare('INSERT INTO requests (ip_hash) VALUES (?)')->execute([$ipHash]);

$sessionId = (string) ($input['session_id'] ?? '');
if (!preg_match('/^[A-Za-z0-9-]{16,64}$/', $sessionId)) {
    $sessionId = 'form-' . bin2hex(random_bytes(12));
}

save_lead($sessionId, $fields);

json_response(['ok' => true]);
