<?php

/**
 * A stand-in for Google's sign-in and Drive APIs, for the backup tests only.
 * Run with: FAKE_GOOGLE_DIR=/tmp/x php -S 127.0.0.1:PORT fake-google.php
 * State (uploaded files, deletions) lives in FAKE_GOOGLE_DIR so the tests can inspect it.
 */

$dir = getenv('FAKE_GOOGLE_DIR');
$stateFile = "{$dir}/state.json";
$state = is_file($stateFile) ? json_decode(file_get_contents($stateFile), true) : ['files' => [], 'deleted' => [], 'next' => 1];
$save = function () use (&$state, $stateFile) {
    file_put_contents($stateFile, json_encode($state));
};
$json = function (int $status, array $body) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($body);
    exit;
};
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$authorized = ($_SERVER['HTTP_AUTHORIZATION'] ?? '') === 'Bearer access-1';

if ($path === '/token' && $method === 'POST') {
    if (($_POST['client_id'] ?? '') !== 'test-client' || ($_POST['client_secret'] ?? '') !== 'test-secret') {
        $json(401, ['error' => 'invalid_client']);
    }
    if (($_POST['grant_type'] ?? '') === 'authorization_code') {
        $_POST['code'] === 'good-code' ? $json(200, ['access_token' => 'access-1', 'refresh_token' => 'refresh-1', 'expires_in' => 3599])
            : $json(400, ['error' => 'invalid_grant']);
    }
    if (($_POST['grant_type'] ?? '') === 'refresh_token') {
        ($_POST['refresh_token'] ?? '') === 'refresh-1' && !is_file("{$dir}/revoked") ? $json(200, ['access_token' => 'access-1', 'expires_in' => 3599])
            : $json(400, ['error' => 'invalid_grant']);
    }
    $json(400, ['error' => 'unsupported_grant_type']);
}
if (!$authorized && !str_starts_with($path, '/session/')) {
    $json(401, ['error' => 'unauthorized']);
}
if ($path === '/drive/v3/files' && $method === 'POST') {
    $meta = json_decode(file_get_contents('php://input'), true);
    $meta['mimeType'] === 'application/vnd.google-apps.folder' ? $json(200, ['id' => 'folder-1']) : $json(400, ['error' => 'unexpected']);
}
if ($path === '/upload/drive/v3/files' && $method === 'POST' && ($_GET['uploadType'] ?? '') === 'resumable') {
    $meta = json_decode(file_get_contents('php://input'), true);
    if (($meta['parents'][0] ?? '') !== 'folder-1') {
        $json(404, ['error' => 'parent not found']);
    }
    $id = 'session-' . $state['next'];
    file_put_contents("{$dir}/{$id}.json", json_encode($meta));
    header("Location: http://{$_SERVER['HTTP_HOST']}/session/{$id}");
    $json(200, []);
}
if (str_starts_with($path, '/session/') && $method === 'PUT') {
    $session = basename($path);
    $meta = json_decode((string) @file_get_contents("{$dir}/{$session}.json"), true) ?: $json(404, ['error' => 'no session']);
    $id = 'file-' . $state['next']++;
    file_put_contents("{$dir}/{$id}.zip", file_get_contents('php://input'));
    array_unshift($state['files'], ['id' => $id, 'name' => $meta['name']]);
    $save();
    $json(200, ['id' => $id, 'name' => $meta['name']]);
}
if ($path === '/drive/v3/files' && $method === 'GET') {
    $json(200, ['files' => $state['files']]);
}
if (preg_match('#^/drive/v3/files/(.+)$#', $path, $m) && $method === 'DELETE') {
    $state['files'] = array_values(array_filter($state['files'], fn ($f) => $f['id'] !== $m[1]));
    $state['deleted'][] = $m[1];
    $save();
    http_response_code(204);
    exit;
}
$json(404, ['error' => "no fake for {$method} {$path}"]);
