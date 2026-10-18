<?php

declare(strict_types=1);

/** Quotations, invoices and invoice payments. @var Router $router */

const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'invoiced'];
const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'cancelled'];
const PAYMENT_METHODS = ['bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'];

/**
 * Validate line items and compute totals. Discount is an amount; tax_rate a percentage
 * applied after discount (0 while the company is not tax-registered).
 * @return array{items: list<array>, subtotal: float, total: float, discount: float, tax_rate: float}
 */
function document_lines(array $b): array
{
    $items = [];
    foreach (array_values((array) ($b['items'] ?? [])) as $i => $row) {
        $desc = str_in((array) $row, 'description', 1000);
        if ($desc === null) {
            continue;
        }
        $qty = num_in((array) $row, 'quantity', 1, 0);
        $price = num_in((array) $row, 'unit_price', 0, 0);
        $items[] = ['description' => $desc, 'quantity' => $qty, 'unit_price' => $price, 'amount' => money($qty * $price), 'position' => $i];
    }
    if (!$items) {
        throw new ApiError('Add at least one line item.', 422);
    }
    $subtotal = money(array_sum(array_column($items, 'amount')));
    $discount = min(num_in($b, 'discount', 0, 0), $subtotal);
    $taxRate = setting('tax_enabled') === '1' ? num_in($b, 'tax_rate', 0, 0) : 0.0;
    $total = money(($subtotal - $discount) * (1 + $taxRate / 100));
    return ['items' => $items, 'subtotal' => $subtotal, 'total' => $total, 'discount' => $discount, 'tax_rate' => $taxRate];
}

function save_lines(string $table, string $fk, int $docId, array $items): void
{
    q("DELETE FROM {$table} WHERE {$fk} = ?", [$docId]);
    foreach ($items as $it) {
        insert($table, [$fk => $docId] + $it);
    }
}

