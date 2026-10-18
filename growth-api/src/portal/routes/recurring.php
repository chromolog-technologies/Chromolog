<?php

declare(strict_types=1);

/** Recurring invoices (AMC, support, retainers). The daily job issues them. @var Router $router */

$recurringRoles = [ROLE_ACCOUNTS];

function recurring_with_items(int $id): array
{
    $r = q("SELECT r.*, COALESCE(c.company, c.name) AS client, k.title AS contract_title, i.number AS last_invoice_number
        FROM recurring_invoices r JOIN clients c ON c.id = r.client_id LEFT JOIN contracts k ON k.id = r.contract_id
        LEFT JOIN invoices i ON i.id = r.last_invoice_id WHERE r.id = ?", [$id])->fetch();
    if (!$r) {
        throw new ApiError('Recurring invoice not found.', 404);
    }
    $r['items'] = q('SELECT description, quantity, unit_price, amount FROM recurring_items WHERE recurring_id = ? ORDER BY position', [$id])->fetchAll();
    $r['invoices'] = q('SELECT id, number, status, total, issue_date FROM invoices WHERE recurring_id = ? ORDER BY id DESC LIMIT 24', [$id])->fetchAll();
    return $r;
}

function recurring_save(array $b, ?int $id): int
{
    $lines = document_lines($b);
    $clientId = (int) ($b['client_id'] ?? 0);
    find_or_404('clients', $clientId, 'Client');
    $nextDate = date_in($b, 'next_date', true);
    $endDate = date_in($b, 'end_date');
    if ($endDate && $endDate < $nextDate) {
        throw new ApiError('End date must be after the next invoice date.', 422);
    }
    $data = [
        'client_id' => $clientId,
        'contract_id' => ($b['contract_id'] ?? null) ? (int) $b['contract_id'] : null,
        'title' => str_in($b, 'title', 200, true),
        'frequency' => enum_in($b, 'frequency', array_keys(RECURRING_FREQUENCIES), 'monthly'),
        'next_date' => $nextDate,
        'anchor_day' => (int) substr($nextDate, 8, 2),
        'end_date' => $endDate,
        'auto_send' => !empty($b['auto_send']) ? 1 : 0,
        'active' => array_key_exists('active', $b) ? (!empty($b['active']) ? 1 : 0) : 1,
        'discount' => $lines['discount'],
        'tax_rate' => $lines['tax_rate'],
        'notes' => str_in($b, 'notes', 4000),
    ];
    if ($id === null) {
        $id = insert('recurring_invoices', $data + ['created_by' => current_user()['id']]);
        audit('create', 'recurring_invoice', $id);
    } else {
        update('recurring_invoices', $id, $data);
        audit('update', 'recurring_invoice', $id);
    }
    save_lines('recurring_items', 'recurring_id', $id, $lines['items']);
    return $id;
}

$router->add('GET', 'recurring', $recurringRoles, fn () => ['items' => q("SELECT r.id, r.title, r.frequency, r.next_date, r.end_date, r.active, r.auto_send,
        COALESCE(c.company, c.name) AS client,
        (SELECT ROUND(SUM(amount),2) FROM recurring_items ri WHERE ri.recurring_id = r.id) - r.discount AS amount,
        (SELECT COUNT(*) FROM invoices i WHERE i.recurring_id = r.id) AS issued
    FROM recurring_invoices r JOIN clients c ON c.id = r.client_id ORDER BY r.active DESC, r.next_date")->fetchAll()]);

$router->add('GET', 'recurring/{id}', $recurringRoles, fn ($p) => ['recurring' => recurring_with_items(id_param($p))]);

$router->add('POST', 'recurring', $recurringRoles, function () {
    $id = transaction(fn () => recurring_save(body(), null));
    return ['recurring' => recurring_with_items($id)];
});

$router->add('PUT', 'recurring/{id}', $recurringRoles, function ($p) {
    $id = id_param($p);
    find_or_404('recurring_invoices', $id, 'Recurring invoice');
    transaction(fn () => recurring_save(body(), $id));
    return ['recurring' => recurring_with_items($id)];
});

$router->add('DELETE', 'recurring/{id}', [ROLE_ADMIN, ROLE_ACCOUNTS], function ($p) {
    $id = id_param($p);
    q('UPDATE invoices SET recurring_id = NULL WHERE recurring_id = ?', [$id]);
    q('DELETE FROM recurring_invoices WHERE id = ?', [$id]);
    audit('delete', 'recurring_invoice', $id);
});

// Issue the next invoice now (e.g. a client asks early) and move the schedule on.
$router->add('POST', 'recurring/{id}/issue', $recurringRoles, function ($p) {
    $r = find_or_404('recurring_invoices', id_param($p), 'Recurring invoice');
    if (!$r['active']) {
        throw new ApiError('This schedule is paused or finished.', 422);
    }
    $invoiceId = transaction(fn () => issue_recurring_invoice($r));
    audit('issue', 'recurring_invoice', (int) $r['id']);
    return ['invoice_id' => $invoiceId, 'recurring' => recurring_with_items((int) $r['id'])];
});
