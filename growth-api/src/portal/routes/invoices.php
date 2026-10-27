<?php

declare(strict_types=1);

/**
 * Invoices, credit/debit notes, payments, the service list, invoice reports and invoice settings.
 *
 * Drafts can be edited or deleted freely. Issuing assigns the number and freezes the company and
 * customer details. After that an invoice is never deleted: changes need a reason (and an admin),
 * cancelling needs a reason, and every event is kept in the locked history with a PDF copy of
 * each issued version. @var Router $router
 */

const PAYMENT_METHODS = ['bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'];
const PAYMENT_LABELS = ['bank_transfer' => 'Bank transfer', 'upi' => 'UPI', 'cash' => 'Cash', 'cheque' => 'Cheque', 'card' => 'Card', 'other' => 'Other'];

$invoiceRoles = [ROLE_ACCOUNTS];

/** Validate an invoice or note form. @return array{array, array} [columns, items] */
function invoice_input(array $b, string $docType): array
{
    $client = find_or_404('clients', (int) ($b['client_id'] ?? 0), 'Customer');
    $supply = supply_in($b, $client['state_code'] ?: null);
    $lines = gst_lines($b, $supply);
    $issue = date_in($b, 'issue_date') ?? today();
    $due = null;
    if ($docType === 'invoice') {
        $due = date_in($b, 'due_date') ?? date('Y-m-d', strtotime("{$issue} +" . (int) setting('payment_terms_days') . ' days'));
        if ($due < $issue) {
            throw new ApiError('The due date cannot be before the invoice date.', 422);
        }
    }
    $data = [
        'client_id' => (int) $client['id'],
        'project_id' => ($b['project_id'] ?? null) ? (int) $b['project_id'] : null,
        'issue_date' => $issue,
        'due_date' => $due,
        'po_number' => str_in($b, 'po_number', 60),
        'notes' => str_in($b, 'notes', 4000),
        'terms' => str_in($b, 'terms', 4000),
        'updated_at' => now_utc(),
    ] + $supply + $lines['totals'];
    if ($docType !== 'invoice') {
        $data['note_reason'] = str_in($b, 'note_reason', 1000);
        if ($data['note_reason'] === null) {
            throw new ApiError('Enter the reason for this ' . strtolower(DOC_TITLES[$docType]) . '.', 422);
        }
    }
    return [$data, $lines['items']];
}

/** Create a draft (placeholder number until it is issued). */
function invoice_insert(array $data, array $items): int
{
    $data['number'] = 'DRAFT-' . bin2hex(random_bytes(6));
    $id = insert('invoices', $data);
    update('invoices', $id, ['number' => "DRAFT-{$id}"]);
    save_lines('invoice_items', 'invoice_id', $id, $items);
    return $id;
}

/** The invoice a credit/debit note is raised against: must be an issued, not cancelled, invoice. */
function note_original(int $originalId): array
{
    $o = find_or_404('invoices', $originalId, 'Original invoice');
    if ($o['doc_type'] !== 'invoice' || in_array($o['status'], ['draft', 'cancelled'], true)) {
        throw new ApiError('Credit and debit notes can only be raised against an issued invoice.', 422);
    }
    return $o;
}