function document_with_lines(string $table, string $itemsTable, string $fk, int $id, string $label): array
{
    $doc = q("SELECT d.*, c.name AS client_name, c.company AS client_company, c.email AS client_email,
            c.phone AS client_phone, c.address AS client_address, c.tax_id AS client_tax_id
        FROM {$table} d LEFT JOIN clients c ON c.id = d.client_id WHERE d.id = ?", [$id])->fetch();
    if (!$doc) {
        throw new ApiError("{$label} not found.", 404);
    }
    $doc['items'] = q("SELECT description, quantity, unit_price, amount FROM {$itemsTable} WHERE {$fk} = ? ORDER BY position", [$id])->fetchAll();
    return $doc;
}

// ── Quotations ──────────────────────────────────────────────────────────

$quoteRoles = [ROLE_MARKETING, ROLE_ACCOUNTS];

$router->add('GET', 'quotations', $quoteRoles, function () {
    $args = [];
    $where = '1=1';
    if ($s = query('status')) {
        $where = 'q.status = ?';
        $args[] = $s;
    }
    return ['items' => q("SELECT q.id, q.number, q.title, q.status, q.total, q.issue_date, q.valid_until, q.client_id, q.lead_id,
            COALESCE(c.company, c.name, l.company, l.full_name) AS party
        FROM quotations q LEFT JOIN clients c ON c.id = q.client_id LEFT JOIN leads l ON l.id = q.lead_id
        WHERE {$where} ORDER BY q.id DESC LIMIT 500", $args)->fetchAll()];
});

$router->add('GET', 'quotations/{id}', $quoteRoles, function ($p) {
    $doc = document_with_lines('quotations', 'quotation_items', 'quotation_id', id_param($p), 'Quotation');
    if (!$doc['client_id'] && $doc['lead_id']) {
        $lead = q('SELECT full_name, company, email, phone, location FROM leads WHERE id = ?', [$doc['lead_id']])->fetch();
        if ($lead) {
            $doc = array_merge($doc, ['client_name' => $lead['full_name'], 'client_company' => $lead['company'],
                'client_email' => $lead['email'], 'client_phone' => $lead['phone'], 'client_address' => $lead['location']]);
        }
    }
    return ['quotation' => $doc];
});

function quotation_save(array $b, ?int $id): int
{
    $lines = document_lines($b);
    $clientId = ($b['client_id'] ?? null) ? (int) $b['client_id'] : null;
    $leadId = ($b['lead_id'] ?? null) ? (int) $b['lead_id'] : null;
    if (!$clientId && !$leadId) {
        throw new ApiError('Choose a client or a lead.', 422);
    }
    $data = [
        'client_id' => $clientId,
        'lead_id' => $leadId,
        'title' => str_in($b, 'title', 200),
        'issue_date' => date_in($b, 'issue_date') ?? today(),
        'valid_until' => date_in($b, 'valid_until') ?? date('Y-m-d', strtotime('+30 days')),
        // "invoiced" is only set by converting to an invoice.
        'status' => enum_in($b, 'status', ['draft', 'sent', 'accepted', 'rejected'], 'draft'),
        'notes' => str_in($b, 'notes', 4000),
        'terms' => str_in($b, 'terms', 4000) ?? setting('quotation_terms'),
        'discount' => $lines['discount'], 'tax_rate' => $lines['tax_rate'],
        'subtotal' => $lines['subtotal'], 'total' => $lines['total'],
        'updated_at' => now_utc(),
    ];
    if ($id === null) {
        $data['number'] = next_number('quotations', setting('quotation_prefix'));
        $data['created_by'] = current_user()['id'];
        $id = insert('quotations', $data);
        audit('create', 'quotation', $id);
    } else {
        update('quotations', $id, $data);
        audit('update', 'quotation', $id);
    }
    save_lines('quotation_items', 'quotation_id', $id, $lines['items']);
    return $id;
}

$router->add('POST', 'quotations', $quoteRoles, function () {
    $id = transaction(fn () => quotation_save(body(), null));
    return ['quotation' => document_with_lines('quotations', 'quotation_items', 'quotation_id', $id, 'Quotation')];
});

$router->add('PUT', 'quotations/{id}', $quoteRoles, function ($p) {
    $id = id_param($p);
    $q = find_or_404('quotations', $id, 'Quotation');
    if ($q['status'] === 'invoiced') {
        throw new ApiError('This quotation has been invoiced and can no longer be edited.', 422);
    }
    transaction(fn () => quotation_save(body(), $id));
    return ['quotation' => document_with_lines('quotations', 'quotation_items', 'quotation_id', $id, 'Quotation')];
});

$router->add('DELETE', 'quotations/{id}', [ROLE_ADMIN, ROLE_ACCOUNTS], function ($p) {
    $q = find_or_404('quotations', id_param($p), 'Quotation');
    if ($q['status'] === 'invoiced') {
        throw new ApiError('Invoiced quotations cannot be deleted.', 422);
    }
    q('DELETE FROM quotations WHERE id = ?', [$q['id']]);
    audit('delete', 'quotation', (int) $q['id']);
});

// Accepted quotation → invoice (creates the client from the lead if needed).
$router->add('POST', 'quotations/{id}/convert', [ROLE_ACCOUNTS], function ($p) {
    $quote = document_with_lines('quotations', 'quotation_items', 'quotation_id', id_param($p), 'Quotation');
    if ($quote['status'] === 'invoiced') {
        throw new ApiError('This quotation is already invoiced.', 422);
    }
    $invoiceId = transaction(function () use ($quote) {
        $clientId = $quote['client_id'];
        if (!$clientId) {
            $lead = find_or_404('leads', (int) $quote['lead_id'], 'Lead');
            $clientId = $lead['client_id'] ?: insert('clients', [
                'name' => $lead['full_name'], 'company' => $lead['company'], 'email' => $lead['email'],
                'phone' => $lead['phone'], 'address' => $lead['location'], 'lead_id' => $lead['id'],
            ]);
            update('leads', (int) $lead['id'], ['client_id' => $clientId, 'status' => 'won', 'updated_at' => now_utc()]);
        }
        $invoiceId = insert('invoices', [
            'number' => next_number('invoices', setting('invoice_prefix')),
            'client_id' => $clientId,
            'quotation_id' => $quote['id'],
            'issue_date' => today(),
            'due_date' => date('Y-m-d', strtotime('+' . (int) setting('payment_terms_days') . ' days')),
            'status' => 'draft',
            'discount' => $quote['discount'], 'tax_rate' => $quote['tax_rate'],
            'subtotal' => $quote['subtotal'], 'total' => $quote['total'],
            'notes' => $quote['notes'], 'terms' => setting('invoice_terms'),
            'created_by' => current_user()['id'],
        ]);
        save_lines('invoice_items', 'invoice_id', $invoiceId, array_map(
            fn ($it, $i) => $it + ['position' => $i], $quote['items'], array_keys($quote['items'])
        ));
        update('quotations', (int) $quote['id'], ['status' => 'invoiced', 'client_id' => $clientId, 'updated_at' => now_utc()]);
        audit('convert', 'quotation', (int) $quote['id']);
        return $invoiceId;
    });
    return ['invoice' => document_with_lines('invoices', 'invoice_items', 'invoice_id', $invoiceId, 'Invoice')];
});

// ── Invoices ────────────────────────────────────────────────────────────

$invoiceRoles = [ROLE_ACCOUNTS];

function refresh_invoice_status(int $id): void
{
    $inv = find_or_404('invoices', $id, 'Invoice');
    $paid = money((float) q('SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id = ?', [$id])->fetchColumn());
    $status = $inv['status'];
    if ($status !== 'cancelled' && $status !== 'draft') {
        $status = $paid <= 0 ? 'sent' : ($paid + 0.005 >= (float) $inv['total'] ? 'paid' : 'partially_paid');
    } elseif ($status === 'draft' && $paid > 0) {
        $status = $paid + 0.005 >= (float) $inv['total'] ? 'paid' : 'partially_paid';
    }
    update('invoices', $id, ['amount_paid' => $paid, 'status' => $status, 'updated_at' => now_utc()]);
}

$router->add('GET', 'invoices', $invoiceRoles, function () {
    $where = ['1=1'];
    $args = [];
    if ($s = query('status')) {
        if ($s === 'overdue') {
            $where[] = "i.status IN ('sent','partially_paid') AND i.due_date < ?";
            $args[] = today();
        } else {
            $where[] = 'i.status = ?';
            $args[] = $s;
        }
    }
    if ($s = query('client_id')) {
        $where[] = 'i.client_id = ?';
        $args[] = (int) $s;
    }
    return ['items' => q('SELECT i.id, i.number, i.status, i.total, i.amount_paid, i.issue_date, i.due_date, i.client_id,
            COALESCE(c.company, c.name) AS client
        FROM invoices i JOIN clients c ON c.id = i.client_id WHERE ' . implode(' AND ', $where) . ' ORDER BY i.id DESC LIMIT 500', $args)->fetchAll()];
});

$router->add('GET', 'invoices/{id}', $invoiceRoles, function ($p) {
    $id = id_param($p);
    return [
        'invoice' => document_with_lines('invoices', 'invoice_items', 'invoice_id', $id, 'Invoice'),
        'payments' => q('SELECT * FROM payments WHERE invoice_id = ? ORDER BY date, id', [$id])->fetchAll(),
    ];
});

function invoice_save(array $b, ?int $id): int
{
    $lines = document_lines($b);
    $clientId = (int) ($b['client_id'] ?? 0);
    find_or_404('clients', $clientId, 'Client');
    $data = [
        'client_id' => $clientId,
        'project_id' => ($b['project_id'] ?? null) ? (int) $b['project_id'] : null,
        'issue_date' => date_in($b, 'issue_date') ?? today(),
        'due_date' => date_in($b, 'due_date') ?? date('Y-m-d', strtotime('+' . (int) setting('payment_terms_days') . ' days')),
        'notes' => str_in($b, 'notes', 4000),
        'terms' => str_in($b, 'terms', 4000) ?? setting('invoice_terms'),
        'discount' => $lines['discount'], 'tax_rate' => $lines['tax_rate'],
        'subtotal' => $lines['subtotal'], 'total' => $lines['total'],
        'updated_at' => now_utc(),
    ];
    if (array_key_exists('status', $b)) {
        $data['status'] = enum_in($b, 'status', ['draft', 'sent', 'cancelled'], 'draft');
    }
    if ($id === null) {
        $data['number'] = next_number('invoices', setting('invoice_prefix'));
        $data['created_by'] = current_user()['id'];
        $data['status'] ??= 'draft';
        $id = insert('invoices', $data);
        audit('create', 'invoice', $id);
    } else {
        update('invoices', $id, $data);
        audit('update', 'invoice', $id);
    }
    save_lines('invoice_items', 'invoice_id', $id, $lines['items']);
    refresh_invoice_status($id);
    return $id;
}

$router->add('POST', 'invoices', $invoiceRoles, function () {
    $id = transaction(fn () => invoice_save(body(), null));
    return ['invoice' => document_with_lines('invoices', 'invoice_items', 'invoice_id', $id, 'Invoice')];
});

$router->add('PUT', 'invoices/{id}', $invoiceRoles, function ($p) {
    $id = id_param($p);
    $inv = find_or_404('invoices', $id, 'Invoice');
    $b = body();
    // Paid/partly paid invoices: only status (e.g. cancel) and notes can change.
    if ((float) $inv['amount_paid'] > 0 && isset($b['items'])) {
        throw new ApiError('This invoice has payments recorded; its amounts can no longer be edited.', 422);
    }
    if (isset($b['items'])) {
        transaction(fn () => invoice_save($b, $id));
    } else {
        $data = ['updated_at' => now_utc()];
        if (array_key_exists('status', $b)) {
            $data['status'] = enum_in($b, 'status', ['draft', 'sent', 'cancelled']);
            if ($data['status'] === 'cancelled' && (float) $inv['amount_paid'] > 0) {
                throw new ApiError('This invoice has payments recorded. Remove the payments before cancelling it.', 422);
            }
        }
        if (array_key_exists('notes', $b)) {
            $data['notes'] = str_in($b, 'notes', 4000);
        }
        update('invoices', $id, $data);
        refresh_invoice_status($id);
        audit('update', 'invoice', $id);
    }
    return ['invoice' => document_with_lines('invoices', 'invoice_items', 'invoice_id', $id, 'Invoice')];
});

$router->add('DELETE', 'invoices/{id}', [ROLE_ADMIN], function ($p) {
    $inv = find_or_404('invoices', id_param($p), 'Invoice');
    if ((float) $inv['amount_paid'] > 0) {
        throw new ApiError('Invoices with payments cannot be deleted. Cancel it instead.', 422);
    }
    q('DELETE FROM invoices WHERE id = ?', [$inv['id']]);
    audit('delete', 'invoice', (int) $inv['id']);
});

$router->add('POST', 'invoices/{id}/payments', $invoiceRoles, function ($p) {
    $inv = find_or_404('invoices', id_param($p), 'Invoice');
    if ($inv['status'] === 'cancelled') {
        throw new ApiError('Cannot record a payment on a cancelled invoice.', 422);
    }
    $b = body();
    $amount = num_in($b, 'amount', null, 0.01);
    if ($amount === null) {
        throw new ApiError('Amount is required.', 422);
    }
    $balance = money((float) $inv['total'] - (float) $inv['amount_paid']);
    if ($amount > $balance + 0.005) {
        throw new ApiError("Amount is more than the balance due ({$balance}).", 422);
    }
    $id = transaction(function () use ($inv, $b, $amount) {
        if ($inv['status'] === 'draft') {
            update('invoices', (int) $inv['id'], ['status' => 'sent']);
        }
        $id = insert('payments', [
            'invoice_id' => $inv['id'], 'amount' => $amount, 'date' => date_in($b, 'date') ?? today(),
            'method' => enum_in($b, 'method', PAYMENT_METHODS, 'bank_transfer'),
            'reference' => str_in($b, 'reference', 120), 'notes' => str_in($b, 'notes', 1000),
            'created_by' => current_user()['id'],
        ]);
        refresh_invoice_status((int) $inv['id']);
        return $id;
    });
    audit('create', 'payment', $id);
    return ['payment' => find_or_404('payments', $id, 'Payment')];
});

$router->add('DELETE', 'payments/{id}', [ROLE_ACCOUNTS], function ($p) {
    $pay = find_or_404('payments', id_param($p), 'Payment');
    transaction(function () use ($pay) {
        q('DELETE FROM payments WHERE id = ?', [$pay['id']]);
        refresh_invoice_status((int) $pay['invoice_id']);
    });
    audit('delete', 'payment', (int) $pay['id']);
});

