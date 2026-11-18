<?php

declare(strict_types=1);

/**
 * Off-site backups to Google Drive, without extra libraries.
 *
 * One-time setup: an admin presses "Connect Google Drive" on the Automation page and signs in to
 * Google. The portal keeps only a refresh token with the narrowest Drive permission (drive.file:
 * it can see and change only the files it created itself), and creates one folder,
 * "Chromolog backups". Each daily backup is uploaded there and older copies beyond `keep` are deleted.
 *
 * config.php: 'google_drive' => ['client_id' => '…', 'client_secret' => '…', 'keep' => 60]
 * (an OAuth client of type "Web application" from Google Cloud; see the portal README, Back-ups).
 */

const GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GDRIVE_FOLDER_NAME = 'Chromolog backups';
const GDRIVE_STATE_MINUTES = 15;

function gdrive_config(): array
{
    return (config()['google_drive'] ?? []) + [
        'client_id' => '',
        'client_secret' => '',
        'keep' => 60,
        // Google's addresses; tests point these at a fake server.
        'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url' => 'https://oauth2.googleapis.com/token',
        'api_url' => 'https://www.googleapis.com/drive/v3',
        'upload_url' => 'https://www.googleapis.com/upload/drive/v3',
    ];
}

function gdrive_configured(): bool
{
    $c = gdrive_config();
    return $c['client_id'] !== '' && $c['client_secret'] !== '';
}

/** The saved connection (refresh token, folder), or null when Drive isn't connected. */
function gdrive_connection(): ?array
{
    $raw = q("SELECT value FROM app_meta WHERE name = 'google_drive'")->fetchColumn();
    $conn = $raw ? json_decode((string) $raw, true) : null;
    return is_array($conn) && !empty($conn['refresh_token']) ? $conn : null;
}

