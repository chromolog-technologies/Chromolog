<?php

declare(strict_types=1);

/** CRM: leads (website + manual), notes, clients, contracts. @var Router $router */

const LEAD_STATUSES = ['new', 'contacted', 'meeting', 'proposal', 'won', 'lost', 'spam'];
const LEAD_SCORES = ['hot', 'warm', 'cold'];
const NOTE_TYPES = ['note', 'call', 'email', 'meeting', 'whatsapp'];
const CONTRACT_TYPES = ['project', 'amc', 'support', 'retainer', 'nda', 'other'];
const CONTRACT_STATUSES = ['draft', 'active', 'expired', 'cancelled'];

const LEAD_TEXT_FIELDS = [
    'full_name' => 120, 'email' => 160, 'phone' => 40, 'company' => 160, 'industry' => 80, 'location' => 120,
    'role' => 80, 'service_interest' => 200, 'budget_range' => 80, 'timeline' => 80, 'summary' => 4000, 'notes' => 4000,
];

function lead_data(array $b, bool $creating): array
{
    $data = [];
    foreach (LEAD_TEXT_FIELDS as $f => $max) {
        if (array_key_exists($f, $b) || ($creating && $f === 'full_name')) {
            $data[$f] = str_in($b, $f, $max, $f === 'full_name');
        }
    }
    if (array_key_exists('status', $b)) {
        $data['status'] = enum_in($b, 'status', LEAD_STATUSES, 'new');
    }
    if (array_key_exists('score', $b)) {
        $data['score'] = enum_in($b, 'score', LEAD_SCORES);
    }
    if (array_key_exists('source', $b)) {
        $data['source'] = str_in($b, 'source', 40) ?? 'manual';
    }
    if (array_key_exists('assigned_to', $b)) {
        $data['assigned_to'] = ($b['assigned_to'] ?? null) ? (int) $b['assigned_to'] : null;
    }
    if (array_key_exists('next_follow_up', $b)) {
        $data['next_follow_up'] = date_in($b, 'next_follow_up');
    }
    if (array_key_exists('estimated_value', $b)) {
        $data['estimated_value'] = num_in($b, 'estimated_value', null, 0);
    }
    return $data;
}

$leadRoles = [ROLE_MARKETING];

