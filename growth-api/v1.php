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
require __DIR__ . '/src/portal/security.php';
require __DIR__ . '/src/portal/invoicing.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
if (is_https()) {
    header('Strict-Transport-Security: max-age=31536000');
}

require __DIR__ . '/src/portal/jobs.php';

$router = new Router();
foreach (['people', 'crm', 'sales', 'invoices', 'accounting', 'projects', 'recurring', 'tickets', 'system'] as $module) {
    require __DIR__ . "/src/portal/routes/{$module}.php";
}

try {
    ensure_admin_user();
    $route = (string) ($_GET['route'] ?? '');
    $GLOBALS['portal_route'] = trim($route, '/');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    // HTML forms with files can only POST; allow _method=PUT override for multipart updates.
    if ($method === 'POST' && in_array($_POST['_method'] ?? '', ['PUT', 'DELETE'], true)) {
        $method = $_POST['_method'];
    }
    json_response($router->dispatch($method, $route));
} catch (ApiError $e) {
    json_response(['error' => $e->getMessage()], $e->status);
} catch (PDOException | RuntimeException $e) {
    if ($problem = database_problem($e)) {
        error_log('Chromolog portal API: ' . $e->getMessage());
        json_response(['error' => "Service unavailable. {$problem}"], 503);
    }
    if (!$e instanceof PDOException) {
        error_log('Chromolog portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        json_response(['error' => 'Something went wrong. Please try again.'], 500);
    }
    // Turn database constraint errors into clear messages instead of a generic 500.
    if (str_contains($e->getMessage(), 'foreign key constraint fails')) {
        json_response(['error' => 'One of the selected records (person, client, project…) does not exist any more. Refresh and try again.'], 422);
    }
    // Protected records (issued invoices, invoice history): the database refuses the change.
    if (preg_match('/LOCKED: ([^\n]+)/', $e->getMessage(), $m)) {
        json_response(['error' => trim($m[1])], 422);
    }
    if (str_contains($e->getMessage(), 'Duplicate entry')) {
        json_response(['error' => 'That already exists. Please refresh and try again.'], 409);
    }
    error_log('Chromolog portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_response(['error' => 'Something went wrong. Please try again.'], 500);
} catch (Throwable $e) {
    error_log('Chromolog portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_response(['error' => 'Something went wrong. Please try again.'], 500);
}
