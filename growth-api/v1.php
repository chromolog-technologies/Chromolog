<?php

declare(strict_types=1);

/**
 * Chromolog company portal API — https://chromologtechnologies.com/api/ai/v1/<route>
 * Auth: POST v1/auth/login → { token }, then send "Authorization: Bearer <token>"
 * (or "X-Auth-Token: <token>" where a host strips Authorization).
 */

require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/mailer.php';
require __DIR__ . '/src/portal/core.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

$router = new Router();
foreach (['people', 'crm', 'sales', 'accounting', 'projects'] as $module) {
    require __DIR__ . "/src/portal/routes/{$module}.php";
}

try {
    ensure_admin_user();
    $route = (string) ($_GET['route'] ?? '');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    // HTML forms with files can only POST; allow _method=PUT override for multipart updates.
    if ($method === 'POST' && in_array($_POST['_method'] ?? '', ['PUT', 'DELETE'], true)) {
        $method = $_POST['_method'];
    }
    json_response($router->dispatch($method, $route));
} catch (ApiError $e) {
    json_response(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    error_log('Chromolog portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_response(['error' => 'Something went wrong. Please try again.'], 500);
}
