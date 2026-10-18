<?php

declare(strict_types=1);

/**
 * Support tickets for AMC / support clients, with response and resolution targets per priority
 * (settings sla_<priority> = "response_hours,resolve_hours", calendar hours). @var Router $router
 */

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_client', 'resolved', 'closed'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_CHANNELS = ['phone', 'whatsapp', 'email', 'portal', 'in_person', 'other'];

/** @return array{0: int, 1: int} response hours, resolution hours */
function ticket_sla(string $priority): array
{
    $parts = array_map('intval', explode(',', setting("sla_{$priority}")));
    return [max(1, $parts[0] ?? 8), max(1, $parts[1] ?? 72)];
}

function ticket_due_times(string $createdUtc, string $priority): array
{
    [$respond, $resolve] = ticket_sla($priority);
    $base = strtotime($createdUtc . ' UTC');
    return [
        'response_due_at' => gmdate('Y-m-d H:i:s', $base + $respond * 3600),
        'resolve_due_at' => gmdate('Y-m-d H:i:s', $base + $resolve * 3600),
    ];
}

function ticket_access(array $t): string
{
    $uid = (int) current_user()['id'];
    if (has_role(ROLE_PROJECT)) {
        return 'manage';
    }
    if ((int) $t['assignee_id'] === $uid) {
        return 'assignee';
    }
    if ((int) $t['created_by'] === $uid) {
        return 'creator';
    }
    throw new ApiError('You do not have access to this ticket.', 403);
}

