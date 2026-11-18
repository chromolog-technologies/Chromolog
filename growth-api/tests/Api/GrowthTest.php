<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\Depends;

/**
 * The sales funnel report, the "why was it lost" rule, old-data cleanup, and the
 * database-protection retry on the Automation page.
 */
final class GrowthTest extends ApiTestCase
{
    public function testAdminSignsIn(): string
    {
        return self::signIn(self::ADMIN_EMAIL, self::ADMIN_PASSWORD);
    }

    #[Depends('testAdminSignsIn')]
    public function testLostLeadsNeedAReason(string $admin): int
    {
        [$status, $data] = self::call('POST', 'leads', ['full_name' => 'Lost Prospect', 'email' => 'lost@example.test', 'source' => 'referral'], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $id = (int) $data['lead']['id'];

        [$status, $data] = self::call('PUT', "leads/{$id}", ['status' => 'lost'], $admin);
        $this->assertSame(422, $status, 'Marking a lead lost without a reason must be refused.');
        $this->assertStringContainsString('why', $data['error'] ?? json_encode($data));

        [$status] = self::call('PUT', "leads/{$id}", ['status' => 'lost', 'lost_reason' => 'made_up'], $admin);
        $this->assertSame(422, $status, 'Only the listed reasons are accepted.');

        [$status, $data] = self::call('PUT', "leads/{$id}", ['status' => 'lost', 'lost_reason' => 'price'], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertSame('price', $data['lead']['lost_reason']);

        // Reopening clears the reason, so it can't linger on a live lead.
        [, $data] = self::call('PUT', "leads/{$id}", ['status' => 'contacted'], $admin);
        $this->assertNull($data['lead']['lost_reason']);
        [, $data] = self::call('PUT', "leads/{$id}", ['status' => 'lost', 'lost_reason' => 'competitor'], $admin);
        $this->assertSame('competitor', $data['lead']['lost_reason']);
        return $id;
    }

    #[Depends('testAdminSignsIn')]
    #[Depends('testLostLeadsNeedAReason')]
    public function testSalesFunnelReport(string $admin): void
    {
        // A won website lead that waited 90 minutes for its first reply, and one nobody answered yet.
        [, $won] = self::call('POST', 'leads', ['full_name' => 'Won Client', 'email' => 'won@example.test', 'source' => 'contact_form', 'estimated_value' => 50000], $admin);
        self::$pdo->prepare('UPDATE leads SET created_at = ? WHERE id = ?')->execute([gmdate('Y-m-d H:i:s', time() - 90 * 60), $won['lead']['id']]);
        self::call('PUT', "leads/{$won['lead']['id']}", ['status' => 'won'], $admin);
        self::call('POST', 'leads', ['full_name' => 'Waiting Visitor', 'email' => 'wait@example.test', 'source' => 'contact_form'], $admin);
        self::call('POST', 'leads', ['full_name' => 'Spam Bot', 'email' => 'spam@example.test', 'source' => 'contact_form', 'status' => 'spam'], $admin);

        [$status, $d] = self::call('GET', 'leads/report', null, $admin);
        $this->assertSame(200, $status, 'The report must not be swallowed by the leads/{id} route: ' . json_encode($d));
        $this->assertSame(3, $d['total']['leads'], 'Spam is left out of the funnel.');
        $this->assertSame(1, $d['total']['won']);
        $this->assertSame(1, $d['total']['lost']);
        $this->assertEqualsWithDelta(50000, (float) $d['total']['won_value'], 0.01);
        $this->assertSame(1, $d['unanswered'], 'The waiting visitor has had no reply yet.');

        $sources = array_column($d['by_source'], null, 'source');
        $this->assertSame(2, $sources['contact_form']['leads']);
        $this->assertSame(1, $sources['contact_form']['won']);
        $this->assertSame(1, $sources['referral']['leads']);
        $this->assertSame([['reason' => 'competitor', 'leads' => 1]], $d['lost_reasons']);

        // Two answered leads: ~90 minutes and ~0 minutes, so the median is about 45.
        $this->assertSame(2, $d['answered']);
        $this->assertEqualsWithDelta(45, $d['median_first_response_minutes'], 2);

        [$status] = self::call('GET', 'leads/report?from=2001-01-01&to=2001-12-31', null, $admin);
        $this->assertSame(200, $status, 'An empty period still answers.');
    }

    #[Depends('testAdminSignsIn')]
    public function testOldChatsAndRateLimitRecordsAreCleanedUp(string $admin): void
    {
        $old = gmdate('Y-m-d H:i:s', strtotime('-14 months'));
        $recent = gmdate('Y-m-d H:i:s', strtotime('-2 days'));
        $pdo = self::$pdo;
        $pdo->prepare('INSERT INTO requests (ip_hash, created_at) VALUES (?, ?), (?, ?)')->execute(['old', $old, 'new', $recent]);
        foreach ([['old-chat', $old], ['old-chat-with-lead', $old], ['new-chat', $recent]] as [$session, $at]) {
            $pdo->prepare('INSERT INTO conversations (session_id, ip_hash, created_at, updated_at) VALUES (?, ?, ?, ?)')->execute([$session, 'x', $at, $at]);
            $pdo->prepare('INSERT INTO messages (session_id, role, text, created_at) VALUES (?, ?, ?, ?)')->execute([$session, 'user', 'Hello', $at]);
        }
        $pdo->prepare('INSERT INTO leads (session_id, source, full_name, email) VALUES (?, ?, ?, ?)')->execute(['old-chat-with-lead', 'website_chat', 'Chat Lead', 'chat@example.test']);

        [$status, $data] = self::call('POST', 'system/run-daily', ['force' => true], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertSame('ok', $data['results']['cleanup']['status'], json_encode($data['results']['cleanup']));

        $sessions = $pdo->query('SELECT session_id FROM conversations ORDER BY session_id')->fetchAll(PDO::FETCH_COLUMN);
        $this->assertSame(['new-chat', 'old-chat-with-lead'], $sessions, 'Old chats go, unless they turned into a lead.');
        $this->assertSame(['new-chat', 'old-chat-with-lead'], $pdo->query('SELECT DISTINCT session_id FROM messages ORDER BY session_id')->fetchAll(PDO::FETCH_COLUMN));
        $this->assertSame(0, (int) $pdo->query("SELECT COUNT(*) FROM requests WHERE ip_hash = 'old'")->fetchColumn());
        $this->assertSame(1, (int) $pdo->query("SELECT COUNT(*) FROM requests WHERE ip_hash = 'new'")->fetchColumn());
    }

    #[Depends('testAdminSignsIn')]
    public function testDatabaseProtectionCanBeRetried(string $admin): void
    {
        [$status, $data] = self::call('POST', 'system/triggers', [], $admin);
        $this->assertSame(200, $status, json_encode($data));
        $this->assertSame(0, $data['missing']);
        $this->assertSame('Database-level protection is on.', $data['message']);

        [, $jobs] = self::call('GET', 'system/jobs', null, $admin);
        $this->assertSame($jobs['database']['triggers_expected'], count($data['created']));
        $this->assertCount($jobs['database']['triggers_expected'], $jobs['database']['protected_by_triggers']);
    }

    public function testNewLeadsGetAThankYouWithTheBookingLink(): void
    {
        [$status] = self::call('POST', '/lead.php', ['source' => 'free_consultation', 'full_name' => 'Meera Pillai', 'email' => 'meera@example.test', 'service_interest' => 'Clinic app']);
        $this->assertSame(200, $status);
        self::call('POST', '/lead.php', ['source' => 'newsletter', 'email' => 'reader@example.test']);

        $log = (string) file_get_contents(self::$workDir . '/mail.log');
        $this->assertMatchesRegularExpression('/To: meera@example\.test\nSubject: Thank you for contacting Chromolog Technologies\n/', $log);
        $this->assertStringContainsString("Hi Meera,", $log);
        $this->assertStringContainsString('about Clinic app', $log);
        $this->assertStringContainsString('https://cal.example.test/chromolog', $log);
        $this->assertStringNotContainsString('To: reader@example.test', $log, 'Newsletter sign-ups get no thank-you email.');
    }

    #[Depends('testAdminSignsIn')]
    public function testDigestListsLeadsWaitingOverADay(string $admin): void
    {
        self::$pdo->prepare('INSERT INTO leads (session_id, source, full_name, email, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute(['waiting-2-days', 'contact_form', 'Forgotten Visitor', 'forgotten@example.test', gmdate('Y-m-d H:i:s', strtotime('-2 days'))]);
        [$status, $data] = self::call('POST', 'system/run-daily', ['force' => true], $admin);
        $this->assertSame(200, $status, json_encode($data));

        $log = (string) file_get_contents(self::$workDir . '/mail.log');
        $digests = array_filter(explode('=== ', $log), fn ($e) => str_contains($e, 'To: ' . self::ADMIN_EMAIL . "\n"));
        $this->assertNotEmpty($digests, 'The admin gets a digest.');
        $digest = end($digests);
        $this->assertStringContainsString('LEADS WAITING OVER A DAY FOR A FIRST REPLY', $digest);
        $this->assertStringContainsString('Forgotten Visitor', $digest);
        $this->assertStringNotContainsString('Waiting Visitor', $digest, 'A lead from today is not late yet.');
    }
}
