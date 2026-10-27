<?php

declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/mailer.php';

/**
 * Careers applications: emailed to the team (notify_email) with the resume attached.
 * Nothing is stored on the server; the uploaded file is discarded after sending.
 */

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES = [
    'pdf' => ['application/pdf'],
    'doc' => ['application/msword', 'application/x-ole-storage', 'application/CDFV2'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
];

apply_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Honeypot: real visitors never fill the hidden "website" field.
if (!empty($_POST['website'])) {
    json_response(['ok' => true]);
}

$field = fn (string $name, int $max) => mb_substr(trim(strip_tags((string) ($_POST[$name] ?? ''))), 0, $max);
$name = $field('name', 120);
$email = $field('email', 160);
$phone = $field('phone', 40);
$portfolio = $field('portfolio', 300);
$message = $field('message', 3000);

if ($name === '' || $phone === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Please enter your name, a valid email and your phone number.'], 422);
}

$attachment = null;
$upload = $_FILES['resume'] ?? null;
if ($upload && ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($upload['error'] !== UPLOAD_ERR_OK || $upload['size'] > MAX_RESUME_BYTES) {
        json_response(['error' => 'Your resume could not be uploaded. Please use a PDF or Word file under 5 MB.'], 422);
    }
    $ext = strtolower(pathinfo((string) $upload['name'], PATHINFO_EXTENSION));
    $mime = function_exists('mime_content_type') ? (string) mime_content_type($upload['tmp_name']) : '';
    if (!isset(RESUME_TYPES[$ext]) || ($mime !== '' && !in_array($mime, RESUME_TYPES[$ext], true))) {
        json_response(['error' => 'Please upload your resume as a PDF or Word (.doc, .docx) file.'], 422);
    }
    $safeName = preg_replace('/[^A-Za-z0-9 ._-]/', '', $name) ?: 'applicant';
    $attachment = ['path' => $upload['tmp_name'], 'name' => "Resume - {$safeName}.{$ext}", 'type' => RESUME_TYPES[$ext][0]];
}

$pdo = db();
$ipHash = client_ip_hash();
$recent = $pdo->prepare('SELECT COUNT(*) FROM requests WHERE ip_hash = ? AND created_at > ?');
$recent->execute([$ipHash, utc_at('-1 hour')]);
if ((int) $recent->fetchColumn() >= config()['rate_limit_per_hour']) {
    json_response(['error' => 'Too many submissions. Please email info@chromologtechnologies.com instead.'], 429);
}
$pdo->prepare('INSERT INTO requests (ip_hash) VALUES (?)')->execute([$ipHash]);

$body = "New job application from the website\n\n"
    . "Name      : {$name}\n"
    . "Email     : {$email}\n"
    . "Phone     : {$phone}\n"
    . "Portfolio : " . ($portfolio ?: '-') . "\n"
    . "Resume    : " . ($attachment ? 'attached' : 'not provided') . "\n\n"
    . "Message:\n" . ($message ?: '-') . "\n";

if (!send_team_email("Job application: {$name}", $body, $email, $attachment)) {
    json_response(['error' => 'Sorry, your application could not be sent. Please email it to info@chromologtechnologies.com.'], 502);
}

json_response(['ok' => true]);