function gdrive_save_meta(string $name, ?array $value): void
{
    if ($value === null) {
        q('DELETE FROM app_meta WHERE name = ?', [$name]);
        return;
    }
    q('INSERT INTO app_meta (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [$name, json_encode($value, JSON_UNESCAPED_SLASHES)]);
}

/** Where Google sends the admin back after sign-in. Must be listed in the OAuth client exactly. */
function gdrive_redirect_uri(): string
{
    $api = config()['public_api_url'] ?? (rtrim(setting('company_website'), '/') . '/api/ai/v1');
    return rtrim($api, '/') . '/system/google/callback';
}

/** Start connecting: a one-time state value ties Google's answer to this admin's request. */
function gdrive_auth_url(int $userId): string
{
    if (!gdrive_configured()) {
        throw new ApiError('Add google_drive client_id and client_secret to config.php first (portal README, Back-ups).', 422);
    }
    $state = bin2hex(random_bytes(32));
    gdrive_save_meta('google_oauth_state', ['hash' => hash('sha256', $state), 'user_id' => $userId, 'expires' => time() + GDRIVE_STATE_MINUTES * 60]);
    $c = gdrive_config();
    return $c['auth_url'] . '?' . http_build_query([
        'client_id' => $c['client_id'],
        'redirect_uri' => gdrive_redirect_uri(),
        'response_type' => 'code',
        'scope' => GDRIVE_SCOPE,
        'access_type' => 'offline',
        'prompt' => 'consent',
        'include_granted_scopes' => 'false',
        'state' => $state,
    ]);
}

/** Finish connecting: check the state, swap the code for a refresh token, create the folder. */
function gdrive_finish(string $code, string $state): array
{
    $saved = json_decode((string) q("SELECT value FROM app_meta WHERE name = 'google_oauth_state'")->fetchColumn(), true);
    gdrive_save_meta('google_oauth_state', null);
    if (!is_array($saved) || $state === '' || !hash_equals((string) $saved['hash'], hash('sha256', $state)) || (int) $saved['expires'] < time()) {
        throw new RuntimeException('This sign-in link has expired. Press "Connect Google Drive" again.');
    }
    if ($code === '') {
        throw new RuntimeException('Google did not grant access.');
    }
    $c = gdrive_config();
    $tokens = gdrive_token_request([
        'code' => $code, 'client_id' => $c['client_id'], 'client_secret' => $c['client_secret'],
        'redirect_uri' => gdrive_redirect_uri(), 'grant_type' => 'authorization_code',
    ]);
    if (empty($tokens['refresh_token'])) {
        throw new RuntimeException('Google did not return a long-term token. Remove the app at myaccount.google.com/permissions and connect again.');
    }
    [$status, , $body] = gdrive_http('POST', $c['api_url'] . '/files?fields=id', [
        "Authorization: Bearer {$tokens['access_token']}", 'Content-Type: application/json',
    ], json_encode(['name' => GDRIVE_FOLDER_NAME, 'mimeType' => 'application/vnd.google-apps.folder']));
    $folder = json_decode($body, true)['id'] ?? null;
    if ($status !== 200 || !$folder) {
        throw new RuntimeException("Could not create the \"" . GDRIVE_FOLDER_NAME . "\" folder in Google Drive (HTTP {$status}).");
    }
    $conn = ['refresh_token' => $tokens['refresh_token'], 'folder_id' => $folder, 'connected_at' => now_utc(), 'connected_by' => (int) $saved['user_id']];
    gdrive_save_meta('google_drive', $conn);
    return $conn;
}

function gdrive_disconnect(): void
{
    $conn = gdrive_connection();
    gdrive_save_meta('google_drive', null);
    if ($conn) {
        // Best effort: also withdraw the permission at Google.
        @gdrive_http('POST', 'https://oauth2.googleapis.com/revoke', ['Content-Type: application/x-www-form-urlencoded'], http_build_query(['token' => $conn['refresh_token']]));
    }
}

function gdrive_token_request(array $fields): array
{
    [$status, , $body] = gdrive_http('POST', gdrive_config()['token_url'], ['Content-Type: application/x-www-form-urlencoded'], http_build_query($fields));
    $data = json_decode($body, true) ?: [];
    if ($status !== 200 || empty($data['access_token'])) {
        if (($data['error'] ?? '') === 'invalid_grant') {
            throw new RuntimeException('Google Drive access was removed or has expired. Connect Google Drive again on the Automation page.');
        }
        throw new RuntimeException('Google sign-in failed (' . ($data['error'] ?? "HTTP {$status}") . ').');
    }
    return $data;
}

/**
 * Upload the backup to the Chromolog folder (resumable upload, any size), then delete the oldest
 * copies beyond `keep`. @return array{file_id: string, kept: int}
 */
function gdrive_upload_backup(string $zipPath): array
{
    $conn = gdrive_connection();
    if (!$conn) {
        throw new RuntimeException('Google Drive is not connected yet. Press "Connect Google Drive" on the Automation page.');
    }
    $c = gdrive_config();
    $token = gdrive_token_request([
        'refresh_token' => $conn['refresh_token'], 'client_id' => $c['client_id'], 'client_secret' => $c['client_secret'], 'grant_type' => 'refresh_token',
    ])['access_token'];
    $auth = "Authorization: Bearer {$token}";
    $size = (int) filesize($zipPath);

    [$status, $headers] = gdrive_http('POST', $c['upload_url'] . '/files?uploadType=resumable', [
        $auth, 'Content-Type: application/json; charset=UTF-8', 'X-Upload-Content-Type: application/zip', "X-Upload-Content-Length: {$size}",
    ], json_encode(['name' => basename($zipPath), 'parents' => [$conn['folder_id']]]));
    $session = $headers['location'] ?? '';
    if ($status === 404) {
        throw new RuntimeException('The "' . GDRIVE_FOLDER_NAME . '" folder is gone from Google Drive. Disconnect and connect Google Drive again.');
    }
    if ($status !== 200 || $session === '') {
        throw new RuntimeException("Google Drive refused the upload (HTTP {$status}).");
    }
    [$status, , $body] = gdrive_http('PUT', $session, ['Content-Type: application/zip'], null, $zipPath);
    $fileId = json_decode($body, true)['id'] ?? '';
    if (!in_array($status, [200, 201], true) || $fileId === '') {
        throw new RuntimeException("The upload to Google Drive did not finish (HTTP {$status}).");
    }

    // Keep the newest N copies in the folder (only files this app created are visible to it).
    $q = http_build_query(['q' => "'{$conn['folder_id']}' in parents and trashed = false", 'orderBy' => 'createdTime desc', 'fields' => 'files(id,name)', 'pageSize' => 1000]);
    [$status, , $body] = gdrive_http('GET', $c['api_url'] . "/files?{$q}", [$auth]);
    $files = $status === 200 ? (json_decode($body, true)['files'] ?? []) : [];
    $keep = max(1, (int) $c['keep']);
    foreach (array_slice($files, $keep) as $old) {
        gdrive_http('DELETE', $c['api_url'] . '/files/' . rawurlencode((string) $old['id']), [$auth]);
    }
    return ['file_id' => $fileId, 'kept' => min(count($files), $keep)];
}

/**
 * Minimal HTTP client. $file streams a file as the request body.
 * @return array{0: int, 1: array<string, string>, 2: string} status, lower-cased headers, body
 */
function gdrive_http(string $method, string $url, array $headers, ?string $body = null, ?string $file = null): array
{
    $ch = curl_init($url);
    $responseHeaders = [];
    $opts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 300,
        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$responseHeaders) {
            if (str_contains($line, ':')) {
                [$k, $v] = explode(':', $line, 2);
                $responseHeaders[strtolower(trim($k))] = trim($v);
            }
            return strlen($line);
        },
    ];
    $handle = null;
    if ($file !== null) {
        $handle = fopen($file, 'rb');
        $opts[CURLOPT_UPLOAD] = true;
        $opts[CURLOPT_INFILE] = $handle;
        $opts[CURLOPT_INFILESIZE] = filesize($file);
    } elseif ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $opts);
    $result = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($handle) {
        fclose($handle);
    }
    if ($result === false) {
        throw new RuntimeException("Could not reach Google ({$error}).");
    }
    return [$status, $responseHeaders, (string) $result];
}
