<?php

declare(strict_types=1);

use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Insert or merge a lead for this chat session, and email the team on first capture.
 */
function save_lead(string $sessionId, array $fields): void
{
    $fields = array_map(fn ($v) => trim((string) $v), $fields);
    $fields = array_filter($fields, fn ($v) => $v !== '');

    $pdo = db();
    $existing = $pdo->prepare('SELECT id FROM leads WHERE session_id = ?');
    $existing->execute([$sessionId]);
    $isNew = $existing->fetchColumn() === false;

    if ($isNew) {
        $cols = array_keys($fields);
        $sql = sprintf(
            'INSERT INTO leads (session_id, %s) VALUES (?, %s)',
            implode(', ', $cols),
            implode(', ', array_fill(0, count($cols), '?')),
        );
        $pdo->prepare($sql)->execute([$sessionId, ...array_values($fields)]);
        notify_new_lead($fields);
        return;
    }

    $sets = implode(', ', array_map(fn ($c) => "{$c} = ?", array_keys($fields)));
    $pdo->prepare("UPDATE leads SET {$sets}, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?")
        ->execute([...array_values($fields), $sessionId]);
}

/**
 * Email the team about a new lead through Hostinger SMTP, authenticated as a real mailbox.
 * PHP mail() is not used: the domain's DMARC policy is p=reject, so unauthenticated mail
 * from the web server is silently rejected by Gmail and others.
 */
function notify_new_lead(array $lead): void
{
    $cfg = config();
    $to = $cfg['notify_email'] ?? '';
    if ($to === '' || empty($cfg['smtp_user']) || empty($cfg['smtp_password'])) {
        error_log('Chromolog growth-api: lead notification skipped, SMTP not configured');
        return;
    }

    $score = strtoupper($lead['score'] ?? 'new');
    $body = "New lead from the website\n\n";
    foreach ($lead as $k => $v) {
        $body .= str_pad($k, 18) . ": {$v}\n";
    }
    $body .= "\nOpen the control panel: https://chromologtechnologies.com/api/ai/admin.php\n";

    $email = (new Email())
        ->from(new Address($cfg['smtp_user'], 'Chromolog Growth OS'))
        ->to($to)
        ->subject("[{$score}] New website lead: " . ($lead['full_name'] ?? 'Unknown'))
        ->text($body);
    if (!empty($lead['email']) && filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) {
        $email->replyTo($lead['email']);
    }

    try {
        $transport = new EsmtpTransport($cfg['smtp_host'] ?? 'smtp.hostinger.com', (int) ($cfg['smtp_port'] ?? 465), true);
        $transport->setUsername($cfg['smtp_user']);
        $transport->setPassword($cfg['smtp_password']);
        (new Mailer($transport))->send($email);
    } catch (TransportExceptionInterface $e) {
        // Never lose the lead because email failed; it is already saved in the panel.
        error_log('Chromolog growth-api: lead notification failed: ' . $e->getMessage());
    }
}
