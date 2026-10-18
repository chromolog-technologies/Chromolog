<?php

declare(strict_types=1);

require __DIR__ . '/src/bootstrap.php';

/**
 * Chromolog Growth Control Panel: baseline metrics, leads pipeline, chat transcripts.
 */

const STATUSES = ['new', 'contacted', 'meeting', 'proposal', 'won', 'lost', 'spam'];

session_set_cookie_params(['httponly' => true, 'secure' => !empty($_SERVER['HTTPS']), 'samesite' => 'Strict']);
session_start();
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function csrf(): string
{
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(16));
}

function check_csrf(): void
{
    if (!hash_equals(csrf(), (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Invalid request');
    }
}

// ── Auth ───────────────────────────────────────────────────────────────
$action = $_GET['a'] ?? 'dashboard';

if ($action === 'logout') {
    session_destroy();
    header('Location: admin.php');
    exit;
}

if (empty($_SESSION['admin'])) {
    $error = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_csrf();
        $hash = config()['admin_password_hash'];
        sleep(1); // slow down guessing
        if ($hash !== '' && password_verify((string) ($_POST['password'] ?? ''), $hash)) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            header('Location: admin.php');
            exit;
        }
        $error = 'Wrong password';
    }
    page('Sign in', '<form method="post" class="card login"><h2>Chromolog Growth OS</h2>'
        . ($error ? '<p class="err">' . e($error) . '</p>' : '')
        . '<input type="hidden" name="csrf" value="' . csrf() . '">'
        . '<input type="password" name="password" placeholder="Admin password" autofocus required>'
        . '<button>Sign in</button></form>', false);
}

$pdo = db();

// ── Actions ────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update') {
    check_csrf();
    $status = in_array($_POST['status'] ?? '', STATUSES, true) ? $_POST['status'] : 'new';
    $pdo->prepare('UPDATE leads SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([$status, (string) ($_POST['notes'] ?? ''), (int) ($_POST['id'] ?? 0)]);
    header('Location: admin.php?a=lead&id=' . (int) $_POST['id']);
    exit;
}

if ($action === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="chromolog_leads_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    $rows = $pdo->query('SELECT * FROM leads ORDER BY id DESC')->fetchAll();
    fputcsv($out, array_keys($rows[0] ?? ['id' => '']), escape: '');
    foreach ($rows as $r) {
        fputcsv($out, $r, escape: '');
    }
    exit;
}

if ($action === 'lead') {
    $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = ?');
    $stmt->execute([(int) ($_GET['id'] ?? 0)]);
    $lead = $stmt->fetch() ?: exit('Not found');
    $msgs = $pdo->prepare('SELECT role, text, created_at FROM messages WHERE session_id = ? ORDER BY id');
    $msgs->execute([$lead['session_id']]);

    $html = '<p><a href="admin.php">← All leads</a></p><div class="grid2"><div class="card"><h2>' . e($lead['full_name']) . '</h2><table>';
    foreach (['score', 'email', 'phone', 'company', 'role', 'industry', 'location', 'service_interest', 'budget_range', 'timeline', 'summary', 'created_at'] as $f) {
        $html .= '<tr><th>' . e(str_replace('_', ' ', $f)) . '</th><td>' . e($lead[$f]) . '</td></tr>';
    }
    $html .= '</table><form method="post" action="admin.php?a=update"><input type="hidden" name="csrf" value="' . csrf() . '">'
        . '<input type="hidden" name="id" value="' . (int) $lead['id'] . '"><label>Status <select name="status">';
    foreach (STATUSES as $s) {
        $html .= '<option' . ($s === $lead['status'] ? ' selected' : '') . '>' . $s . '</option>';
    }
    $html .= '</select></label><label>Notes<textarea name="notes" rows="4">' . e($lead['notes']) . '</textarea></label><button>Save</button></form></div>'
        . '<div class="card"><h2>Conversation</h2>';
    foreach ($msgs->fetchAll() as $m) {
        $html .= '<div class="msg ' . e($m['role']) . '"><small>' . e($m['role']) . ' · ' . e($m['created_at']) . '</small>' . nl2br(e($m['text'])) . '</div>';
    }
    page('Lead', $html . '</div></div>');
}

