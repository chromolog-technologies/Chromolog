<?php

declare(strict_types=1);

/**
 * Test start-up: load the API's functions without connecting to a database.
 * Unit tests call pure functions only. Api tests talk to a real server over HTTP (see Api/ApiTestCase.php).
 */

require __DIR__ . '/../src/bootstrap.php';
require __DIR__ . '/../src/mailer.php';
require __DIR__ . '/../src/portal/core.php';
require __DIR__ . '/../src/portal/security.php';
require __DIR__ . '/../src/portal/invoicing.php';
require __DIR__ . '/../src/portal/jobs.php';
require __DIR__ . '/Api/ApiTestCase.php';
