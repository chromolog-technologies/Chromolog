<?php

declare(strict_types=1);

use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Email the team through Hostinger SMTP, authenticated as a real mailbox.
 * PHP mail() is not used: the domain's DMARC policy is p=reject, so unauthenticated mail
 * from the web server is silently rejected by Gmail and others.
 *
 * @param array{path: string, name: string, type: string}|null $attachment
 * @return bool true when the message was handed to the SMTP server
 */
function send_team_email(string $subject, string $body, ?string $replyTo = null, ?array $attachment = null): bool
{
    $cfg = config();
    $to = $cfg['notify_email'] ?? '';
    if ($to === '' || empty($cfg['smtp_user']) || empty($cfg['smtp_password'])) {
        error_log('Chromolog growth-api: email skipped, SMTP not configured');
        return false;
    }

    $email = (new Email())
        ->from(new Address($cfg['smtp_user'], 'Chromolog Growth OS'))
        ->to($to)
        ->subject($subject)
        ->text($body);
    if ($replyTo !== null && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $email->replyTo($replyTo);
    }
    if ($attachment !== null) {
        $email->attachFromPath($attachment['path'], $attachment['name'], $attachment['type']);
    }

    try {
        $transport = new EsmtpTransport($cfg['smtp_host'] ?? 'smtp.hostinger.com', (int) ($cfg['smtp_port'] ?? 465), true);
        $transport->setUsername($cfg['smtp_user']);
        $transport->setPassword($cfg['smtp_password']);
        (new Mailer($transport))->send($email);
        return true;
    } catch (TransportExceptionInterface $e) {
        error_log('Chromolog growth-api: email failed: ' . $e->getMessage());
        return false;
    }
}
