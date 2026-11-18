<?php

declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** The password rules every portal account must meet. */
final class PasswordPolicyTest extends TestCase
{
    public static function weak(): iterable
    {
        yield 'too short' => ['Ab1!xyz'];
        yield 'only two kinds of character' => ['lowercaseandnumbers123'];
        yield 'common word' => ['Chromolog2026!'];
        yield 'simple sequence' => ['Xy!1234abcdQ'];
        yield 'repeated characters' => ['Aaaaaaa1!aaaa'];
    }

    #[DataProvider('weak')]
    public function testRejectsWeakPasswords(string $password): void
    {
        $this->assertNotSame([], password_problems($password));
    }

    public function testRejectsThePersonsOwnName(): void
    {
        $this->assertNotSame([], password_problems('Asha#Tree9Lamp!Q', ['name' => 'Asha Varghese', 'email' => 'someone@example.com']));
    }

    public function testAcceptsAStrongPassword(): void
    {
        $this->assertSame([], password_problems('Violet-Harbor-58-Kite', ['name' => 'Test Person', 'email' => 'test@example.com']));
    }

    public function testHashesVerifyAndAreNotThePassword(): void
    {
        $hash = hash_password('Violet-Harbor-58-Kite');
        $this->assertNotSame('Violet-Harbor-58-Kite', $hash);
        $this->assertTrue(password_verify('Violet-Harbor-58-Kite', $hash));
        $this->assertFalse(password_verify('violet-harbor-58-kite', $hash));
    }
}