$router->add('GET', 'leads', $leadRoles, function () {
    $where = ['1=1'];
    $args = [];
    if ($s = query('status')) {
        $where[] = 'l.status = ?';
        $args[] = $s;
    } elseif (query('open')) {
        $where[] = "l.status IN ('new','contacted','meeting','proposal')";
    } elseif (!query('include_closed')) {
        $where[] = "l.status != 'spam'";
    }
    if ($s = query('source')) {
        $where[] = 'l.source = ?';
        $args[] = $s;
    }
    if ($s = query('assigned_to')) {
        $where[] = 'l.assigned_to = ?';
        $args[] = (int) $s;
    }
    if (query('follow_up_due')) {
        $where[] = "l.next_follow_up <= ? AND l.status NOT IN ('won','lost','spam')";
        $args[] = today();
    }
    if ($s = query('q')) {
        $where[] = '(l.full_name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.company LIKE ?)';
        array_push($args, "%{$s}%", "%{$s}%", "%{$s}%", "%{$s}%");
    }
    $rows = q('SELECT l.id, l.source, l.full_name, l.email, l.phone, l.company, l.industry, l.location, l.service_interest,
            l.score, l.status, l.estimated_value, l.next_follow_up, l.assigned_to, u.name AS assigned_name, l.client_id, l.created_at, l.updated_at
        FROM leads l LEFT JOIN users u ON u.id = l.assigned_to
        WHERE ' . implode(' AND ', $where) . ' ORDER BY l.id DESC LIMIT 500', $args)->fetchAll();
    return ['items' => $rows];
});

$router->add('GET', 'leads/export', $leadRoles, function () {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads_' . today() . '.csv"');
    $out = fopen('php://output', 'w');
    $rows = q('SELECT id, source, full_name, email, phone, company, industry, location, service_interest, budget_range, timeline,
        score, status, estimated_value, next_follow_up, summary, created_at FROM leads ORDER BY id DESC')->fetchAll();
    fputcsv($out, array_keys($rows[0] ?? ['id' => '']), escape: '');
    foreach ($rows as $r) {
        fputcsv($out, csv_safe($r), escape: '');
    }
    exit;
});

$router->add('GET', 'leads/{id}', $leadRoles, function ($p) {
    $lead = find_or_404('leads', id_param($p), 'Lead');
    $notes = q('SELECT n.*, u.name AS user_name FROM lead_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.lead_id = ? ORDER BY n.id DESC', [$lead['id']])->fetchAll();
    $chat = q('SELECT role, text, created_at FROM messages WHERE session_id = ? ORDER BY id', [$lead['session_id']])->fetchAll();
    $quotes = q('SELECT id, number, status, total, issue_date FROM quotations WHERE lead_id = ? ORDER BY id DESC', [$lead['id']])->fetchAll();
    return ['lead' => $lead, 'notes' => $notes, 'chat' => $chat, 'quotations' => $quotes];
});

$router->add('POST', 'leads', $leadRoles, function () {
    $data = lead_data(body(), true);
    if (empty($data['email']) && empty($data['phone'])) {
        throw new ApiError('Add an email or phone number.', 422);
    }
    $data['session_id'] = 'manual-' . bin2hex(random_bytes(8));
    $data['source'] ??= 'manual';
    $id = insert('leads', $data);
    audit('create', 'lead', $id);
    return ['lead' => find_or_404('leads', $id, 'Lead')];
});

$router->add('PUT', 'leads/{id}', $leadRoles, function ($p) {
    $id = id_param($p);
    $before = find_or_404('leads', $id, 'Lead');
    $data = lead_data(body(), false);
    $data['updated_at'] = now_utc();
    update('leads', $id, $data);
    if (isset($data['status']) && $data['status'] !== $before['status']) {
        insert('lead_notes', ['lead_id' => $id, 'user_id' => current_user()['id'], 'type' => 'status',
            'body' => "Status changed from {$before['status']} to {$data['status']}"]);
    }
    audit('update', 'lead', $id);
    return ['lead' => find_or_404('leads', $id, 'Lead')];
});

$router->add('DELETE', 'leads/{id}', [ROLE_ADMIN], function ($p) {
    q('DELETE FROM leads WHERE id = ?', [id_param($p)]);
    audit('delete', 'lead', id_param($p));
});

$router->add('POST', 'leads/{id}/notes', $leadRoles, function ($p) {
    $lead = find_or_404('leads', id_param($p), 'Lead');
    $b = body();
    $id = insert('lead_notes', [
        'lead_id' => $lead['id'],
        'user_id' => current_user()['id'],
        'type' => enum_in($b, 'type', NOTE_TYPES, 'note'),
        'body' => str_in($b, 'body', 4000, true),
    ]);
    if (array_key_exists('next_follow_up', $b)) {
        update('leads', (int) $lead['id'], ['next_follow_up' => date_in($b, 'next_follow_up'), 'updated_at' => now_utc()]);
    }
    return ['note' => find_or_404('lead_notes', $id, 'Note')];
});

// Won lead → client record (keeps a link back to the lead).
$router->add('POST', 'leads/{id}/convert', $leadRoles, function ($p) {
    $lead = find_or_404('leads', id_param($p), 'Lead');
    if ($lead['client_id']) {
        return ['client' => find_or_404('clients', (int) $lead['client_id'], 'Client')];
    }
    $clientId = insert('clients', [
        'name' => $lead['full_name'], 'company' => $lead['company'], 'email' => $lead['email'],
        'phone' => $lead['phone'], 'address' => $lead['location'], 'lead_id' => $lead['id'],
    ]);
    update('leads', (int) $lead['id'], ['client_id' => $clientId, 'status' => 'won', 'updated_at' => now_utc()]);
    insert('lead_notes', ['lead_id' => $lead['id'], 'user_id' => current_user()['id'], 'type' => 'status', 'body' => 'Converted to client']);
    audit('convert', 'lead', (int) $lead['id']);
    return ['client' => find_or_404('clients', $clientId, 'Client')];
});

// ── Clients ─────────────────────────────────────────────────────────────

$clientReadRoles = [ROLE_MARKETING, ROLE_ACCOUNTS, ROLE_PROJECT];
$clientWriteRoles = [ROLE_MARKETING, ROLE_ACCOUNTS];

function client_data(array $b): array
{
    $data = [];
    foreach (['name' => 120, 'company' => 160, 'email' => 160, 'phone' => 40, 'address' => 500, 'tax_id' => 40, 'notes' => 4000] as $f => $max) {
        if (array_key_exists($f, $b)) {
            $data[$f] = str_in($b, $f, $max, $f === 'name');
        }
    }
    if (array_key_exists('tax_id', $data) && $data['tax_id'] !== null) {
        $data['tax_id'] = strtoupper(str_replace(' ', '', $data['tax_id']));
    }
    if (array_key_exists('state_code', $b)) {
        $state = str_in($b, 'state_code', 2);
        if ($state !== null && !isset(GST_STATES[$state])) {
            throw new ApiError('Choose a valid state.', 422);
        }
        $data['state_code'] = $state;
    }
    return $data;
}

$router->add('GET', 'clients', $clientReadRoles, function () {
    $args = [];
    $where = '1=1';
    if ($s = query('q')) {
        $where = '(c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ?)';
        $args = ["%{$s}%", "%{$s}%", "%{$s}%"];
    }
    return ['items' => q("SELECT c.*,
            (SELECT COALESCE(SUM(total),0) FROM invoices i WHERE i.client_id = c.id AND i.doc_type = 'invoice' AND i.status NOT IN ('draft','cancelled')) AS invoiced,
            (SELECT COALESCE(SUM(total + adjustment - amount_paid),0) FROM invoices i WHERE i.client_id = c.id AND i.doc_type = 'invoice' AND i.status IN ('issued','partially_paid','overdue')) AS outstanding,
            (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS projects
        FROM clients c WHERE {$where} ORDER BY c.name", $args)->fetchAll()];
});

$router->add('GET', 'clients/{id}', $clientReadRoles, function ($p) {
    $c = find_or_404('clients', id_param($p), 'Client');
    return [
        'client' => $c,
        'contracts' => q('SELECT * FROM contracts WHERE client_id = ? ORDER BY id DESC', [$c['id']])->fetchAll(),
        'invoices' => has_role(ROLE_ACCOUNTS, ROLE_MARKETING) ? q('SELECT id, number, doc_type, status, total, amount_paid, adjustment, issue_date, due_date FROM invoices WHERE client_id = ? ORDER BY issue_date DESC, id DESC', [$c['id']])->fetchAll() : [],
        'quotations' => has_role(ROLE_ACCOUNTS, ROLE_MARKETING) ? q('SELECT id, number, status, total, issue_date FROM quotations WHERE client_id = ? ORDER BY id DESC', [$c['id']])->fetchAll() : [],
        'projects' => q('SELECT id, name, status, deadline FROM projects WHERE client_id = ? ORDER BY id DESC', [$c['id']])->fetchAll(),
    ];
});

$router->add('POST', 'clients', $clientWriteRoles, function () {
    $data = client_data(body());
    if (empty($data['name'])) {
        throw new ApiError('Name is required.', 422);
    }
    $id = insert('clients', $data);
    audit('create', 'client', $id);
    return ['client' => find_or_404('clients', $id, 'Client')];
});

$router->add('PUT', 'clients/{id}', $clientWriteRoles, function ($p) {
    $id = id_param($p);
    find_or_404('clients', $id, 'Client');
    update('clients', $id, client_data(body()));
    audit('update', 'client', $id);
    return ['client' => find_or_404('clients', $id, 'Client')];
});

$router->add('DELETE', 'clients/{id}', [ROLE_ADMIN], function ($p) {
    $id = id_param($p);
    if (q('SELECT 1 FROM invoices WHERE client_id = ? UNION SELECT 1 FROM projects WHERE client_id = ?', [$id, $id])->fetchColumn()) {
        throw new ApiError('This client has invoices or projects and cannot be deleted.', 422);
    }
    q('DELETE FROM contracts WHERE client_id = ?', [$id]);
    q('DELETE FROM clients WHERE id = ?', [$id]);
    audit('delete', 'client', $id);
});

// ── Contracts (with signed document upload) ─────────────────────────────

$contractRoles = [ROLE_MARKETING, ROLE_ACCOUNTS];

function contract_data(array $b): array
{
    $data = [];
    if (array_key_exists('client_id', $b)) {
        $data['client_id'] = (int) $b['client_id'];
        find_or_404('clients', $data['client_id'], 'Client');
    }
    if (array_key_exists('title', $b)) {
        $data['title'] = str_in($b, 'title', 200, true);
    }
    if (array_key_exists('type', $b)) {
        $data['type'] = enum_in($b, 'type', CONTRACT_TYPES, 'project');
    }
    if (array_key_exists('status', $b)) {
        $data['status'] = enum_in($b, 'status', CONTRACT_STATUSES, 'active');
    }
    foreach (['start_date', 'end_date'] as $f) {
        if (array_key_exists($f, $b)) {
            $data[$f] = date_in($b, $f);
        }
    }
    if (array_key_exists('value', $b)) {
        $data['value'] = num_in($b, 'value', 0, 0);
    }
    if (array_key_exists('renewal_reminder_days', $b)) {
        $data['renewal_reminder_days'] = (int) num_in($b, 'renewal_reminder_days', 30, 0);
    }
    if (array_key_exists('notes', $b)) {
        $data['notes'] = str_in($b, 'notes', 4000);
    }
    return $data;
}

$router->add('GET', 'contracts', $contractRoles, function () {
    $rows = q("SELECT k.*, c.name AS client_name, c.company AS client_company,
            CASE WHEN k.status = 'active' AND k.end_date IS NOT NULL AND k.end_date <= date('now', '+' || k.renewal_reminder_days || ' days') THEN 1 ELSE 0 END AS renewal_due
        FROM contracts k JOIN clients c ON c.id = k.client_id ORDER BY renewal_due DESC, k.end_date IS NULL, k.end_date")->fetchAll();
    return ['items' => $rows];
});

$router->add('POST', 'contracts', $contractRoles, function () {
    $data = contract_data(body());
    if (empty($data['client_id']) || empty($data['title'])) {
        throw new ApiError('Client and title are required.', 422);
    }
    $id = insert('contracts', $data + (store_upload('file', 'contracts') ?? []));
    audit('create', 'contract', $id);
    return ['contract' => find_or_404('contracts', $id, 'Contract')];
});

$router->add('PUT', 'contracts/{id}', $contractRoles, function ($p) {
    $id = id_param($p);
    $before = find_or_404('contracts', $id, 'Contract');
    $data = contract_data(body());
    if ($file = store_upload('file', 'contracts')) {
        delete_upload($before['file_path']);
        $data += $file;
    }
    update('contracts', $id, $data);
    audit('update', 'contract', $id);
    return ['contract' => find_or_404('contracts', $id, 'Contract')];
});

$router->add('DELETE', 'contracts/{id}', [ROLE_ADMIN], function ($p) {
    $c = find_or_404('contracts', id_param($p), 'Contract');
    delete_upload($c['file_path']);
    q('DELETE FROM contracts WHERE id = ?', [$c['id']]);
    audit('delete', 'contract', (int) $c['id']);
});

$router->add('GET', 'contracts/{id}/file', $contractRoles, function ($p) {
    $c = find_or_404('contracts', id_param($p), 'Contract');
    send_file($c['file_path'], $c['file_name']);
});