/** A credit note can't take an invoice below zero (after earlier notes). */
function check_note_limit(array $original, string $docType, float $total, ?int $noteId): void
{
    if ($docType !== 'credit_note') {
        return;
    }
    $other = (float) q("SELECT COALESCE(SUM(CASE doc_type WHEN 'debit_note' THEN total ELSE -total END),0) FROM invoices
        WHERE original_invoice_id = ? AND status = 'issued' AND id != ?", [$original['id'], $noteId ?? 0])->fetchColumn();
    $max = money((float) $original['total'] + $other);
    if ($total > $max + 0.005) {
        throw new ApiError('A credit note cannot be more than ' . format_money($max, company_snapshot()) . ', the invoice value after earlier notes.', 422);
    }
}

function issue_invoice(int $id): void
{
    $inv = find_or_404('invoices', $id, 'Invoice');
    if ($inv['status'] !== 'draft') {
        throw new ApiError('This has already been issued.', 422);
    }
    if ($inv['original_invoice_id']) {
        check_note_limit(note_original((int) $inv['original_invoice_id']), $inv['doc_type'], (float) $inv['total'], $id);
    }
    $number = str_starts_with($inv['number'], 'DRAFT-') ? allocate_doc_number($inv['doc_type'], $inv['issue_date']) : $inv['number'];
    update('invoices', $id, [
        'number' => $number, 'status' => 'issued', 'issued_at' => now_utc(), 'issued_by' => current_user()['id'] ?? null,
        'company_snapshot' => json_encode(company_snapshot(), JSON_UNESCAPED_UNICODE),
        'client_snapshot' => json_encode(client_snapshot((int) $inv['client_id']), JSON_UNESCAPED_UNICODE),
        'updated_at' => now_utc(),
    ]);
    refresh_invoice_status($id);
    if ($inv['original_invoice_id']) {
        refresh_note_adjustments((int) $inv['original_invoice_id']);
    }
    invoice_log($id, 'issued', null, [['field' => 'Number', 'old' => '', 'new' => $number]], true);
}

/** WHERE clause for the invoice list, its export and reports. @return array{string, array} */
function invoice_filters(): array
{
    $w = ['1=1'];
    $a = [];
    $type = query('doc_type', 'invoice');
    if ($type !== 'all') {
        if (!in_array($type, DOC_TYPES, true)) {
            throw new ApiError('Invalid document type.', 422);
        }
        $w[] = 'i.doc_type = ?';
        $a[] = $type;
    }
    if ($s = query('status')) {
        if ($s === 'unpaid') {
            $w[] = "i.status IN ('issued','partially_paid','overdue')";
        } else {
            $w[] = 'i.status = ?';
            $a[] = $s;
        }
    }
    foreach (['client_id' => 'i.client_id = ?', 'date' => 'i.issue_date = ?', 'from' => 'i.issue_date >= ?', 'to' => 'i.issue_date <= ?'] as $key => $sql) {
        if (($s = query($key)) !== null) {
            $w[] = $sql;
            $a[] = $key === 'client_id' ? (int) $s : $s;
        }
    }
    if ($s = query('q')) {
        $like = '%' . $s . '%';
        $cond = '(i.number LIKE ? OR c.name LIKE ? OR c.company LIKE ? OR i.po_number LIKE ?';
        array_push($a, $like, $like, $like, $like);
        $num = str_replace([',', '₹', ' '], '', $s);
        if (is_numeric($num)) {
            $cond .= ' OR ABS(i.total - ?) < 0.01';
            $a[] = (float) $num;
        }
        $w[] = $cond . ')';
    }
    return [implode(' AND ', $w), $a];
}

const CUSTOMER_SQL = "COALESCE(NULLIF(JSON_VALUE(i.client_snapshot, '$.company'), ''), JSON_VALUE(i.client_snapshot, '$.name'), NULLIF(c.company, ''), c.name)";
const CUSTOMER_GSTIN_SQL = "COALESCE(JSON_VALUE(i.client_snapshot, '$.tax_id'), c.tax_id)";

function invoice_rows(): array
{
    sync_overdue();
    [$where, $args] = invoice_filters();
    $order = query('sort') === 'oldest' ? 'i.issue_date ASC, i.id ASC' : 'i.issue_date DESC, i.id DESC';
    return q('SELECT i.id, i.number, i.doc_type, i.status, i.issue_date, i.due_date, i.po_number, i.place_of_supply, i.supply_type,
            i.taxable_value, i.cgst, i.sgst, i.igst, i.tax_total, i.total, i.amount_paid, i.adjustment, i.client_id,
            CASE WHEN i.doc_type = \'invoice\' AND i.status NOT IN (\'draft\',\'cancelled\') THEN ROUND(i.total + i.adjustment - i.amount_paid, 2) ELSE 0 END AS balance,
            ' . CUSTOMER_SQL . ' AS client, ' . CUSTOMER_GSTIN_SQL . ' AS client_gstin, o.number AS original_number
        FROM invoices i JOIN clients c ON c.id = i.client_id LEFT JOIN invoices o ON o.id = i.original_invoice_id
        WHERE ' . $where . " ORDER BY {$order} LIMIT 2000", $args)->fetchAll();
}

// ── List, export, numbering preview (before invoices/{id}) ──────────────

$router->add('GET', 'invoices', $invoiceRoles, function () {
    $items = invoice_rows();
    $live = array_filter($items, fn ($r) => !in_array($r['status'], ['draft', 'cancelled'], true));
    return ['items' => $items, 'summary' => [
        'count' => count($live),
        'total' => money(array_sum(array_column($live, 'total'))),
        'received' => money(array_sum(array_column($live, 'amount_paid'))),
        'outstanding' => money(array_sum(array_column($live, 'balance'))),
    ]];
});

$router->add('GET', 'invoices/export', $invoiceRoles, function () {
    $rows = array_map(fn ($r) => [
        $r['number'], DOC_TITLES[$r['doc_type']], $r['issue_date'], $r['due_date'], $r['client'], $r['client_gstin'],
        GST_STATES[$r['place_of_supply']] ?? '', SUPPLY_LABELS[$r['supply_type']] ?? '', ucwords(str_replace('_', ' ', $r['status'])),
        $r['po_number'], (float) $r['taxable_value'], (float) $r['cgst'], (float) $r['sgst'], (float) $r['igst'],
        (float) $r['total'], (float) $r['amount_paid'], (float) $r['balance'], $r['original_number'],
    ], invoice_rows());
    export_rows('invoices_' . today(), ['Number', 'Type', 'Date', 'Due date', 'Customer', 'Customer GSTIN', 'Place of supply', 'Tax type',
        'Status', 'PO / WO no.', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total', 'Received', 'Balance', 'Against invoice'], $rows, query('format', 'csv'));
});

$router->add('GET', 'invoices/next-number', $invoiceRoles, fn () => ['numbers' => [
    'invoice' => peek_doc_number('invoice', query('date') ?? today()),
    'credit_note' => peek_doc_number('credit_note', query('date') ?? today()),
    'debit_note' => peek_doc_number('debit_note', query('date') ?? today()),
]]);

// ── Single invoice ──────────────────────────────────────────────────────

$router->add('GET', 'invoices/{id}', $invoiceRoles, function ($p) {
    sync_overdue();
    $id = id_param($p);
    return [
        'invoice' => invoice_full($id),
        'payments' => q('SELECT p.*, u.name AS created_by_name FROM payments p LEFT JOIN users u ON u.id = p.created_by WHERE p.invoice_id = ? ORDER BY p.date, p.id', [$id])->fetchAll(),
        'notes' => q('SELECT id, number, doc_type, status, issue_date, total FROM invoices WHERE original_invoice_id = ? ORDER BY id', [$id])->fetchAll(),
        'history_count' => (int) q('SELECT COUNT(*) FROM invoice_history WHERE invoice_id = ?', [$id])->fetchColumn(),
    ];
});

$router->add('POST', 'invoices', $invoiceRoles, function () {
    $b = body();
    $docType = enum_in($b, 'doc_type', DOC_TYPES, 'invoice');
    $id = transaction(function () use ($b, $docType) {
        $original = null;
        if ($docType !== 'invoice') {
            $original = note_original((int) ($b['original_invoice_id'] ?? 0));
            $b['client_id'] = $original['client_id'];
        }
        [$data, $items] = invoice_input($b, $docType);
        if ($docType === 'invoice') {
            $data['terms'] ??= setting('invoice_terms');
        }
        if ($original) {
            check_note_limit($original, $docType, $data['total'], null);
            $data['original_invoice_id'] = $original['id'];
        }
        $id = invoice_insert($data + ['doc_type' => $docType, 'status' => 'draft', 'created_by' => current_user()['id']], $items);
        invoice_log($id, 'created', $original ? "Raised against invoice {$original['number']}" : null);
        if (!empty($b['issue'])) {
            issue_invoice($id);
        }
        return $id;
    });
    audit('create', 'invoice', $id);
    return ['invoice' => invoice_full($id)];
});

$router->add('PUT', 'invoices/{id}', $invoiceRoles, function ($p) {
    $id = id_param($p);
    $b = body();
    transaction(function () use ($id, $b) {
        $inv = find_or_404('invoices', $id, 'Invoice');
        if ($inv['status'] === 'cancelled') {
            throw new ApiError('Cancelled invoices cannot be changed.', 422);
        }
        $issued = $inv['status'] !== 'draft';
        $reason = str_in($b, 'reason', 1000);
        if ($issued) {
            if (current_user()['role'] !== ROLE_ADMIN) {
                throw new ApiError('Only an admin can change an issued invoice. Raise a credit or debit note instead, or ask an admin.', 403);
            }
            if ($reason === null) {
                throw new ApiError('Enter the reason for changing this invoice.', 422);
            }
        }
        if ($inv['doc_type'] !== 'invoice') {
            $b['client_id'] = $inv['client_id'];
        }
        $before = invoice_full($id);
        [$data, $items] = invoice_input($b, $inv['doc_type']);
        if ($inv['doc_type'] === 'invoice') {
            $data['terms'] ??= setting('invoice_terms');
            if ($data['total'] + (float) $inv['adjustment'] < (float) $inv['amount_paid'] - 0.005) {
                throw new ApiError('The new total is less than the payments already received.', 422);
            }
        }
        if ($inv['original_invoice_id']) {
            check_note_limit(find_or_404('invoices', (int) $inv['original_invoice_id'], 'Invoice'), $inv['doc_type'], $data['total'], $id);
        }
        if ($issued) {
            // Freeze details on older invoices issued before snapshots existed; refresh the customer only if it changed.
            if (!$inv['company_snapshot']) {
                $data['company_snapshot'] = json_encode(company_snapshot(), JSON_UNESCAPED_UNICODE);
            }
            if (!$inv['client_snapshot'] || (int) $data['client_id'] !== (int) $inv['client_id']) {
                $data['client_snapshot'] = json_encode(client_snapshot($data['client_id']), JSON_UNESCAPED_UNICODE);
            }
        }
        update('invoices', $id, $data);
        save_lines('invoice_items', 'invoice_id', $id, $items);
        refresh_invoice_status($id);
        if ($issued && $inv['original_invoice_id']) {
            refresh_note_adjustments((int) $inv['original_invoice_id']);
        }
        $changes = invoice_diff($before, invoice_full($id));
        if ($changes) {
            invoice_log($id, 'edited', $reason, $changes, $issued);
        }
    });
    audit('update', 'invoice', $id);
    return ['invoice' => invoice_full($id)];
});

$router->add('POST', 'invoices/{id}/issue', $invoiceRoles, function ($p) {
    $id = id_param($p);
    transaction(fn () => issue_invoice($id));
    audit('issue', 'invoice', $id);
    return ['invoice' => invoice_full($id)];
});

$router->add('POST', 'invoices/{id}/cancel', $invoiceRoles, function ($p) {
    $id = id_param($p);
    $reason = str_in(body(), 'reason', 1000);
    if ($reason === null) {
        throw new ApiError('Enter the reason for cancelling.', 422);
    }
    transaction(function () use ($id, $reason) {
        $inv = find_or_404('invoices', $id, 'Invoice');
        if ($inv['status'] === 'draft') {
            throw new ApiError('This draft was never issued; delete it instead.', 422);
        }
        if ($inv['status'] === 'cancelled') {
            throw new ApiError('This is already cancelled.', 422);
        }
        if ((float) $inv['amount_paid'] > 0) {
            throw new ApiError('This invoice has payments recorded. Remove them first, or raise a credit note instead.', 422);
        }
        if (q("SELECT 1 FROM invoices WHERE original_invoice_id = ? AND status = 'issued'", [$id])->fetchColumn()) {
            throw new ApiError('Cancel the credit/debit notes raised against this invoice first.', 422);
        }
        update('invoices', $id, ['status' => 'cancelled', 'cancelled_at' => now_utc(), 'cancelled_by' => current_user()['id'],
            'cancel_reason' => $reason, 'updated_at' => now_utc()]);
        if ($inv['original_invoice_id']) {
            refresh_note_adjustments((int) $inv['original_invoice_id']);
        }
        invoice_log($id, 'cancelled', $reason, [['field' => 'Status', 'old' => ucwords(str_replace('_', ' ', $inv['status'])), 'new' => 'Cancelled']], true);
    });
    audit('cancel', 'invoice', $id);
    return ['invoice' => invoice_full($id)];
});

// Only never-issued drafts can be deleted (the database refuses anything else).
$router->add('DELETE', 'invoices/{id}', $invoiceRoles, function ($p) {
    $inv = find_or_404('invoices', id_param($p), 'Invoice');
    if ($inv['status'] !== 'draft' || $inv['issued_at']) {
        throw new ApiError('Issued invoices cannot be deleted. Cancel it instead.', 422);
    }
    transaction(function () use ($inv) {
        q('UPDATE recurring_invoices SET last_invoice_id = NULL WHERE last_invoice_id = ?', [$inv['id']]);
        if ($inv['quotation_id']) {
            q("UPDATE quotations SET status = 'accepted' WHERE id = ? AND status = 'invoiced'", [$inv['quotation_id']]);
        }
        invoice_log((int) $inv['id'], 'draft_deleted');
        q('DELETE FROM invoices WHERE id = ?', [$inv['id']]);
    });
    audit('delete', 'invoice', (int) $inv['id']);
});

$router->add('POST', 'invoices/{id}/duplicate', $invoiceRoles, function ($p) {
    $src = invoice_full(id_param($p));
    if ($src['doc_type'] !== 'invoice') {
        throw new ApiError('Only invoices can be duplicated.', 422);
    }
    $id = transaction(function () use ($src) {
        [$data, $items] = invoice_input([
            'client_id' => $src['client_id'], 'project_id' => $src['project_id'], 'place_of_supply' => $src['place_of_supply'],
            'supply_type' => $src['supply_type'], 'reverse_charge' => $src['reverse_charge'],
            'notes' => $src['notes'], 'terms' => $src['terms'], 'items' => $src['items'],
        ], 'invoice');
        $id = invoice_insert($data + ['doc_type' => 'invoice', 'status' => 'draft', 'created_by' => current_user()['id'], 'duplicated_from' => $src['id']], $items);
        invoice_log($id, 'created', "Duplicated from {$src['number']}");
        return $id;
    });
    audit('create', 'invoice', $id);
    return ['invoice' => invoice_full($id)];
});

$router->add('GET', 'invoices/{id}/pdf', $invoiceRoles, function ($p) {
    $doc = invoice_full(id_param($p));
    send_pdf(invoice_pdf($doc), ($doc['status'] === 'draft' ? 'Draft ' . DOC_TITLES[$doc['doc_type']] : $doc['number']) . '.pdf', query('download') === '1');
});

$router->add('POST', 'invoices/{id}/email', $invoiceRoles, function ($p) {
    $id = id_param($p);
    $doc = invoice_full($id);
    if ($doc['status'] === 'draft') {
        throw new ApiError('Issue it before sending.', 422);
    }
    $b = body();
    $to = array_values(array_filter(array_map('trim', explode(',', (string) ($b['to'] ?? '')))));
    if (!$to || count($to) > 5) {
        throw new ApiError('Enter one to five email addresses.', 422);
    }
    foreach ($to as $addr) {
        if (!filter_var($addr, FILTER_VALIDATE_EMAIL)) {
            throw new ApiError("{$addr} is not a valid email address.", 422);
        }
    }
    $company = $doc['company'];
    $subject = str_in($b, 'subject', 200) ?? DOC_TITLES[$doc['doc_type']] . " {$doc['number']} from {$company['company_name']}";
    $message = str_in($b, 'message', 5000, true);
    $tmp = tempnam(sys_get_temp_dir(), 'inv');
    file_put_contents($tmp, invoice_pdf($doc));
    $file = ['path' => $tmp, 'name' => str_replace('/', '-', $doc['number']) . '.pdf', 'type' => 'application/pdf'];
    $sent = array_values(array_filter($to, fn ($addr) => send_email($addr, $subject, $message, $company['company_email'] ?: null, $file, $company['company_name'])));
    @unlink($tmp);
    if (!$sent) {
        throw new ApiError('The email could not be sent. Please try again later.', 502);
    }
    transaction(fn () => invoice_log($id, 'emailed', null, [['field' => 'Sent to', 'old' => '', 'new' => implode(', ', $sent)]]));
    return ['sent' => $sent];
});

// ── Payments ────────────────────────────────────────────────────────────

$router->add('POST', 'invoices/{id}/payments', $invoiceRoles, function ($p) {
    $id = id_param($p);
    $b = body();
    $amount = num_in($b, 'amount', null, 0.01);
    if ($amount === null) {
        throw new ApiError('Amount is required.', 422);
    }
    $pid = transaction(function () use ($id, $b, $amount) {
        $inv = find_or_404('invoices', $id, 'Invoice');
        if ($inv['doc_type'] !== 'invoice') {
            throw new ApiError('Payments are recorded against invoices, not notes.', 422);
        }
        if ($inv['status'] === 'draft') {
            throw new ApiError('Issue the invoice before recording a payment.', 422);
        }
        if ($inv['status'] === 'cancelled') {
            throw new ApiError('Cannot record a payment on a cancelled invoice.', 422);
        }
        $company = company_snapshot();
        $balance = money((float) $inv['total'] + (float) $inv['adjustment'] - (float) $inv['amount_paid']);
        if ($amount > $balance + 0.005) {
            throw new ApiError('Amount is more than the balance due (' . format_money($balance, $company) . ').', 422);
        }
        $date = date_in($b, 'date') ?? today();
        $method = enum_in($b, 'method', PAYMENT_METHODS, 'bank_transfer');
        $ref = str_in($b, 'reference', 120);
        $pid = insert('payments', [
            'invoice_id' => $id, 'amount' => $amount, 'date' => $date, 'method' => $method,
            'reference' => $ref, 'notes' => str_in($b, 'notes', 1000), 'created_by' => current_user()['id'],
        ]);
        refresh_invoice_status($id);
        invoice_log($id, 'payment_received', null, [
            ['field' => 'Payment', 'old' => '', 'new' => sprintf('%s on %s by %s%s', format_money($amount, $company), date('d M Y', strtotime($date)), PAYMENT_LABELS[$method], $ref ? " (ref {$ref})" : '')],
            ['field' => 'Balance due', 'old' => format_money($balance, $company), 'new' => format_money($balance - $amount, $company)],
        ]);
        return $pid;
    });
    audit('create', 'payment', $pid);
    return ['payment' => find_or_404('payments', $pid, 'Payment')];
});

$router->add('DELETE', 'payments/{id}', $invoiceRoles, function ($p) {
    $pay = find_or_404('payments', id_param($p), 'Payment');
    $reason = str_in(body(), 'reason', 1000);
    if ($reason === null) {
        throw new ApiError('Enter the reason for removing this payment.', 422);
    }
    transaction(function () use ($pay, $reason) {
        $company = company_snapshot();
        q('DELETE FROM payments WHERE id = ?', [$pay['id']]);
        refresh_invoice_status((int) $pay['invoice_id']);
        invoice_log((int) $pay['invoice_id'], 'payment_removed', $reason, [[
            'field' => 'Payment', 'old' => sprintf('%s on %s by %s', format_money((float) $pay['amount'], $company), date('d M Y', strtotime($pay['date'])), PAYMENT_LABELS[$pay['method']] ?? $pay['method']), 'new' => '(removed)',
        ]]);
    });
    audit('delete', 'payment', (int) $pay['id']);
});

// ── History (read-only) ─────────────────────────────────────────────────

function invoice_history_rows(int $id): array
{
    $rows = q('SELECT id, action, reason, changes, user_name, created_at, pdf_path IS NOT NULL AS has_pdf FROM invoice_history WHERE invoice_id = ? ORDER BY id DESC', [$id])->fetchAll();
    foreach ($rows as &$r) {
        $r['changes'] = $r['changes'] ? json_decode($r['changes'], true) : [];
        $r['has_pdf'] = (bool) $r['has_pdf'];
    }
    return $rows;
}

$router->add('GET', 'invoices/{id}/history', $invoiceRoles, fn ($p) => ['items' => invoice_history_rows(id_param($p))]);

$router->add('GET', 'invoices/{id}/history/export', $invoiceRoles, function ($p) {
    $inv = find_or_404('invoices', id_param($p), 'Invoice');
    $rows = [];
    foreach (invoice_history_rows((int) $inv['id']) as $h) {
        $when = date('d M Y H:i', strtotime($h['created_at'] . ' UTC'));
        $action = ucwords(str_replace('_', ' ', $h['action']));
        foreach ($h['changes'] ?: [['field' => '', 'old' => '', 'new' => '']] as $c) {
            $rows[] = [$when, $action, $h['user_name'], $h['reason'], $c['field'], $c['old'], $c['new']];
        }
    }
    export_rows('history_' . str_replace('/', '-', $inv['number']), ['Date & time', 'Action', 'By', 'Reason', 'Field', 'Old value', 'New value'], $rows, query('format', 'csv'));
});

$router->add('GET', 'invoice-history/{id}/pdf', $invoiceRoles, function ($p) {
    $h = q('SELECT h.pdf_path, h.created_at, i.number FROM invoice_history h JOIN invoices i ON i.id = h.invoice_id WHERE h.id = ?', [id_param($p)])->fetch();
    if (!$h) {
        throw new ApiError('Version not found.', 404);
    }
    send_file($h['pdf_path'], str_replace('/', '-', $h['number']) . '_' . substr($h['created_at'], 0, 10) . '.pdf');
});

// ── Service list ────────────────────────────────────────────────────────

function service_data(array $b): array
{
    $hsn = str_in($b, 'hsn_sac', 20);
    if ($hsn !== null && !preg_match('/^\d{4,8}$/', $hsn)) {
        throw new ApiError('HSN/SAC code should be 4 to 8 digits.', 422);
    }
    $gst = num_in($b, 'gst_rate', (float) setting('default_gst_rate'), 0);
    if ($gst > 28) {
        throw new ApiError('GST rate cannot be more than 28%.', 422);
    }
    return [
        'name' => str_in($b, 'name', 160, true),
        'description' => str_in($b, 'description', 1000),
        'unit' => str_in($b, 'unit', 20),
        'hsn_sac' => $hsn,
        'rate' => num_in($b, 'rate', 0, 0),
        'gst_rate' => $gst,
        'active' => array_key_exists('active', $b) ? (!empty($b['active']) ? 1 : 0) : 1,
        'updated_at' => now_utc(),
    ];
}

$router->add('GET', 'services', [ROLE_MARKETING, ROLE_ACCOUNTS], fn () => ['items' => q(
    'SELECT * FROM services ' . (query('active') ? 'WHERE active = 1 ' : '') . 'ORDER BY active DESC, name'
)->fetchAll()]);

// Only admins change the service list and its rates; issued invoices keep the values they were issued with.
$router->add('POST', 'services', [ROLE_ADMIN], function () {
    $id = insert('services', service_data(body()));
    audit('create', 'service', $id);
    return ['service' => find_or_404('services', $id, 'Service')];
});

$router->add('PUT', 'services/{id}', [ROLE_ADMIN], function ($p) {
    $id = id_param($p);
    find_or_404('services', $id, 'Service');
    update('services', $id, service_data(body()));
    audit('update', 'service', $id);
    return ['service' => find_or_404('services', $id, 'Service')];
});

// ── Reports ─────────────────────────────────────────────────────────────

function fy_start(): string
{
    [$y, $m] = array_map('intval', explode('-', today()));
    return sprintf('%04d-04-01', $m >= 4 ? $y : $y - 1);
}

/** Issued documents in a date range; credit notes count as negative sales. */
$router->add('GET', 'reports/sales', $invoiceRoles, function () {
    sync_overdue();
    $from = query('from') ?? fy_start();
    $to = query('to') ?? today();
    $group = query('group', 'month');
    $period = match ($group) {
        'day' => "DATE_FORMAT(i.issue_date, '%Y-%m-%d')",
        'fy' => "CASE WHEN MONTH(i.issue_date) >= 4
                 THEN CONCAT(YEAR(i.issue_date), '-', LPAD(MOD(YEAR(i.issue_date) + 1, 100), 2, '0'))
                 ELSE CONCAT(YEAR(i.issue_date) - 1, '-', LPAD(MOD(YEAR(i.issue_date), 100), 2, '0')) END",
        default => "DATE_FORMAT(i.issue_date, '%Y-%m')",
    };
    $where = "i.status NOT IN ('draft','cancelled') AND i.issue_date BETWEEN ? AND ?";
    $args = [$from, $to];
    if ($s = query('client_id')) {
        $where .= ' AND i.client_id = ?';
        $args[] = (int) $s;
    }
    $sign = "CASE i.doc_type WHEN 'credit_note' THEN -1 ELSE 1 END";
    $rows = q("SELECT {$period} AS period,
            COUNT(CASE WHEN i.doc_type = 'invoice' THEN 1 END) AS invoices,
            ROUND(SUM(CASE i.doc_type WHEN 'invoice' THEN i.total ELSE 0 END), 2) AS invoiced,
            ROUND(SUM(CASE i.doc_type WHEN 'credit_note' THEN i.total ELSE 0 END), 2) AS credit_notes,
            ROUND(SUM(CASE i.doc_type WHEN 'debit_note' THEN i.total ELSE 0 END), 2) AS debit_notes,
            ROUND(SUM({$sign} * i.taxable_value), 2) AS taxable,
            ROUND(SUM({$sign} * i.tax_total), 2) AS tax,
            ROUND(SUM({$sign} * i.total), 2) AS net_sales,
            ROUND(SUM(CASE i.doc_type WHEN 'invoice' THEN i.amount_paid ELSE 0 END), 2) AS received,
            ROUND(SUM(CASE WHEN i.doc_type = 'invoice' AND i.status IN ('issued','partially_paid','overdue') THEN i.total + i.adjustment - i.amount_paid ELSE 0 END), 2) AS outstanding
        FROM invoices i WHERE {$where} GROUP BY period ORDER BY period", $args)->fetchAll();
    $byStatus = q("SELECT i.status, COUNT(*) AS count, ROUND(SUM(i.total), 2) AS total, ROUND(SUM(i.total + i.adjustment - i.amount_paid), 2) AS balance
        FROM invoices i WHERE i.doc_type = 'invoice' AND {$where} GROUP BY i.status", $args)->fetchAll();

    if ($format = query('format')) {
        export_rows("sales_{$from}_{$to}", ['Period', 'Invoices', 'Invoiced', 'Credit notes', 'Debit notes', 'Taxable value', 'Tax', 'Net sales', 'Received', 'Outstanding'],
            array_map('array_values', $rows), $format);
    }
    $keys = ['invoices', 'invoiced', 'credit_notes', 'debit_notes', 'taxable', 'tax', 'net_sales', 'received', 'outstanding'];
    $totals = [];
    foreach ($keys as $k) {
        $totals[$k] = money((float) array_sum(array_column($rows, $k)));
    }
    return ['from' => $from, 'to' => $to, 'group' => $group, 'rows' => $rows, 'totals' => $totals, 'by_status' => $byStatus];
});

/** GST summary: by rate, by HSN/SAC, B2B/B2C split, and an invoice-wise register (export). */
$router->add('GET', 'reports/gst', $invoiceRoles, function () {
    $from = query('from') ?? fy_start();
    $to = query('to') ?? today();
    $args = [$from, $to];
    $base = "FROM invoice_items ii JOIN invoices i ON i.id = ii.invoice_id JOIN clients c ON c.id = i.client_id
        WHERE i.status NOT IN ('draft','cancelled') AND i.issue_date BETWEEN ? AND ?";
    $sign = "(CASE i.doc_type WHEN 'credit_note' THEN -1 ELSE 1 END)";
    $sums = "ROUND(SUM({$sign} * COALESCE(ii.taxable_value, ii.amount)), 2) AS taxable, ROUND(SUM({$sign} * ii.cgst), 2) AS cgst,
        ROUND(SUM({$sign} * ii.sgst), 2) AS sgst, ROUND(SUM({$sign} * ii.igst), 2) AS igst,
        ROUND(SUM({$sign} * (ii.cgst + ii.sgst + ii.igst)), 2) AS tax";

    $table = query('table');
    if ($table === 'register' && ($format = query('format'))) {
        $rows = q("SELECT i.number, i.doc_type, i.issue_date, " . CUSTOMER_SQL . ' AS customer, ' . CUSTOMER_GSTIN_SQL . " AS gstin,
                i.place_of_supply, i.supply_type, i.reverse_charge, ii.gst_rate, {$sums}
            {$base} GROUP BY i.id, ii.gst_rate ORDER BY i.issue_date, i.id", $args)->fetchAll();
        export_rows("gst_register_{$from}_{$to}", ['Number', 'Type', 'Date', 'Customer', 'Customer GSTIN', 'Place of supply', 'Tax type', 'Reverse charge',
            'GST rate %', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total tax'], array_map(fn ($r) => [
            $r['number'], DOC_TITLES[$r['doc_type']], $r['issue_date'], $r['customer'], $r['gstin'], GST_STATES[$r['place_of_supply']] ?? '',
            SUPPLY_LABELS[$r['supply_type']] ?? '', $r['reverse_charge'] ? 'Yes' : 'No', (float) $r['gst_rate'],
            (float) $r['taxable'], (float) $r['cgst'], (float) $r['sgst'], (float) $r['igst'], (float) $r['tax'],
        ], $rows), $format);
    }

    $byRate = q("SELECT ii.gst_rate AS rate, {$sums} {$base} GROUP BY ii.gst_rate ORDER BY ii.gst_rate", $args)->fetchAll();
    $byHsn = q("SELECT COALESCE(NULLIF(ii.hsn_sac, ''), '—') AS hsn_sac, MIN(ii.description) AS description, ii.gst_rate AS rate,
            ROUND(SUM({$sign} * ii.quantity), 2) AS quantity, {$sums} {$base} GROUP BY 1, ii.gst_rate ORDER BY 1", $args)->fetchAll();
    $byType = q("SELECT CASE WHEN COALESCE(" . CUSTOMER_GSTIN_SQL . ", '') != '' THEN 'B2B' ELSE 'B2C' END AS customer_type,
            i.supply_type, i.reverse_charge, {$sums} {$base} GROUP BY 1, i.supply_type, i.reverse_charge ORDER BY 1, 2", $args)->fetchAll();

    if ($format = query('format')) {
        if ($table === 'hsn') {
            export_rows("gst_hsn_{$from}_{$to}", ['HSN/SAC', 'Description', 'GST rate %', 'Quantity', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total tax'],
                array_map(fn ($r) => [$r['hsn_sac'], $r['description'], (float) $r['rate'], (float) $r['quantity'], (float) $r['taxable'], (float) $r['cgst'], (float) $r['sgst'], (float) $r['igst'], (float) $r['tax']], $byHsn), $format);
        }
        export_rows("gst_summary_{$from}_{$to}", ['GST rate %', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total tax'],
            array_map(fn ($r) => [(float) $r['rate'], (float) $r['taxable'], (float) $r['cgst'], (float) $r['sgst'], (float) $r['igst'], (float) $r['tax']], $byRate), $format);
    }
    $totals = [];
    foreach (['taxable', 'cgst', 'sgst', 'igst', 'tax'] as $k) {
        $totals[$k] = money((float) array_sum(array_column($byRate, $k)));
    }
    return ['from' => $from, 'to' => $to, 'by_rate' => $byRate, 'by_hsn' => $byHsn, 'by_type' => $byType, 'totals' => $totals];
});

// ── Branding images and applying company details to issued invoices ──────

$router->add('POST', 'settings/branding/{kind}', [ROLE_ADMIN], function ($p) {
    $key = BRANDING_KINDS[$p['kind'] ?? ''] ?? throw new ApiError('Unknown image.', 404);
    $f = $_FILES['file'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || $f['size'] > 2 * 1024 * 1024) {
        throw new ApiError('Choose a PNG, JPG or WEBP image under 2 MB.', 422);
    }
    $ext = strtolower(pathinfo((string) $f['name'], PATHINFO_EXTENSION));
    $info = @getimagesize($f['tmp_name']);
    if (!isset(IMAGE_TYPES[$ext]) || !$info || $info['mime'] !== IMAGE_TYPES[$ext]) {
        throw new ApiError('Choose a PNG, JPG or WEBP image under 2 MB.', 422);
    }
    // Old images are kept: invoices issued earlier still show the logo they were issued with.
    $dir = upload_root() . '/branding/' . date('Y/m');
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new ApiError('Upload folder is not writable.', 500);
    }
    $name = "{$p['kind']}_" . bin2hex(random_bytes(8)) . ".{$ext}";
    if (!move_uploaded_file($f['tmp_name'], "{$dir}/{$name}")) {
        throw new ApiError('Could not save the image.', 500);
    }
    set_setting($key, substr("{$dir}/{$name}", strlen(upload_root()) + 1));
    audit('update', 'branding');
    return ['settings' => public_settings()];
});

$router->add('DELETE', 'settings/branding/{kind}', [ROLE_ADMIN], function ($p) {
    $key = BRANDING_KINDS[$p['kind'] ?? ''] ?? throw new ApiError('Unknown image.', 404);
    set_setting($key, '');
    audit('update', 'branding');
    return ['settings' => public_settings()];
});

// Current image, or the one frozen on a given invoice (?invoice=ID).
$router->add('GET', 'branding/{kind}', [], function ($p) {
    $kind = (string) ($p['kind'] ?? '');
    $key = BRANDING_KINDS[$kind] ?? throw new ApiError('Not found.', 404);
    if ($kind !== 'logo' && !has_role(ROLE_ACCOUNTS, ROLE_MARKETING)) {
        throw new ApiError('You do not have access to this.', 403);
    }
    $path = setting($key);
    if ($id = query('invoice')) {
        if (!has_role(ROLE_ACCOUNTS)) {
            throw new ApiError('You do not have access to this.', 403);
        }
        $path = invoice_full((int) $id)['company'][$key] ?? '';
    }
    send_file($path ?: null, "{$kind}." . pathinfo((string) $path, PATHINFO_EXTENSION));
});

/**
 * Company details are frozen on each invoice when it is issued. After changing them in settings,
 * the admin can choose to apply the new details to all issued invoices or to those in a period.
 */
$router->add('POST', 'settings/apply-to-invoices', [ROLE_ADMIN], function () {
    $b = body();
    $scope = enum_in($b, 'scope', ['all', 'period']);
    $where = "status NOT IN ('draft','cancelled')";
    $args = [];
    $reason = 'Company details updated in settings and applied to all invoices';
    if ($scope === 'period') {
        $from = date_in($b, 'from', true);
        $to = date_in($b, 'to', true);
        if ($to < $from) {
            throw new ApiError('The end date must be after the start date.', 422);
        }
        $where .= ' AND issue_date BETWEEN ? AND ?';
        $args = [$from, $to];
        $reason = "Company details updated in settings and applied to invoices dated {$from} to {$to}";
    } elseif ($scope === null) {
        throw new ApiError('Choose which invoices to update.', 422);
    }
    $live = company_snapshot();
    $count = transaction(function () use ($where, $args, $live, $reason) {
        $count = 0;
        foreach (q("SELECT id, company_snapshot FROM invoices WHERE {$where}", $args)->fetchAll() as $row) {
            $old = $row['company_snapshot'] ? (json_decode($row['company_snapshot'], true) ?: []) : null;
            if ($old === null) {
                // Issued before snapshots existed: it already shows the current details.
                update('invoices', (int) $row['id'], ['company_snapshot' => json_encode($live, JSON_UNESCAPED_UNICODE)]);
                continue;
            }
            $changes = [];
            foreach (COMMON_INVOICE_KEYS as $k => $label) {
                $was = (string) ($old[$k] ?? '');
                if ($was !== $live[$k]) {
                    $isFile = str_ends_with($k, '_file');
                    $changes[] = ['field' => $label, 'old' => $isFile ? ($was ? 'Previous image' : '(none)') : $was, 'new' => $isFile ? ($live[$k] ? 'New image' : '(none)') : $live[$k]];
                    $old[$k] = $live[$k];
                }
            }
            if ($changes) {
                update('invoices', (int) $row['id'], ['company_snapshot' => json_encode($old, JSON_UNESCAPED_UNICODE)]);
                invoice_log((int) $row['id'], 'company_details_updated', $reason, $changes);
                $count++;
            }
        }
        return $count;
    });
    audit('apply_settings', 'invoice');
    return ['updated' => $count];
});
