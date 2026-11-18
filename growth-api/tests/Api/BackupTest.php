<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\Depends;

/**
 * Off-site backups: every backup is password-locked and uploaded to the connected Google Drive
 * folder (a fake Google here), old copies are pruned, and every failure says what to do.
 */
final class BackupTest extends ApiTestCase
{
    public function testBackupFailsClearlyUntilDriveIsConnected(): string
    {
        $admin = self::signIn(self::ADMIN_EMAIL, self::ADMIN_PASSWORD);
        [$status, $data] = self::call('POST', 'system/backup', [], $admin);
        $this->assertSame(502, $status);
        $this->assertStringContainsString('Google Drive is not connected yet', $data['error']);
        $this->assertStringContainsString('Backup saved on the server', $data['error'], 'The local copy must still be kept.');
        $this->assertNotEmpty(glob(self::$workDir . '/backups/chromolog-backup-*.zip'));
        return $admin;
    }

    #[Depends('testBackupFailsClearlyUntilDriveIsConnected')]
    public function testOnlyAdminsCanConnectDrive(string $admin): void
    {
        [$status] = self::call('POST', 'system/google/connect', []);
        $this->assertSame(401, $status);
    }

    #[Depends('testBackupFailsClearlyUntilDriveIsConnected')]
    public function testConnectingGoogleDrive(string $admin): string
    {
        [$status, $data] = self::call('POST', 'system/google/connect', [], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertStringStartsWith(self::$googleUrl . '/auth?', $data['url']);
        parse_str((string) parse_url($data['url'], PHP_URL_QUERY), $params);
        $this->assertSame('https://www.googleapis.com/auth/drive.file', $params['scope'], 'Only the narrowest Drive permission.');
        $this->assertSame('offline', $params['access_type']);
        $callback = self::$baseUrl . '/api/ai/v1/system/google/callback';
        $this->assertSame($callback, $params['redirect_uri']);

        // A forged or wrong state is refused and connects nothing.
        [$status, $location] = self::redirectOf("{$callback}?code=good-code&state=" . str_repeat('a', 64));
        $this->assertSame(302, $status);
        $this->assertStringContainsString('drive_error=', $location);

        // Google sends the browser back with a code (no portal cookie on this cross-site redirect).
        [, $data] = self::call('POST', 'system/google/connect', [], $admin);
        parse_str((string) parse_url($data['url'], PHP_URL_QUERY), $params);
        [$status, $location] = self::redirectOf("{$callback}?code=good-code&state={$params['state']}");
        $this->assertSame(302, $status);
        $this->assertSame('http://localhost/portal/automation?drive=connected', $location);

        // The same sign-in can't be replayed.
        [, $location] = self::redirectOf("{$callback}?code=good-code&state={$params['state']}");
        $this->assertStringContainsString('drive_error=', $location);

        [, $data] = self::call('GET', 'system/jobs', null, $admin);
        $this->assertTrue($data['offsite']['google']['connected']);
        $this->assertTrue($data['offsite']['locked']);
        $this->assertSame('https://drive.google.com/drive/folders/folder-1', $data['offsite']['google']['folder_url']);
        return $admin;
    }

    #[Depends('testConnectingGoogleDrive')]
    public function testBackupIsLockedAndUploaded(string $admin): string
    {
        [$status, $data] = self::call('POST', 'system/backup', [], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertTrue($data['backup']['locked']);
        $this->assertSame('sent', $data['backup']['offsite']['status']);
        $this->assertSame('google_drive', $data['backup']['offsite']['method']);

        $uploaded = self::$googleDir . '/file-1.zip';
        $this->assertFileExists($uploaded);
        $zip = new ZipArchive();
        $this->assertTrue($zip->open($uploaded));
        $this->assertFalse(@$zip->getFromName('database.sql'), 'Without the password the backup must not open.');
        $zip->setPassword(self::BACKUP_PASSWORD);
        $this->assertStringContainsString('CREATE TABLE `invoices`', (string) $zip->getFromName('database.sql'));
        $zip->close();

        [, $data] = self::call('GET', 'system/jobs', null, $admin);
        $this->assertSame($data['offsite']['last']['file'], basename(glob(self::$workDir . '/backups/chromolog-backup-*.zip')[0] ?? ''));
        return $admin;
    }

    #[Depends('testBackupIsLockedAndUploaded')]
    public function testOnlyTheNewestCopiesAreKeptInDrive(string $admin): void
    {
        foreach ([1, 2] as $ignored) {
            sleep(1); // backup names are per second
            $this->assertSame(200, self::call('POST', 'system/backup', [], $admin)[0]);
        }
        $state = json_decode((string) file_get_contents(self::$googleDir . '/state.json'), true);
        $this->assertSame(['file-2', 'file-3'], array_column(array_reverse($state['files']), 'id'));
        $this->assertSame(['file-1'], $state['deleted']);
    }

    #[Depends('testOnlyTheNewestCopiesAreKeptInDrive')]
    public function testRevokedAccessSaysToReconnect(): void
    {
        $admin = self::signIn(self::ADMIN_EMAIL, self::ADMIN_PASSWORD);
        touch(self::$googleDir . '/revoked');
        [$status, $data] = self::call('POST', 'system/backup', [], $admin);
        $this->assertSame(502, $status);
        $this->assertStringContainsString('Connect Google Drive again', $data['error']);

        [, $data] = self::call('GET', 'system/jobs', null, $admin);
        $this->assertSame('error', $data['runs'][0]['status'], 'The failure is recorded for the Automation page and the digest.');
    }

    #[Depends('testRevokedAccessSaysToReconnect')]
    public function testDisconnecting(): void
    {
        $admin = self::signIn(self::ADMIN_EMAIL, self::ADMIN_PASSWORD);
        $this->assertSame(200, self::call('DELETE', 'system/google', null, $admin)[0]);
        [, $data] = self::call('GET', 'system/jobs', null, $admin);
        $this->assertFalse($data['offsite']['google']['connected']);
    }
}
