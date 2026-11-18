<?php

declare(strict_types=1);

require_once __DIR__ . '/mailer.php';

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
        send_lead_thank_you($fields);
        return;
    }

    $sets = implode(', ', array_map(fn ($c) => "{$c} = ?", array_keys($fields)));
    $pdo->prepare("UPDATE leads SET {$sets}, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?")
        ->execute([...array_values($fields), $sessionId]);
}

/**
 * Email the team about a new lead. Failures are logged and never block saving the lead.
 */
function notify_new_lead(array $lead): void
{
    $score = strtoupper($lead['score'] ?? 'new');
    $body = "New lead from the website\n\n";
    foreach ($lead as $k => $v) {
        $body .= str_pad($k, 18) . ": {$v}\n";
    }
    $body .= "\nOpen the control panel: https://chromologtechnologies.com/portal/leads\n";
    send_team_email("[{$score}] New website lead: " . ($lead['full_name'] ?? 'Unknown'), $body, $lead['email'] ?? null);
}

/**
 * Thank the visitor straight away, with the booking link, so nobody waits in silence.
 * Off unless config 'lead_thank_you' => ['enabled' => true]. Failures never block the lead.
 */
function send_lead_thank_you(array $lead): bool
{
    $cfg = (config()['lead_thank_you'] ?? []) + ['enabled' => false, 'booking_url' => '', 'whatsapp' => '+91 94002 30723'];
    $to = $lead['email'] ?? '';
    if (!$cfg['enabled'] || $to === '' || ($lead['source'] ?? '') === 'newsletter') {
        return false;
    }
    [$subject, $body] = lead_thank_you_text($lead, (string) $cfg['booking_url'], (string) $cfg['whatsapp']);
    return send_email($to, $subject, $body, config()['notify_email'] ?? null, null, 'Chromolog Technologies');
}

/** The thank-you wording, kept in one place so it is easy to review. @return array{0: string, 1: string} */
function lead_thank_you_text(array $lead, string $bookingUrl, string $whatsapp): array
{
    $first = trim(explode(' ', trim($lead['full_name'] ?? ''))[0] ?? '');
    $hello = $first !== '' && $first !== 'Newsletter' ? "Hi {$first}," : 'Hello,';
    $about = !empty($lead['service_interest']) ? " about {$lead['service_interest']}" : '';
    $lines = [
        $hello,
        '',
        "Thank you for contacting Chromolog Technologies. We have received your message{$about}, and one of our team will reply within one working day.",
    ];
    if ($bookingUrl !== '') {
        $lines[] = '';
        $lines[] = "If you would like to talk sooner, you can book a free 30-minute call at a time that suits you:";
        $lines[] = $bookingUrl;
    }
    if ($whatsapp !== '') {
        $lines[] = '';
        $lines[] = "You can also message us on WhatsApp at {$whatsapp}.";
    }
    array_push($lines, '', 'Regards,', 'Chromolog Technologies', 'https://chromologtechnologies.com', '',
        'You are receiving this one-time email because you filled in a form on our website.');
    return ['Thank you for contacting Chromolog Technologies', implode("\n", $lines)];
}
