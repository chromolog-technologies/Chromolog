<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\Depends;

/**
 * End-to-end checks on the rules that matter most: who may sign in and see what, how invoices are
 * numbered and taxed, that issued invoices can never be deleted, and that website leads arrive.
 */
final class PortalApiTest extends ApiTestCase
{
    private const STAFF_PASSWORD = 'Copper-Lantern-73-Field';

    public function testWrongPasswordIsRefused(): void
    {
        [$status] = self::call('POST', 'auth/login', ['email' => self::ADMIN_EMAIL, 'password' => 'not-the-password', 'api_client' => true]);
        $this->assertSame(401, $status);
    }

    public function testRequestsWithoutSignInAreRefused(): void
    {
        [$status] = self::call('GET', 'invoices');
        $this->assertSame(401, $status);
    }

    public function testFirstAdminIsCreatedFromConfig(): string
    {
        return self::signIn(self::ADMIN_EMAIL, self::ADMIN_PASSWORD);
    }

    /** @return array{admin: string, accounts: string, employee: string} */
    #[Depends('testFirstAdminIsCreatedFromConfig')]
    public function testInvitedStaffActivateTheirAccounts(string $admin): array
    {
        $tokens = ['admin' => $admin];
        foreach (['accounts', 'employee'] as $role) {
            $email = "{$role}@example.test";
            [$status, $data] = self::call('POST', 'users', ['name' => ucfirst($role) . ' Tester', 'email' => $email, 'role' => $role], $admin);
            $this->assertSame(200, $status, json_encode($data));
            $this->assertTrue($data['user']['invite_pending']);

            [$status] = self::call('POST', 'auth/link', ['token' => self::linkTokenFor($email), 'password' => 'weak'], null);
            $this->assertSame(422, $status, 'A weak password must be refused at activation.');
            [$status, $data] = self::call('POST', 'auth/link', ['token' => self::linkTokenFor($email), 'password' => self::STAFF_PASSWORD], null);
            $this->assertSame(200, $status, json_encode($data));

            $tokens[$role] = self::signIn($email, self::STAFF_PASSWORD);
        }
        return $tokens;
    }

    #[Depends('testInvitedStaffActivateTheirAccounts')]
    public function testEachRoleSeesOnlyItsOwnArea(array $t): void
    {
        $this->assertSame(403, self::call('GET', 'invoices', null, $t['employee'])[0], 'Employees must not see invoices.');
        $this->assertSame(403, self::call('GET', 'leads', null, $t['employee'])[0], 'Employees must not see leads.');
        $this->assertSame(403, self::call('GET', 'users', null, $t['accounts'])[0], 'Only admins manage users.');
        $this->assertSame(403, self::call('PUT', 'settings', ['company_name' => 'X'], $t['accounts'])[0], 'Only admins change settings.');
        $this->assertSame(200, self::call('GET', 'invoices', null, $t['accounts'])[0]);
        $this->assertSame(200, self::call('GET', 'invoices', null, $t['admin'])[0]);
    }

    /** @return array{tokens: array, kerala: int, karnataka: int, first: int, second: int} */
    #[Depends('testInvitedStaffActivateTheirAccounts')]
    public function testIssuedInvoicesGetTheNextNumberAndTheRightGst(array $t): array
    {
        [$status] = self::call('PUT', 'settings', ['tax_enabled' => '1', 'company_state' => '32', 'invoice_number_fy' => '1'], $t['admin']);
        $this->assertSame(200, $status);
        $kerala = self::call('POST', 'clients', ['name' => 'Kochi Clinic', 'state_code' => '32'], $t['accounts'])[1]['client']['id'];
        $karnataka = self::call('POST', 'clients', ['name' => 'Bengaluru School', 'state_code' => '29'], $t['accounts'])[1]['client']['id'];
        $line = [['description' => 'Website build', 'quantity' => 1, 'unit_price' => 10000, 'gst_rate' => 18]];

        [$status, $data] = self::call('POST', 'invoices', ['client_id' => $kerala, 'issue_date' => '2026-11-18', 'items' => $line, 'issue' => true], $t['accounts']);
        $this->assertSame(200, $status, json_encode($data));
        $first = $data['invoice'];
        $this->assertSame('INV/26-27/0001', $first['number']);
        $this->assertSame('intra', $first['supply_type']);
        $this->assertEqualsWithDelta(900, $first['cgst'], 0.001);
        $this->assertEqualsWithDelta(900, $first['sgst'], 0.001);
        $this->assertEqualsWithDelta(11800, $first['total'], 0.001);

        [$status, $data] = self::call('POST', 'invoices', ['client_id' => $karnataka, 'issue_date' => '2026-11-18', 'items' => $line], $t['accounts']);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertStringStartsWith('DRAFT-', $data['invoice']['number'], 'A draft has no real number yet.');
        [$status, $data] = self::call('POST', "invoices/{$data['invoice']['id']}/issue", [], $t['accounts']);
        $this->assertSame(200, $status, json_encode($data));
        $second = $data['invoice'];
        $this->assertSame('INV/26-27/0002', $second['number']);
        $this->assertSame('inter', $second['supply_type']);
        $this->assertEqualsWithDelta(1800, $second['igst'], 0.001);

        return ['tokens' => $t, 'kerala' => $kerala, 'karnataka' => $karnataka, 'first' => $first['id'], 'second' => $second['id']];
    }