if ($action === 'chats') {
    $rows = $pdo->query("SELECT c.session_id, c.page, c.turns, c.updated_at, l.id AS lead_id,
        (SELECT text FROM messages m WHERE m.session_id = c.session_id AND m.role = 'user' ORDER BY id LIMIT 1) AS first_msg
        FROM conversations c LEFT JOIN leads l ON l.session_id = c.session_id ORDER BY c.updated_at DESC LIMIT 200")->fetchAll();
    $html = '<div class="card"><h2>Recent conversations</h2><table><tr><th>When</th><th>Page</th><th>Turns</th><th>First message</th><th>Lead</th></tr>';
    foreach ($rows as $r) {
        $html .= '<tr><td>' . e($r['updated_at']) . '</td><td>' . e($r['page']) . '</td><td>' . (int) $r['turns'] . '</td><td>'
            . '<a href="admin.php?a=chat&s=' . e($r['session_id']) . '">' . e(mb_strimwidth((string) $r['first_msg'], 0, 90, '…')) . '</a></td><td>'
            . ($r['lead_id'] ? '<a href="admin.php?a=lead&id=' . (int) $r['lead_id'] . '">view</a>' : '–') . '</td></tr>';
    }
    page('Conversations', $html . '</table></div>');
}

if ($action === 'chat') {
    $msgs = $pdo->prepare('SELECT role, text, created_at FROM messages WHERE session_id = ? ORDER BY id');
    $msgs->execute([(string) ($_GET['s'] ?? '')]);
    $html = '<p><a href="admin.php?a=chats">← Conversations</a></p><div class="card">';
    foreach ($msgs->fetchAll() as $m) {
        $html .= '<div class="msg ' . e($m['role']) . '"><small>' . e($m['role']) . ' · ' . e($m['created_at']) . '</small>' . nl2br(e($m['text'])) . '</div>';
    }
    page('Conversation', $html . '</div>');
}

// ── Dashboard: baseline metrics + pipeline ─────────────────────────────
$count = fn (string $sql) => (int) $pdo->query($sql)->fetchColumn();
$windows = ['7 days' => '-7 days', '30 days' => '-30 days', 'All time' => '-100 years'];
$metrics = [];
foreach ($windows as $label => $w) {
    $metrics[$label] = [
        'Chats' => $count("SELECT COUNT(*) FROM conversations WHERE created_at > datetime('now', '{$w}')"),
        'Leads' => $count("SELECT COUNT(*) FROM leads WHERE created_at > datetime('now', '{$w}')"),
        'Hot leads' => $count("SELECT COUNT(*) FROM leads WHERE score = 'hot' AND created_at > datetime('now', '{$w}')"),
        'Meetings+' => $count("SELECT COUNT(*) FROM leads WHERE status IN ('meeting','proposal','won') AND created_at > datetime('now', '{$w}')"),
        'Won' => $count("SELECT COUNT(*) FROM leads WHERE status = 'won' AND created_at > datetime('now', '{$w}')"),
    ];
}
$tokens = $pdo->query("SELECT COALESCE(SUM(input_tokens),0) i, COALESCE(SUM(output_tokens),0) o FROM messages WHERE created_at > datetime('now', '-30 days')")->fetch();

$html = '<div class="card"><h2>Baseline</h2><table><tr><th></th>';
foreach (array_keys($windows) as $label) {
    $html .= '<th>' . e($label) . '</th>';
}
$html .= '</tr>';
foreach (array_keys($metrics['7 days']) as $k) {
    $html .= '<tr><th>' . e($k) . '</th>';
    foreach ($metrics as $m) {
        $html .= '<td>' . $m[$k] . '</td>';
    }
    $html .= '</tr>';
}
$all = $metrics['All time'];
$html .= '</table><p class="muted">Chat → lead conversion: ' . ($all['Chats'] ? round($all['Leads'] / $all['Chats'] * 100, 1) : 0)
    . '% · AI tokens (30 days): ' . number_format((int) $tokens['i']) . ' in / ' . number_format((int) $tokens['o']) . ' out</p></div>';

$filter = in_array($_GET['status'] ?? '', STATUSES, true) ? $_GET['status'] : null;
$stmt = $pdo->prepare('SELECT id, full_name, email, phone, company, industry, location, score, status, created_at FROM leads'
    . ($filter ? ' WHERE status = ?' : '') . ' ORDER BY id DESC LIMIT 300');
$stmt->execute($filter ? [$filter] : []);

$html .= '<div class="card"><h2>Leads</h2><p class="filters"><a href="admin.php">all</a>';
foreach (STATUSES as $s) {
    $html .= ' · <a href="admin.php?status=' . $s . '">' . $s . '</a>';
}
$html .= ' · <a href="admin.php?a=csv">export CSV</a></p><table><tr><th>Name</th><th>Score</th><th>Status</th><th>Contact</th><th>Company</th><th>Industry</th><th>Location</th><th>Created</th></tr>';
foreach ($stmt->fetchAll() as $l) {
    $html .= '<tr><td><a href="admin.php?a=lead&id=' . (int) $l['id'] . '">' . e($l['full_name']) . '</a></td>'
        . '<td><span class="pill ' . e($l['score']) . '">' . e($l['score']) . '</span></td><td>' . e($l['status']) . '</td>'
        . '<td>' . e($l['email']) . '<br>' . e($l['phone']) . '</td><td>' . e($l['company']) . '</td><td>' . e($l['industry']) . '</td>'
        . '<td>' . e($l['location']) . '</td><td>' . e($l['created_at']) . '</td></tr>';
}
page('Dashboard', $html . '</table></div>');

function page(string $title, string $body, bool $nav = true): never
{
    $navHtml = $nav ? '<nav><b>Chromolog Growth OS</b><a href="admin.php">Leads</a><a href="admin.php?a=chats">Conversations</a><a href="admin.php?a=logout">Sign out</a></nav>' : '';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . e($title) . ' · Chromolog Growth OS</title><style>'
        . ':root{--bg:#0b0d12;--card:#141821;--line:#262c38;--text:#e7eaf0;--muted:#8b93a3;--accent:#7c5cff}'
        . 'body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 system-ui,sans-serif}'
        . 'nav{display:flex;gap:20px;align-items:center;padding:14px 24px;border-bottom:1px solid var(--line)}nav a{color:var(--muted);text-decoration:none}'
        . 'main{max-width:1200px;margin:0 auto;padding:24px 16px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:20px;overflow-x:auto}'
        . 'h2{margin:0 0 12px;font-size:16px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top}'
        . 'th{color:var(--muted);font-weight:500}a{color:#a99bff}.muted,.filters{color:var(--muted)}'
        . '.pill{padding:2px 8px;border-radius:99px;font-size:12px;background:#333}.hot{background:#5c1f2a;color:#ff9aa8}.warm{background:#5a4214;color:#ffd27a}.cold{background:#1d3550;color:#8fc4ff}'
        . 'input,select,textarea,button{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:#0f1218;color:var(--text);width:100%;box-sizing:border-box;margin:6px 0 12px}'
        . 'button{background:var(--accent);border:0;cursor:pointer;width:auto;padding:8px 18px}.login{max-width:340px;margin:12vh auto}.err{color:#ff8a8a}'
        . '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media(max-width:800px){.grid2{grid-template-columns:1fr}}'
        . '.msg{padding:10px 12px;border-radius:10px;margin-bottom:10px;background:#1b2030}.msg.user{background:#25204a}.msg small{display:block;color:var(--muted);margin-bottom:4px}'
        . '</style></head><body>' . $navHtml . '<main>' . $body . '</main></body></html>';
    exit;
}
