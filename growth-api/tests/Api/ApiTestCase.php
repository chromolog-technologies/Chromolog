<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Runs the real API (dev-router.php on PHP's built-in server) against a real, EMPTY MySQL/MariaDB
 * test database, and talks to it over HTTP the way the portal does.
 *
 * Needs these environment variables (CI sets them; skipped when they are missing):
 *   CHROMOLOG_TEST_DB_NAME (must end in "_test": every table in it is dropped first),
 *   CHROMOLOG_TEST_DB_HOST, CHROMOLOG_TEST_DB_PORT, CHROMOLOG_TEST_DB_USER, CHROMOLOG_TEST_DB_PASSWORD
 */
abstract class ApiTestCase extends TestCase
{
    protected const ADMIN_EMAIL = 'admin@example.test';
    protected const ADMIN_PASSWORD = 'Admin-Test-Pass-58!';
    protected const BACKUP_PASSWORD = 'Backup-Test-Pass-91!';

    protected static string $googleUrl = '';
    protected static string $googleDir = '';

    protected static string $baseUrl = '';
    protected static string $workDir = '';
    protected static ?PDO $pdo = null;
    /** @var list<resource> */
    private static array $servers = [];

    public static function setUpBeforeClass(): void
    {
        $name = (string) getenv('CHROMOLOG_TEST_DB_NAME');
        if ($name === '') {
            self::markTestSkipped('Set CHROMOLOG_TEST_DB_NAME (and host, port, user, password) to run the API tests.');
        }
        if (!str_ends_with($name, '_test')) {
            self::fail('CHROMOLOG_TEST_DB_NAME must end in "_test": the tests delete everything in it.');
        }
        $db = [
            'host' => getenv('CHROMOLOG_TEST_DB_HOST') ?: '127.0.0.1',
            'port' => (int) (getenv('CHROMOLOG_TEST_DB_PORT') ?: 3306),
            'name' => $name,
            'user' => getenv('CHROMOLOG_TEST_DB_USER') ?: 'root',
            'password' => (string) getenv('CHROMOLOG_TEST_DB_PASSWORD'),
        ];
        self::$pdo = new PDO("mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        self::emptyDatabase();

        self::$workDir = sys_get_temp_dir() . '/chromolog-test-' . bin2hex(random_bytes(4));
        mkdir(self::$workDir . '/uploads', 0700, true);
        self::$googleDir = self::$workDir . '/google';
        mkdir(self::$googleDir, 0700, true);
        $port = self::freePort();
        $googlePort = self::freePort();
        self::$baseUrl = "http://127.0.0.1:{$port}";
        self::$googleUrl = "http://127.0.0.1:{$googlePort}";
        $config = [
            'db' => $db,
            'admin_email' => self::ADMIN_EMAIL,
            'admin_password_hash' => password_hash(self::ADMIN_PASSWORD, PASSWORD_BCRYPT),
            'ip_salt' => 'test-salt',
            'uploads_path' => self::$workDir . '/uploads',
            'backup_path' => self::$workDir . '/backups',
            'mail_log' => self::$workDir . '/mail.log',
            'notify_email' => 'team@example.test',
            'portal_url' => 'http://localhost/portal',
            'public_api_url' => self::$baseUrl . '/api/ai/v1',
            'backup_password' => self::BACKUP_PASSWORD,
            'offsite_backup' => ['method' => 'google_drive'],
            'google_drive' => [
                'client_id' => 'test-client', 'client_secret' => 'test-secret', 'keep' => 2,
                'auth_url' => self::$googleUrl . '/auth', 'token_url' => self::$googleUrl . '/token',
                'api_url' => self::$googleUrl . '/drive/v3', 'upload_url' => self::$googleUrl . '/upload/drive/v3',
            ],
            'lead_thank_you' => ['enabled' => true, 'booking_url' => 'https://cal.example.test/chromolog', 'whatsapp' => '+91 00000 00000'],
            'allowed_origins' => [],
            'timezone' => 'Asia/Kolkata',
            'rate_limit_per_hour' => 1000,
            'daily_message_cap' => 1000,
        ];
        file_put_contents(self::$workDir . '/config.php', '<?php return ' . var_export($config, true) . ';');

        self::startServer($port, dirname(__DIR__, 2), 'dev-router.php', ['CHROMOLOG_CONFIG' => self::$workDir . '/config.php']);
        self::startServer($googlePort, dirname(__DIR__) . '/fixtures', 'fake-google.php', ['FAKE_GOOGLE_DIR' => self::$googleDir]);
    }

    private static function startServer(int $port, string $root, string $router, array $env): void
    {
        $log = self::$workDir . '/server.log';
        self::$servers[] = proc_open([PHP_BINARY, '-S', "127.0.0.1:{$port}", $router],
            [0 => ['pipe', 'r'], 1 => ['file', $log, 'a'], 2 => ['file', $log, 'a']], $pipes, $root, $env + getenv());
        for ($i = 0; $i < 50; $i++) {
            if (@fsockopen('127.0.0.1', $port)) {
                return;
            }
            usleep(100_000);
        }
        self::fail("A test server ({$router}) did not start. See {$log}");
    }

    public static function tearDownAfterClass(): void
    {
        foreach (self::$servers as $server) {
            proc_terminate($server);
            proc_close($server);
        }
        self::$servers = [];
    }

    private static function emptyDatabase(): void
    {
        $pdo = self::$pdo;
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($pdo->query('SHOW TRIGGERS')->fetchAll() as $t) {
            $pdo->exec("DROP TRIGGER IF EXISTS `{$t['Trigger']}`");
        }
        foreach ($pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_COLUMN) as $table) {
            $pdo->exec("DROP TABLE `{$table}`");
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    private static function freePort(): int
    {
        $socket = stream_socket_server('tcp://127.0.0.1:0');
        $port = (int) substr(strrchr(stream_socket_get_name($socket, false), ':'), 1);
        fclose($socket);
        return $port;
    }

    /**
     * Call the portal API (path under /api/ai/v1/) or another entry point (path starting with "/").
     * @return array{0: int, 1: array} HTTP status and decoded JSON body
     */
    protected static function call(string $method, string $path, ?array $body = null, ?string $token = null): array
    {
        $url = self::$baseUrl . (str_starts_with($path, '/') ? $path : "/api/ai/v1/{$path}");
        $headers = ['Accept: application/json'];
        if ($token !== null) {
            $headers[] = "Authorization: Bearer {$token}";
        }
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_PROXY => '',
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        $data = json_decode((string) $raw, true);
        return [$status, is_array($data) ? $data : ['raw' => $raw]];
    }

    /** A plain GET without following redirects. @return array{0: int, 1: string} status and Location header */
    protected static function redirectOf(string $url): array
    {
        $ch = curl_init($url);
        $location = '';
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_PROXY => '', CURLOPT_TIMEOUT => 30,
            CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$location) {
                if (stripos($line, 'Location:') === 0) {
                    $location = trim(substr($line, 9));
                }
                return strlen($line);
            }]);
        curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return [$status, $location];
    }

    /** Sign in like a script does and return the token. */
    protected static function signIn(string $email, string $password): string
    {
        [$status, $data] = self::call('POST', 'auth/login', ['email' => $email, 'password' => $password, 'api_client' => true]);
        self::assertSame(200, $status, 'Sign-in failed: ' . json_encode($data));
        return $data['token'];
    }

    /** The most recent activation/reset link emailed to this address (from the test mail log). */
    protected static function linkTokenFor(string $email): string
    {
        $log = (string) @file_get_contents(self::$workDir . '/mail.log');
        $entries = array_filter(explode('=== ', $log), fn ($e) => str_contains($e, "To: {$email}\n"));
        self::assertNotEmpty($entries, "No email was sent to {$email}.");
        self::assertMatchesRegularExpression('/activate\?token=([a-f0-9]{64})/', end($entries));
        preg_match('/activate\?token=([a-f0-9]{64})/', end($entries), $m);
        return $m[1];
    }
}