    #[Depends('testIssuedInvoicesGetTheNextNumberAndTheRightGst')]
    public function testIssuedInvoicesCannotBeDeletedButDraftsCan(array $s): void
    {
        $t = $s['tokens'];
        [$status] = self::call('DELETE', "invoices/{$s['first']}", null, $t['admin']);
        $this->assertSame(422, $status, 'Not even an admin may delete an issued invoice.');
        $this->assertSame(1, (int) self::$pdo->query("SELECT COUNT(*) FROM invoices WHERE id = {$s['first']}")->fetchColumn());

        $draft = self::call('POST', 'invoices', ['client_id' => $s['kerala'], 'items' => [['description' => 'Draft', 'quantity' => 1, 'unit_price' => 50]]], $t['accounts'])[1]['invoice'];
        [$status] = self::call('DELETE', "invoices/{$draft['id']}", null, $t['accounts']);
        $this->assertSame(200, $status);
    }

    #[Depends('testIssuedInvoicesGetTheNextNumberAndTheRightGst')]
    public function testDatabaseRefusesToDeleteIssuedInvoices(array $s): void
    {
        $triggers = self::$pdo->query("SHOW TRIGGERS LIKE 'invoices'")->fetchAll();
        if (!$triggers) {
            $this->markTestSkipped('This database user may not create triggers; the app-level rule is tested above.');
        }
        $this->expectException(PDOException::class);
        $this->expectExceptionMessageMatches('/LOCKED/');
        self::$pdo->exec("DELETE FROM invoices WHERE id = {$s['first']}");
    }

    #[Depends('testIssuedInvoicesGetTheNextNumberAndTheRightGst')]
    public function testCancelledNumbersAreNeverReused(array $s): void
    {
        $t = $s['tokens'];
        [$status] = self::call('POST', "invoices/{$s['second']}/cancel", [], $t['accounts']);
        $this->assertSame(422, $status, 'Cancelling needs a reason.');
        [$status] = self::call('POST', "invoices/{$s['second']}/cancel", ['reason' => 'Raised by mistake'], $t['accounts']);
        $this->assertSame(200, $status);

        [, $data] = self::call('POST', 'invoices', ['client_id' => $s['kerala'], 'issue_date' => '2026-11-19', 'items' => [['description' => 'Support', 'quantity' => 1, 'unit_price' => 2000, 'gst_rate' => 18]], 'issue' => true], $t['accounts']);
        $this->assertSame('INV/26-27/0003', $data['invoice']['number']);
    }

    #[Depends('testInvitedStaffActivateTheirAccounts')]
    public function testWebsiteLeadsReachTheLeadList(array $t): void
    {
        [$status, $data] = self::call('POST', '/lead.php', ['source' => 'contact_form', 'full_name' => 'Test Visitor', 'email' => 'visitor@example.test', 'summary' => 'Need a clinic app']);
        $this->assertSame(200, $status, json_encode($data));
        [$status] = self::call('POST', '/lead.php', ['source' => 'contact_form', 'full_name' => 'No Contact']);
        $this->assertSame(422, $status, 'A lead needs an email or phone.');

        [, $data] = self::call('GET', 'leads', null, $t['admin']);
        $this->assertContains('Test Visitor', array_column($data['items'], 'full_name'));
        $this->assertStringContainsString('New website lead: Test Visitor', (string) file_get_contents(self::$workDir . '/mail.log'));
    }
}