function notify_ticket_assignee(int $ticketId): void
{
    $t = q('SELECT t.*, u.email, u.name AS assignee, COALESCE(c.company, c.name) AS client FROM tickets t
        JOIN users u ON u.id = t.assignee_id LEFT JOIN clients c ON c.id = t.client_id WHERE t.id = ?', [$ticketId])->fetch();
    if (!$t || (int) $t['assignee_id'] === (int) current_user()['id']) {
        return;
    }
    $portal = rtrim(setting('company_website'), '/') . '/portal';
    send_email($t['email'], "[{$t['priority']}] Ticket {$t['number']} assigned to you: {$t['subject']}",
        "Hi {$t['assignee']},\n\nA support ticket has been assigned to you.\n\n"
        . "Ticket   : {$t['number']}\nClient   : " . ($t['client'] ?: '—') . "\nPriority : {$t['priority']}\n"
        . "Respond by: {$t['response_due_at']} UTC\nResolve by: {$t['resolve_due_at']} UTC\n\n{$t['subject']}\n\n" . ($t['description'] ?? '')
        . "\n\nOpen it: {$portal}/tickets/{$t['id']}\n");
}

$ticketSelect = "SELECT t.*, COALESCE(c.company, c.name) AS client, u.name AS assignee_name, cb.name AS created_by_name,
        CASE WHEN t.status IN ('resolved','closed') THEN 0
             WHEN (t.first_response_at IS NULL AND t.response_due_at < :now) OR t.resolve_due_at < :now THEN 1 ELSE 0 END AS breached
    FROM tickets t LEFT JOIN clients c ON c.id = t.client_id LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN users cb ON cb.id = t.created_by";

$router->add('GET', 'tickets', [], function () use ($ticketSelect) {
    $where = ['1=1'];
    $args = ['now' => now_utc()];
    if (!has_role(ROLE_PROJECT) || query('mine')) {
        $where[] = '(t.assignee_id = :me OR t.created_by = :me)';
        $args['me'] = current_user()['id'];
    }
    $status = query('status', 'active');
    if ($status === 'active') {
        $where[] = "t.status NOT IN ('resolved','closed')";
    } elseif ($status !== 'all') {
        $where[] = 't.status = :status';
        $args['status'] = $status;
    }
    foreach (['priority' => 't.priority', 'assignee_id' => 't.assignee_id', 'client_id' => 't.client_id'] as $k => $col) {
        if ($s = query($k)) {
            $where[] = "{$col} = :{$k}";
            $args[$k] = $s;
        }
    }
    $sql = "SELECT * FROM ({$ticketSelect} WHERE " . implode(' AND ', $where) . ') x' . (query('breached') ? ' WHERE breached = 1' : '')
        . " ORDER BY breached DESC, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, id DESC LIMIT 500";
    return ['items' => q($sql, $args)->fetchAll()];
});

$router->add('GET', 'tickets/stats', [ROLE_PROJECT], function () {
    $now = now_utc();
    $since = gmdate('Y-m-d H:i:s', strtotime('-30 days'));
    $one = fn (string $sql, array $a = []) => q($sql, $a)->fetchColumn();
    $responded = q('SELECT first_response_at, response_due_at, created_at FROM tickets WHERE first_response_at IS NOT NULL AND created_at >= ?', [$since])->fetchAll();
    $resolved = q('SELECT resolved_at, resolve_due_at FROM tickets WHERE resolved_at IS NOT NULL AND created_at >= ?', [$since])->fetchAll();
    $avgResponse = $responded ? array_sum(array_map(fn ($t) => (strtotime($t['first_response_at']) - strtotime($t['created_at'])) / 3600, $responded)) / count($responded) : null;
    return [
        'open' => (int) $one("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed')"),
        'breached' => (int) $one("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed') AND ((first_response_at IS NULL AND response_due_at < ?) OR resolve_due_at < ?)", [$now, $now]),
        'unassigned' => (int) $one("SELECT COUNT(*) FROM tickets WHERE status NOT IN ('resolved','closed') AND assignee_id IS NULL"),
        'last_30_days' => [
            'created' => (int) $one('SELECT COUNT(*) FROM tickets WHERE created_at >= ?', [$since]),
            'avg_first_response_hours' => $avgResponse === null ? null : round($avgResponse, 1),
            'responded_on_time_pct' => $responded ? (int) round(100 * count(array_filter($responded, fn ($t) => $t['first_response_at'] <= $t['response_due_at'])) / count($responded)) : null,
            'resolved_on_time_pct' => $resolved ? (int) round(100 * count(array_filter($resolved, fn ($t) => $t['resolved_at'] <= $t['resolve_due_at'])) / count($resolved)) : null,
        ],
    ];
});

$router->add('GET', 'tickets/{id}', [], function ($p) use ($ticketSelect) {
    $t = q("{$ticketSelect} WHERE t.id = :id", ['now' => now_utc(), 'id' => id_param($p)])->fetch();
    if (!$t) {
        throw new ApiError('Ticket not found.', 404);
    }
    $access = ticket_access($t);
    $comments = q('SELECT tc.*, u.name AS user_name FROM ticket_comments tc LEFT JOIN users u ON u.id = tc.user_id WHERE tc.ticket_id = ? ORDER BY tc.id', [$t['id']])->fetchAll();
    return ['ticket' => $t, 'comments' => $comments, 'access' => $access];
});

$router->add('POST', 'tickets', [], function () {
    $b = body();
    $priority = enum_in($b, 'priority', TICKET_PRIORITIES, 'medium');
    $created = now_utc();
    $assignee = ($b['assignee_id'] ?? null) && has_role(ROLE_PROJECT) ? (int) $b['assignee_id'] : null;
    $id = insert('tickets', [
        'number' => next_number('tickets', setting('ticket_prefix')),
        'client_id' => ($b['client_id'] ?? null) ? (int) $b['client_id'] : null,
        'contract_id' => ($b['contract_id'] ?? null) ? (int) $b['contract_id'] : null,
        'project_id' => ($b['project_id'] ?? null) ? (int) $b['project_id'] : null,
        'subject' => str_in($b, 'subject', 200, true),
        'description' => str_in($b, 'description', 8000),
        'channel' => enum_in($b, 'channel', TICKET_CHANNELS, 'phone'),
        'priority' => $priority,
        'assignee_id' => $assignee,
        'created_by' => current_user()['id'],
        'created_at' => $created,
        'updated_at' => $created,
    ] + ticket_due_times($created, $priority));
    audit('create', 'ticket', $id);
    if ($assignee) {
        notify_ticket_assignee($id);
    }
    return ['ticket' => find_or_404('tickets', $id, 'Ticket')];
});

$router->add('PUT', 'tickets/{id}', [], function ($p) {
    $id = id_param($p);
    $t = find_or_404('tickets', $id, 'Ticket');
    $access = ticket_access($t);
    $b = body();
    $d = [];
    if ($access === 'manage') {
        foreach (['subject' => 200, 'description' => 8000] as $f => $max) {
            if (array_key_exists($f, $b)) {
                $d[$f] = str_in($b, $f, $max, $f === 'subject');
            }
        }
        foreach (['client_id', 'contract_id', 'project_id', 'assignee_id'] as $f) {
            if (array_key_exists($f, $b)) {
                $d[$f] = ($b[$f] ?? null) ? (int) $b[$f] : null;
            }
        }
        if (array_key_exists('channel', $b)) {
            $d['channel'] = enum_in($b, 'channel', TICKET_CHANNELS, 'phone');
        }
        if (array_key_exists('priority', $b)) {
            $d['priority'] = enum_in($b, 'priority', TICKET_PRIORITIES, 'medium');
            if ($d['priority'] !== $t['priority']) {
                $d += ticket_due_times($t['created_at'], $d['priority']);
            }
        }
    }
    if (array_key_exists('status', $b)) {
        if ($access === 'creator') {
            throw new ApiError('Only the assignee or the project team can change the status.', 403);
        }
        $d['status'] = enum_in($b, 'status', TICKET_STATUSES);
        if ($d['status'] !== 'open' && !$t['first_response_at']) {
            $d['first_response_at'] = now_utc();
        }
        if (in_array($d['status'], ['resolved', 'closed'], true)) {
            $d['resolved_at'] = $t['resolved_at'] ?: now_utc();
        } else {
            $d['resolved_at'] = null;
        }
    }
    if (!$d) {
        throw new ApiError('Nothing to update.', 422);
    }
    $d['updated_at'] = now_utc();
    update('tickets', $id, $d);
    if (isset($d['status']) && $d['status'] !== $t['status']) {
        insert('ticket_comments', ['ticket_id' => $id, 'user_id' => current_user()['id'], 'internal' => 1,
            'body' => "Status changed from {$t['status']} to {$d['status']}"]);
    }
    audit('update', 'ticket', $id);
    if (!empty($d['assignee_id']) && (int) $d['assignee_id'] !== (int) $t['assignee_id']) {
        notify_ticket_assignee($id);
    }
    return ['ticket' => find_or_404('tickets', $id, 'Ticket')];
});

$router->add('POST', 'tickets/{id}/comments', [], function ($p) {
    $t = find_or_404('tickets', id_param($p), 'Ticket');
    ticket_access($t);
    $b = body();
    $internal = !empty($b['internal']) ? 1 : 0;
    $id = insert('ticket_comments', [
        'ticket_id' => $t['id'], 'user_id' => current_user()['id'],
        'body' => str_in($b, 'body', 8000, true), 'internal' => $internal,
    ]);
    $d = ['updated_at' => now_utc()];
    // A reply to the client (not an internal note) counts as the first response.
    if (!$internal && !$t['first_response_at']) {
        $d['first_response_at'] = now_utc();
    }
    update('tickets', (int) $t['id'], $d);
    return ['comment' => find_or_404('ticket_comments', $id, 'Comment')];
});

$router->add('DELETE', 'tickets/{id}', [ROLE_ADMIN], function ($p) {
    q('DELETE FROM tickets WHERE id = ?', [id_param($p)]);
    audit('delete', 'ticket', id_param($p));
});
