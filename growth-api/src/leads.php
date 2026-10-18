<?php

declare(strict_types=1);

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

function notify_new_lead(array $lead): void
{
    $to = config()['notify_email'] ?? '';
    if ($to === '') {
        return;
    }
    $score = strtoupper($lead['score'] ?? 'new');
    $body = "New lead from the website\n\n";
    foreach ($lead as $k => $v) {
        $body .= str_pad($k, 18) . ": {$v}\n";
    }
    $body .= "\nOpen the control panel: https://chromologtechnologies.com/api/ai/admin.php\n";
    @mail($to, "[{$score}] New website lead: " . ($lead['full_name'] ?? 'Unknown'), $body,
        'From: Chromolog AI <no-reply@chromologtechnologies.com>');
}
