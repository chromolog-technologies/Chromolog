<?php

/**
 * Local development only: mimics .htaccess for PHP's built-in server.
 *   CHROMOLOG_CONFIG=/path/to/config.php php -S 127.0.0.1:8787 dev-router.php
 */

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Also accept the production prefix (/api/ai/...), so cookies scoped to /api/ai/ work locally.
$path = preg_replace('#^/api/ai(?=/)#', '', $path);

if (preg_match('#^/v1/(.*)$#', $path, $m)) {
    $_GET['route'] = $m[1];
    require __DIR__ . '/v1.php';
    return true;
}
if (preg_match('#^/(chat|lead|careers|admin)\.php$#', $path)) {
    return false; // serve the PHP file as-is
}
http_response_code(403);
echo 'Forbidden';
return true;
