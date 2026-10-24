<?php

declare(strict_types=1);

/** Quotations (estimates). Invoices, notes and payments live in invoices.php. @var Router $router */

const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'invoiced'];

function quotation_full(int $id): array
{
    $doc = q('SELECT * FROM quotations WHERE id = ?', [$id])->fetch();
    if (!$doc) {
        throw new ApiError('Quotation not found.', 404);
    }
    $doc['items'] = document_items('quotation_items', 'quotation_id', $id);
    if ($doc['client_id']) {
        $doc['client'] = client_snapshot((int) $doc['client_id']);
    } else {
        $lead = q('SELECT full_name, company, email, phone, location FROM leads WHERE id = ?', [$doc['lead_id']])->fetch() ?: [];
        $doc['client'] = ['name' => $lead['full_name'] ?? '', 'company' => $lead['company'] ?? null, 'email' => $lead['email'] ?? null,
            'phone' => $lead['phone'] ?? null, 'address' => $lead['location'] ?? null, 'tax_id' => null, 'state_code' => null];
    }
    $doc['company'] = company_snapshot();
    $doc['amount_in_words'] = amount_in_words((float) $doc['total'], $doc['company']['currency']);
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

$router->add('GET', 'quotations/{id}', $quoteRoles, fn ($p) => ['quotation' => quotation_full(id_param($p))]);

$router->add('GET', 'quotations/{id}/pdf', $quoteRoles, function ($p) {
    $doc = quotation_full(id_param($p));
    send_pdf(render_pdf(document_html($doc, 'quotation')), "{$doc['number']}.pdf", query('download') === '1');
});

function quotation_save(array $b, ?int $id): int
{
    $clientId = ($b['client_id'] ?? null) ? (int) $b['client_id'] : null;
    $leadId = ($b['lead_id'] ?? null) ? (int) $b['lead_id'] : null;
    if (!$clientId && !$leadId) {
        throw new ApiError('Choose a client or a lead.', 422);
    }
    $state = $clientId ? (find_or_404('clients', $clientId, 'Client')['state_code'] ?: null) : null;
    $supply = supply_in($b, $state);
    $lines = gst_lines($b, $supply);
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
        'updated_at' => now_utc(),
    ] + $supply + $lines['totals'];
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
    return ['quotation' => quotation_full($id)];
});

$router->add('PUT', 'quotations/{id}', $quoteRoles, function ($p) {
    $id = id_param($p);
    $q = find_or_404('quotations', $id, 'Quotation');
    if ($q['status'] === 'invoiced') {
        throw new ApiError('This quotation has been invoiced and can no longer be edited.', 422);
    }
    transaction(fn () => quotation_save(body(), $id));
    return ['quotation' => quotation_full($id)];
});

$router->add('DELETE', 'quotations/{id}', [ROLE_ADMIN, ROLE_ACCOUNTS], function ($p) {
    $q = find_or_404('quotations', id_param($p), 'Quotation');
    if ($q['status'] === 'invoiced') {
        throw new ApiError('Invoiced quotations cannot be deleted.', 422);
    }
    q('DELETE FROM quotations WHERE id = ?', [$q['id']]);
    audit('delete', 'quotation', (int) $q['id']);
});

// Accepted quotation → draft invoice (creates the client from the lead if needed).
$router->add('POST', 'quotations/{id}/convert', [ROLE_ACCOUNTS], function ($p) {
    $quote = quotation_full(id_param($p));
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
        // Tax is worked out again for the customer's state (a lead had none).
        [$data, $items] = invoice_input([
            'client_id' => $clientId, 'items' => $quote['items'], 'notes' => $quote['notes'],
            'place_of_supply' => $quote['client_id'] ? $quote['place_of_supply'] : null,
            'supply_type' => $quote['client_id'] ? $quote['supply_type'] : null, 'reverse_charge' => $quote['reverse_charge'],
            'terms' => setting('invoice_terms'),
        ], 'invoice');
        $invoiceId = invoice_insert($data + [
            'doc_type' => 'invoice', 'status' => 'draft', 'quotation_id' => $quote['id'], 'created_by' => current_user()['id'],
        ], $items);
        invoice_log($invoiceId, 'created', "Converted from quotation {$quote['number']}");
        update('quotations', (int) $quote['id'], ['status' => 'invoiced', 'client_id' => $clientId, 'updated_at' => now_utc()]);
        audit('convert', 'quotation', (int) $quote['id']);
        return $invoiceId;
    });
    return ['invoice' => invoice_full($invoiceId)];
});
