<?php

declare(strict_types=1);

/**
 * Invoicing rules shared by invoices, credit/debit notes, quotations and recurring templates:
 * GST line maths, document numbering, company/customer snapshots, the locked edit history,
 * amount in words, PDF rendering and spreadsheet export.
 *
 * Drafts carry a placeholder number (DRAFT-<id>) and always show the live company details.
 * Issuing assigns the next number in sequence and freezes the company and customer details
 * on the invoice, so later changes to settings or the customer record don't alter it.
 */

use Dompdf\Dompdf;
use Dompdf\Options;

/** GST state codes (place of supply). 96 = outside India (exports). */
const GST_STATES = [
    '01' => 'Jammu & Kashmir', '02' => 'Himachal Pradesh', '03' => 'Punjab', '04' => 'Chandigarh',
    '05' => 'Uttarakhand', '06' => 'Haryana', '07' => 'Delhi', '08' => 'Rajasthan', '09' => 'Uttar Pradesh',
    '10' => 'Bihar', '11' => 'Sikkim', '12' => 'Arunachal Pradesh', '13' => 'Nagaland', '14' => 'Manipur',
    '15' => 'Mizoram', '16' => 'Tripura', '17' => 'Meghalaya', '18' => 'Assam', '19' => 'West Bengal',
    '20' => 'Jharkhand', '21' => 'Odisha', '22' => 'Chhattisgarh', '23' => 'Madhya Pradesh', '24' => 'Gujarat',
    '26' => 'Dadra & Nagar Haveli and Daman & Diu', '27' => 'Maharashtra', '29' => 'Karnataka', '30' => 'Goa',
    '31' => 'Lakshadweep', '32' => 'Kerala', '33' => 'Tamil Nadu', '34' => 'Puducherry',
    '35' => 'Andaman & Nicobar Islands', '36' => 'Telangana', '37' => 'Andhra Pradesh', '38' => 'Ladakh',
    '97' => 'Other Territory', '96' => 'Outside India (export)',
];

/** intra = CGST + SGST, inter = IGST, exempt = GST-exempt supply, non_gst = seller not registered. */
const SUPPLY_TYPES = ['intra', 'inter', 'exempt', 'non_gst'];
const DOC_TYPES = ['invoice', 'credit_note', 'debit_note'];
const DOC_TITLES = ['invoice' => 'Invoice', 'credit_note' => 'Credit Note', 'debit_note' => 'Debit Note', 'quotation' => 'Quotation'];
const DOC_PREFIX_SETTINGS = ['invoice' => 'invoice_prefix', 'credit_note' => 'credit_note_prefix', 'debit_note' => 'debit_note_prefix'];

/** Invoices that still have money to collect. */
const OPEN_INVOICE_SQL = "doc_type = 'invoice' AND status IN ('issued','partially_paid','overdue')";
const BALANCE_SQL = '(total + adjustment - amount_paid)';

/** Company details printed on invoices; frozen on each invoice when it is issued. */
const COMMON_INVOICE_KEYS = [
    'company_name' => 'Company name', 'company_address' => 'Address', 'company_email' => 'Email',
    'company_phone' => 'Phone', 'company_website' => 'Website', 'tax_id' => 'GSTIN', 'company_pan' => 'PAN',
    'company_state' => 'State', 'bank_account_name' => 'Account name', 'bank_name' => 'Bank',
    'bank_branch' => 'Branch', 'bank_account_number' => 'Account number', 'bank_ifsc' => 'IFSC',
    'upi_id' => 'UPI ID', 'bank_details' => 'Other payment details', 'payment_methods' => 'Accepted payment methods',
    'invoice_declaration' => 'Declaration', 'signatory_name' => 'Signatory', 'signatory_title' => 'Signatory title',
    'thank_you_message' => 'Thank-you message', 'logo_file' => 'Logo', 'seal_file' => 'Company seal',
    'signature_file' => 'Signature', 'upi_qr_file' => 'UPI QR code',
];
const BRANDING_KINDS = ['logo' => 'logo_file', 'seal' => 'seal_file', 'signature' => 'signature_file', 'upi_qr' => 'upi_qr_file'];

const ITEM_COLUMNS = 'service_id, description, hsn_sac, unit, quantity, unit_price, amount, discount, gst_rate, taxable_value, cgst, sgst, igst, line_total';

function tax_enabled(): bool
{
    return setting('tax_enabled') === '1';
}

/** Place of supply and tax type from the request, defaulting from the customer's state. */
function supply_in(array $b, ?string $customerState): array
{
    $pos = str_in($b, 'place_of_supply', 2) ?? ($customerState ?: setting('company_state'));
    if (!isset(GST_STATES[$pos])) {
        throw new ApiError('Choose a valid place of supply.', 422);
    }
    if (!tax_enabled()) {
        return ['supply_type' => 'non_gst', 'place_of_supply' => $pos, 'reverse_charge' => 0];
    }
    $type = (string) ($b['supply_type'] ?? '');
    if (!in_array($type, ['intra', 'inter', 'exempt'], true)) {
        $type = $pos === setting('company_state') ? 'intra' : 'inter';
    }
    $reverse = !empty($b['reverse_charge']) && $type !== 'exempt' ? 1 : 0;
    return ['supply_type' => $type, 'place_of_supply' => $pos, 'reverse_charge' => $reverse];
}

/**
 * Validate line items and work out GST per line. Discount is an amount per line; GST applies to
 * the value after discount. Under reverse charge the tax is shown but not added to the total
 * (the customer pays it to the government).
 * @return array{items: list<array>, totals: array<string, float>}
 */
function gst_lines(array $b, array $supply): array
{
    $type = $supply['supply_type'];
    $items = [];
    foreach (array_values((array) ($b['items'] ?? [])) as $i => $row) {
        $row = (array) $row;
        $desc = str_in($row, 'description', 1000);
        if ($desc === null) {
            continue;
        }
        $qty = num_in($row, 'quantity', 1, 0);
        $rate = num_in($row, 'unit_price', 0, 0);
        $amount = money($qty * $rate);
        $discount = min(num_in($row, 'discount', 0, 0), $amount);
        $gst = in_array($type, ['intra', 'inter'], true) ? num_in($row, 'gst_rate', 0, 0) : 0.0;
        if ($gst > 28) {
            throw new ApiError('GST rate cannot be more than 28%.', 422);
        }
        $taxable = money($amount - $discount);
        $cgst = $sgst = $igst = 0.0;
        if ($type === 'intra') {
            $cgst = $sgst = money($taxable * $gst / 200);
        } elseif ($type === 'inter') {
            $igst = money($taxable * $gst / 100);
        }
        $items[] = [
            'service_id' => ($row['service_id'] ?? null) ? (int) $row['service_id'] : null,
            'description' => $desc,
            'hsn_sac' => str_in($row, 'hsn_sac', 20),
            'unit' => str_in($row, 'unit', 20),
            'quantity' => $qty, 'unit_price' => $rate, 'amount' => $amount, 'discount' => $discount,
            'gst_rate' => $gst, 'taxable_value' => $taxable, 'cgst' => $cgst, 'sgst' => $sgst, 'igst' => $igst,
            'line_total' => money($taxable + $cgst + $sgst + $igst),
            'position' => $i,
        ];
    }
    if (!$items) {
        throw new ApiError('Add at least one line item.', 422);
    }
    $sum = fn (string $k) => money(array_sum(array_column($items, $k)));
    $tax = money($sum('cgst') + $sum('sgst') + $sum('igst'));
    $taxable = $sum('taxable_value');
    return ['items' => $items, 'totals' => [
        'subtotal' => $sum('amount'), 'discount' => $sum('discount'), 'taxable_value' => $taxable,
        'cgst' => $sum('cgst'), 'sgst' => $sum('sgst'), 'igst' => $sum('igst'), 'tax_total' => $tax, 'tax_rate' => 0.0,
        'total' => money($taxable + ($supply['reverse_charge'] ? 0 : $tax)),
    ]];
}

function save_lines(string $table, string $fk, int $docId, array $items): void
{
    q("DELETE FROM {$table} WHERE {$fk} = ?", [$docId]);
    foreach ($items as $it) {
        insert($table, [$fk => $docId] + $it);
    }
}

function document_items(string $table, string $fk, int $id): array
{
    return q('SELECT ' . ITEM_COLUMNS . " FROM {$table} WHERE {$fk} = ? ORDER BY position", [$id])->fetchAll();
}

// ── Numbering ───────────────────────────────────────────────────────────

/** Indian financial year of a date, e.g. 2026-10-24 → "26-27". */
function financial_year(string $date): string
{
    [$y, $m] = array_map('intval', explode('-', $date));
    $start = $m >= 4 ? $y : $y - 1;
    return sprintf('%02d-%02d', $start % 100, ($start + 1) % 100);
}

/** @return array{string, string, bool} series key, prefix, includes financial year */
function number_series(string $docType, string $date): array
{
    $prefix = trim(setting(DOC_PREFIX_SETTINGS[$docType])) ?: strtoupper(substr($docType, 0, 3));
    $useFy = setting('invoice_number_fy') === '1';
    return ["{$docType}|{$prefix}|" . ($useFy ? financial_year($date) : ''), $prefix, $useFy];
}

function format_doc_number(string $prefix, bool $useFy, string $date, int $n): string
{
    return $useFy ? sprintf('%s/%s/%04d', $prefix, financial_year($date), $n) : sprintf('%s/%04d', $prefix, $n);
}

/**
 * Take the next number in the series. The caller holds the write lock (see transaction()),
 * so two people issuing at once can't get the same number, and the counter only moves forward:
 * numbers of issued or cancelled invoices are never reused.
 */
function allocate_doc_number(string $docType, string $date): string
{
    [$series, $prefix, $useFy] = number_series($docType, $date);
    $n = (int) q('SELECT last_number FROM doc_sequences WHERE series = ?', [$series])->fetchColumn() + 1;
    while (q('SELECT 1 FROM invoices WHERE number = ?', [format_doc_number($prefix, $useFy, $date, $n)])->fetchColumn()) {
        $n++;
    }
    q('INSERT INTO doc_sequences (series, last_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_number = VALUES(last_number)', [$series, $n]);
    return format_doc_number($prefix, $useFy, $date, $n);
}

/** The number the next issued document would get (preview only). */
function peek_doc_number(string $docType, string $date): string
{
    [$series, $prefix, $useFy] = number_series($docType, $date);
    $n = (int) q('SELECT last_number FROM doc_sequences WHERE series = ?', [$series])->fetchColumn() + 1;
    return format_doc_number($prefix, $useFy, $date, $n);
}

/** Start the current invoice series at $start (never moves backwards). */
function bump_invoice_sequence(int $start): void
{
    [$series] = number_series('invoice', today());
    q('INSERT INTO doc_sequences (series, last_number) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_number = GREATEST(last_number, VALUES(last_number))', [$series, max(0, $start - 1)]);
}

// ── Snapshots ───────────────────────────────────────────────────────────

function company_snapshot(): array
{
    $s = settings_all();
    $snap = [];
    foreach (array_keys(COMMON_INVOICE_KEYS) as $k) {
        $snap[$k] = (string) ($s[$k] ?? '');
    }
    foreach (['tax_label', 'currency', 'currency_symbol', 'tax_enabled'] as $k) {
        $snap[$k] = (string) ($s[$k] ?? '');
    }
    return $snap;
}

function client_snapshot(int $clientId): array
{
    $c = find_or_404('clients', $clientId, 'Client');
    return [
        'name' => $c['name'], 'company' => $c['company'], 'email' => $c['email'], 'phone' => $c['phone'],
        'address' => $c['address'], 'tax_id' => $c['tax_id'], 'state_code' => $c['state_code'] ?? null,
    ];
}

/** Invoice or note with items, resolved company/customer details and balance. */
function invoice_full(int $id): array
{
    $inv = find_or_404('invoices', $id, 'Invoice');
    $live = company_snapshot();
    $inv['company'] = $inv['company_snapshot'] ? (json_decode($inv['company_snapshot'], true) ?: []) + $live : $live;
    $inv['client'] = $inv['client_snapshot'] ? json_decode($inv['client_snapshot'], true) : client_snapshot((int) $inv['client_id']);
    unset($inv['company_snapshot'], $inv['client_snapshot']);
    $inv['items'] = document_items('invoice_items', 'invoice_id', $id);
    $inv['balance'] = $inv['doc_type'] === 'invoice' ? money((float) $inv['total'] + (float) $inv['adjustment'] - (float) $inv['amount_paid']) : 0.0;
    $inv['amount_in_words'] = amount_in_words((float) $inv['total'], $inv['company']['currency'] ?? 'INR');
    $inv['is_draft'] = $inv['status'] === 'draft';
    if ($inv['original_invoice_id']) {
        $inv['original'] = q('SELECT id, number, issue_date FROM invoices WHERE id = ?', [$inv['original_invoice_id']])->fetch() ?: null;
    }
    return $inv;
}

// ── Status ──────────────────────────────────────────────────────────────

/** Recalculate paid amount and status from payments, credit/debit notes and the due date. */
function refresh_invoice_status(int $id): void
{
    $inv = find_or_404('invoices', $id, 'Invoice');
    $paid = money((float) q('SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id = ?', [$id])->fetchColumn());
    $status = $inv['status'];
    if ($inv['doc_type'] === 'invoice' && !in_array($status, ['draft', 'cancelled'], true)) {
        $due = money((float) $inv['total'] + (float) $inv['adjustment']);
        $status = match (true) {
            $paid + 0.005 >= $due => 'paid',
            $inv['due_date'] && $inv['due_date'] < today() => 'overdue',
            $paid > 0 => 'partially_paid',
            default => 'issued',
        };
    }
    update('invoices', $id, ['amount_paid' => $paid, 'status' => $status]);
}

/** Issued credit notes reduce, and debit notes increase, the amount due on the original invoice. */
function refresh_note_adjustments(int $invoiceId): void
{
    $adj = (float) q("SELECT COALESCE(SUM(CASE doc_type WHEN 'debit_note' THEN total ELSE -total END),0)
        FROM invoices WHERE original_invoice_id = ? AND status = 'issued'", [$invoiceId])->fetchColumn();
    update('invoices', $invoiceId, ['adjustment' => money($adj)]);
    refresh_invoice_status($invoiceId);
}

/** Move unpaid invoices past their due date to overdue (and back if the due date moved). */
function sync_overdue(): void
{
    q("UPDATE invoices SET status = 'overdue' WHERE doc_type = 'invoice' AND status IN ('issued','partially_paid') AND due_date < ?", [today()]);
    q("UPDATE invoices SET status = CASE WHEN amount_paid > 0 THEN 'partially_paid' ELSE 'issued' END
        WHERE status = 'overdue' AND (due_date IS NULL OR due_date >= ?)", [today()]);
}

// ── Edit history (cannot be changed or deleted; enforced by database triggers) ──

/**
 * Record an event on an invoice. With $snapshot, the full invoice as it now stands is stored
 * with the entry, plus a PDF copy, so every issued version is kept permanently.
 */
function invoice_log(int $invoiceId, string $action, ?string $reason = null, array $changes = [], bool $snapshot = false): void
{
    $user = current_user();
    $snap = null;
    $pdf = null;
    if ($snapshot) {
        $doc = invoice_full($invoiceId);
        $snap = json_encode($doc, JSON_UNESCAPED_UNICODE);
        $pdf = store_invoice_pdf($doc);
    }
    insert('invoice_history', [
        'invoice_id' => $invoiceId, 'action' => $action, 'reason' => $reason,
        'changes' => $changes ? json_encode($changes, JSON_UNESCAPED_UNICODE) : null,
        'snapshot' => $snap, 'pdf_path' => $pdf,
        'user_id' => $user['id'] ?? null, 'user_name' => $user['name'] ?? 'System',
    ]);
}

const INVOICE_DIFF_FIELDS = [
    'customer' => 'Customer', 'issue_date' => 'Invoice date', 'due_date' => 'Due date', 'po_number' => 'PO / work order no.',
    'place_of_supply' => 'Place of supply', 'supply_type' => 'Tax type', 'reverse_charge' => 'Reverse charge',
    'note_reason' => 'Reason for note', 'notes' => 'Notes', 'terms' => 'Terms', 'subtotal' => 'Subtotal',
    'discount' => 'Discount', 'tax_total' => 'Tax', 'total' => 'Grand total',
];
const LINE_DIFF_FIELDS = [
    'description' => 'Description', 'hsn_sac' => 'HSN/SAC', 'unit' => 'Unit', 'quantity' => 'Qty',
    'unit_price' => 'Rate', 'discount' => 'Discount', 'gst_rate' => 'GST %',
];
const SUPPLY_LABELS = ['intra' => 'CGST + SGST', 'inter' => 'IGST', 'exempt' => 'GST exempt', 'non_gst' => 'Non-GST'];

function diff_value(mixed $v): string
{
    if (is_int($v) || is_float($v) || (is_string($v) && is_numeric($v) && !preg_match('/^0\d/', $v))) {
        return (string) (0 + $v);
    }
    return trim((string) ($v ?? ''));
}

function line_summary(array $it): string
{
    return sprintf('%s × %s @ %s', $it['description'], diff_value($it['quantity']), diff_value($it['unit_price']));
}

/** Field-by-field changes between two versions of an invoice (old and new values). */
function invoice_diff(array $before, array $after): array
{
    // Compare what people read (names), not internal codes.
    $view = fn (array $d) => array_merge($d, [
        'customer' => ($d['client']['company'] ?? '') ?: ($d['client']['name'] ?? ''),
        'place_of_supply' => GST_STATES[$d['place_of_supply']] ?? (string) $d['place_of_supply'],
        'supply_type' => SUPPLY_LABELS[$d['supply_type']] ?? (string) $d['supply_type'],
        'reverse_charge' => $d['reverse_charge'] ? 'Yes' : 'No',
    ]);
    $b = $view($before);
    $a = $view($after);
    $changes = [];
    foreach (INVOICE_DIFF_FIELDS as $f => $label) {
        $old = diff_value($b[$f] ?? '');
        $new = diff_value($a[$f] ?? '');
        if ($old !== $new) {
            $changes[] = ['field' => $label, 'old' => $old, 'new' => $new];
        }
    }
    $bi = $before['items'];
    $ai = $after['items'];
    for ($i = 0, $n = max(count($bi), count($ai)); $i < $n; $i++) {
        $line = 'Line ' . ($i + 1);
        if (!isset($ai[$i])) {
            $changes[] = ['field' => $line, 'old' => line_summary($bi[$i]), 'new' => '(removed)'];
        } elseif (!isset($bi[$i])) {
            $changes[] = ['field' => $line, 'old' => '(added)', 'new' => line_summary($ai[$i])];
        } else {
            foreach (LINE_DIFF_FIELDS as $f => $label) {
                $old = diff_value($bi[$i][$f] ?? '');
                $new = diff_value($ai[$i][$f] ?? '');
                if ($old !== $new) {
                    $changes[] = ['field' => "{$line} · {$label}", 'old' => $old, 'new' => $new];
                }
            }
        }
    }
    return $changes;
}

// ── Amount in words ─────────────────────────────────────────────────────

function words_below_thousand(int $n): string
{
    static $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
        'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    static $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    $parts = [];
    if ($n >= 100) {
        $parts[] = $ones[intdiv($n, 100)] . ' Hundred';
        $n %= 100;
    }
    if ($n >= 20) {
        $parts[] = $tens[intdiv($n, 10)] . ($n % 10 ? ' ' . $ones[$n % 10] : '');
    } elseif ($n > 0) {
        $parts[] = $ones[$n];
    }
    return implode(' ', $parts);
}

/** Indian system: crore, lakh, thousand. */
function words_indian(int $n): string
{
    if ($n === 0) {
        return 'Zero';
    }
    $parts = [];
    foreach ([10000000 => 'Crore', 100000 => 'Lakh', 1000 => 'Thousand'] as $size => $name) {
        if ($n >= $size) {
            $parts[] = ($size === 10000000 ? words_indian(intdiv($n, $size)) : words_below_thousand(intdiv($n, $size))) . " {$name}";
            $n %= $size;
        }
    }
    if ($n > 0) {
        $parts[] = words_below_thousand($n);
    }
    return implode(' ', $parts);
}

function words_international(int $n): string
{
    if ($n === 0) {
        return 'Zero';
    }
    $parts = [];
    foreach ([1000000000 => 'Billion', 1000000 => 'Million', 1000 => 'Thousand'] as $size => $name) {
        if ($n >= $size) {
            $parts[] = words_international(intdiv($n, $size)) . " {$name}";
            $n %= $size;
        }
    }
    if ($n > 0) {
        $parts[] = words_below_thousand($n);
    }
    return implode(' ', $parts);
}

function amount_in_words(float $amount, string $currency): string
{
    [$major, $minor] = ['INR' => ['Rupees', 'Paise'], 'AED' => ['UAE Dirhams', 'Fils'], 'USD' => ['US Dollars', 'Cents']][$currency] ?? [$currency, 'Cents'];
    $cents = (int) round(abs($amount) * 100);
    $whole = intdiv($cents, 100);
    $fraction = $cents % 100;
    $words = $currency === 'INR' ? words_indian($whole) : words_international($whole);
    $text = "{$major} {$words}" . ($fraction ? ' and ' . words_below_thousand($fraction) . " {$minor}" : '') . ' Only';
    return ($amount < 0 ? 'Minus ' : '') . $text;
}

function format_money(float $n, array $company): string
{
    $neg = $n < 0;
    $fixed = number_format(abs($n), 2, '.', '');
    [$int, $dec] = explode('.', $fixed);
    if (($company['currency'] ?? 'INR') === 'INR' && strlen($int) > 3) {
        $int = preg_replace('/\B(?=(\d{2})+(?!\d))/', ',', substr($int, 0, -3)) . ',' . substr($int, -3);
    } else {
        $int = number_format((float) $int, 0, '.', ',');
    }
    return ($neg ? '-' : '') . ($company['currency_symbol'] ?? '') . "{$int}.{$dec}";
}

// ── Branding images ─────────────────────────────────────────────────────

const IMAGE_TYPES = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp'];

function image_data_uri(?string $relPath): ?string
{
    if (!$relPath) {
        return null;
    }
    $full = realpath(upload_root() . '/' . $relPath);
    $ext = strtolower(pathinfo((string) $full, PATHINFO_EXTENSION));
    if (!$full || !str_starts_with($full, realpath(upload_root()) . '/') || !is_file($full) || !isset(IMAGE_TYPES[$ext])) {
        return null;
    }
    return 'data:' . IMAGE_TYPES[$ext] . ';base64,' . base64_encode((string) file_get_contents($full));
}

// ── PDF ─────────────────────────────────────────────────────────────────

function e_html(mixed $s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES, 'UTF-8');
}

/** Document title: GST invoices are "Tax Invoice", exempt supplies a "Bill of Supply". */
function document_title(string $kind, string $supplyType): string
{
    if ($kind === 'invoice') {
        return match ($supplyType) {
            'intra', 'inter' => 'Tax Invoice',
            'exempt' => 'Bill of Supply',
            default => 'Invoice',
        };
    }
    return DOC_TITLES[$kind] ?? 'Invoice';
}

/**
 * HTML for an invoice, note or quotation, laid out with tables for the PDF engine.
 * $doc: invoice_full() output, or a quotation with the same keys and kind 'quotation'.
 */
function document_html(array $doc, string $kind): string
{
    $c = $doc['company'];
    $cl = $doc['client'];
    $m = fn ($n) => e_html(format_money((float) $n, $c));
    $taxed = in_array($doc['supply_type'] ?? '', ['intra', 'inter'], true);
    $intra = ($doc['supply_type'] ?? '') === 'intra';
    $items = $doc['items'];
    $hasDiscount = array_sum(array_map(fn ($i) => (float) $i['discount'], $items)) > 0;
    $hasHsn = (bool) array_filter(array_column($items, 'hsn_sac'));
    $title = document_title($kind, (string) ($doc['supply_type'] ?? ''));
    $isInvoice = $kind === 'invoice';
    $logo = image_data_uri($c['logo_file'] ?? null);
    $seal = image_data_uri($c['seal_file'] ?? null);
    $sign = image_data_uri($c['signature_file'] ?? null);
    $qr = image_data_uri($c['upi_qr_file'] ?? null);
    $state = fn (?string $code) => $code && isset(GST_STATES[$code]) ? GST_STATES[$code] . ($code !== '96' ? " ({$code})" : '') : '';

    ob_start(); ?>
<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { margin: 28px 30px 36px; }
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 8.6pt; color: #1e293b; }
  table { border-collapse: collapse; width: 100%; }
  td, th { vertical-align: top; }
  .muted { color: #64748b; }
  .small { font-size: 7.6pt; }
  .right { text-align: right; }
  .center { text-align: center; }
  .title { font-size: 15pt; font-weight: bold; color: #4338ca; letter-spacing: 1px; text-transform: uppercase; }
  .company { font-size: 12pt; font-weight: bold; color: #0f172a; }
  .box { border: 1px solid #cbd5e1; padding: 7px 9px; }
  .label { font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
  .items th { background: #eef2ff; color: #334155; font-size: 7.4pt; padding: 5px 4px; border: 1px solid #c7d2fe; }
  .items td { padding: 5px 4px; border: 1px solid #e2e8f0; }
  .totals td { padding: 3px 6px; }
  .grand td { font-weight: bold; font-size: 10pt; border-top: 1.5px solid #334155; padding-top: 5px; }
  .stamp { border: 2px solid #dc2626; color: #dc2626; font-weight: bold; font-size: 13pt; padding: 3px 10px; display: inline-block; }
  .draft { border-color: #64748b; color: #64748b; }
  .meta td { white-space: nowrap; padding: 2px 0 2px 10px; }
</style></head><body>

<table><tr>
  <td style="width:55%">
    <?php if ($logo): ?><img src="<?= $logo ?>" style="max-height:58px; max-width:190px; margin-bottom:6px"><br><?php endif; ?>
    <div class="company"><?= e_html($c['company_name']) ?></div>
    <div class="muted"><?= nl2br(e_html($c['company_address'])) ?></div>
    <div class="muted"><?= e_html(implode('  ·  ', array_filter([$c['company_phone'], $c['company_email']]))) ?></div>
    <?php if ($c['company_website']): ?><div class="muted"><?= e_html($c['company_website']) ?></div><?php endif; ?>
    <?php if ($c['tax_id']): ?><div><b>GSTIN:</b> <?= e_html($c['tax_id']) ?></div><?php endif; ?>
    <?php if ($c['company_pan']): ?><div><b>PAN:</b> <?= e_html($c['company_pan']) ?></div><?php endif; ?>
    <?php if ($taxed && $c['company_state']): ?><div><b>State:</b> <?= e_html($state($c['company_state'])) ?></div><?php endif; ?>
  </td>
  <td class="right">
    <div class="title"><?= e_html($title) ?></div>
    <?php if (($doc['status'] ?? '') === 'cancelled'): ?><div class="stamp" style="margin-top:4px">CANCELLED</div><?php endif; ?>
    <?php if (($doc['status'] ?? '') === 'draft' && $kind !== 'quotation'): ?><div class="stamp draft" style="margin-top:4px">DRAFT</div><?php endif; ?>
      <table class="totals meta" style="margin-top:6px">
        <tr><td class="muted"><?= $kind === 'quotation' ? 'Quotation no.' : 'Number' ?></td><td class="right"><b><?= e_html(($doc['status'] ?? '') === 'draft' && $kind !== 'quotation' ? 'Draft' : $doc['number']) ?></b></td></tr>
        <tr><td class="muted">Date</td><td class="right"><?= e_html(date('d M Y', strtotime($doc['issue_date']))) ?></td></tr>
        <?php if ($isInvoice && $doc['due_date']): ?><tr><td class="muted">Due date</td><td class="right"><?= e_html(date('d M Y', strtotime($doc['due_date']))) ?></td></tr><?php endif; ?>
        <?php if ($kind === 'quotation' && !empty($doc['valid_until'])): ?><tr><td class="muted">Valid until</td><td class="right"><?= e_html(date('d M Y', strtotime($doc['valid_until']))) ?></td></tr><?php endif; ?>
        <?php if (!empty($doc['po_number'])): ?><tr><td class="muted">PO / WO no.</td><td class="right"><?= e_html($doc['po_number']) ?></td></tr><?php endif; ?>
        <?php if ($taxed || ($doc['supply_type'] ?? '') === 'exempt'): ?><tr><td class="muted">Place of supply</td><td class="right"><?= e_html($state($doc['place_of_supply'])) ?></td></tr><?php endif; ?>
        <?php if ($taxed): ?><tr><td class="muted">Reverse charge</td><td class="right"><?= $doc['reverse_charge'] ? 'Yes' : 'No' ?></td></tr><?php endif; ?>
        <?php if (!empty($doc['original'])): ?><tr><td class="muted">Against invoice</td><td class="right"><?= e_html($doc['original']['number']) ?> (<?= e_html(date('d M Y', strtotime($doc['original']['issue_date']))) ?>)</td></tr><?php endif; ?>
      </table>
  </td>
</tr></table>

<table style="margin-top:12px"><tr>
  <td class="box" style="width:60%">
    <div class="label"><?= $kind === 'quotation' ? 'Prepared for' : 'Bill to' ?></div>
    <div style="font-weight:bold; font-size:9.6pt"><?= e_html($cl['company'] ?: $cl['name']) ?></div>
    <?php if ($cl['company'] && $cl['name']): ?><div>Attn: <?= e_html($cl['name']) ?></div><?php endif; ?>
    <?php if ($cl['address']): ?><div class="muted"><?= nl2br(e_html($cl['address'])) ?></div><?php endif; ?>
    <?php if ($cl['tax_id']): ?><div><b>GSTIN:</b> <?= e_html($cl['tax_id']) ?></div><?php endif; ?>
    <?php if (!empty($cl['state_code'])): ?><div><b>State:</b> <?= e_html($state($cl['state_code'])) ?></div><?php endif; ?>
    <div class="muted"><?= e_html(implode('  ·  ', array_filter([$cl['phone'], $cl['email']]))) ?></div>
  </td>
  <td style="width:2%"></td>
  <td class="box">
    <?php if ($kind === 'quotation' && !empty($doc['title'])): ?>
      <div class="label">Subject</div><div><?= e_html($doc['title']) ?></div>
    <?php elseif (!empty($doc['note_reason'])): ?>
      <div class="label">Reason</div><div><?= nl2br(e_html($doc['note_reason'])) ?></div>
    <?php else: ?>
      <div class="label">Amount <?= $isInvoice ? 'due' : '' ?></div>
      <div style="font-size:13pt; font-weight:bold"><?= $m($isInvoice ? $doc['balance'] : $doc['total']) ?></div>
      <?php if ($isInvoice && $doc['due_date'] && (float) $doc['balance'] > 0): ?><div class="muted">by <?= e_html(date('d M Y', strtotime($doc['due_date']))) ?></div><?php endif; ?>
    <?php endif; ?>
  </td>
</tr></table>

<table class="items" style="margin-top:12px">
  <thead><tr>
    <th style="width:4%">#</th>
    <th style="text-align:left">Description</th>
    <?php if ($hasHsn): ?><th style="width:9%">HSN/SAC</th><?php endif; ?>
    <th style="width:8%">Qty</th>
    <th class="right" style="width:11%">Rate</th>
    <?php if ($hasDiscount): ?><th class="right" style="width:9%">Discount</th><?php endif; ?>
    <?php if ($taxed): ?>
      <th class="right" style="width:11%">Taxable</th>
      <th class="right" style="width:6%">GST</th>
      <th class="right" style="width:9%">Tax</th>
    <?php endif; ?>
    <th class="right" style="width:12%">Amount</th>
  </tr></thead>
  <tbody>
  <?php foreach ($items as $i => $it): ?>
    <tr>
      <td class="center"><?= $i + 1 ?></td>
      <td><?= nl2br(e_html($it['description'])) ?></td>
      <?php if ($hasHsn): ?><td class="center"><?= e_html($it['hsn_sac']) ?></td><?php endif; ?>
      <td class="center"><?= e_html(diff_value($it['quantity'])) ?><?= $it['unit'] ? ' ' . e_html($it['unit']) : '' ?></td>
      <td class="right"><?= $m($it['unit_price']) ?></td>
      <?php if ($hasDiscount): ?><td class="right"><?= (float) $it['discount'] ? $m($it['discount']) : '—' ?></td><?php endif; ?>
      <?php if ($taxed): ?>
        <td class="right"><?= $m($it['taxable_value']) ?></td>
        <td class="right"><?= e_html(diff_value($it['gst_rate'])) ?>%</td>
        <td class="right"><?= $m((float) $it['cgst'] + (float) $it['sgst'] + (float) $it['igst']) ?></td>
      <?php endif; ?>
      <td class="right"><?= $m($taxed ? $it['line_total'] : $it['taxable_value']) ?></td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>

<table style="margin-top:8px"><tr>
  <td style="width:55%; padding-right:14px">
    <div class="label">Amount in words</div>
    <div style="font-weight:bold"><?= e_html($doc['amount_in_words']) ?></div>
    <?php if ($taxed):
        $rates = [];
        foreach ($items as $it) {
            $k = diff_value($it['gst_rate']);
            $rates[$k] ??= ['taxable' => 0, 'cgst' => 0, 'sgst' => 0, 'igst' => 0];
            foreach (['cgst', 'sgst', 'igst'] as $t) {
                $rates[$k][$t] += (float) $it[$t];
            }
            $rates[$k]['taxable'] += (float) $it['taxable_value'];
        } ?>
      <table class="items" style="margin-top:8px">
        <thead><tr><th>GST rate</th><th class="right">Taxable value</th>
          <?php if ($intra): ?><th class="right">CGST</th><th class="right">SGST</th><?php else: ?><th class="right">IGST</th><?php endif; ?>
        </tr></thead>
        <tbody><?php foreach ($rates as $rate => $r): ?>
          <tr><td class="center"><?= e_html($rate) ?>%</td><td class="right"><?= $m($r['taxable']) ?></td>
            <?php if ($intra): ?><td class="right"><?= $m($r['cgst']) ?></td><td class="right"><?= $m($r['sgst']) ?></td><?php else: ?><td class="right"><?= $m($r['igst']) ?></td><?php endif; ?>
          </tr>
        <?php endforeach; ?></tbody>
      </table>
    <?php endif; ?>
  </td>
  <td>
    <table class="totals">
      <tr><td class="muted">Subtotal</td><td class="right"><?= $m($doc['subtotal']) ?></td></tr>
      <?php if ((float) $doc['discount'] > 0): ?><tr><td class="muted">Discount</td><td class="right">-<?= $m($doc['discount']) ?></td></tr><?php endif; ?>
      <?php if ($taxed): ?>
        <tr><td class="muted">Taxable value</td><td class="right"><?= $m($doc['taxable_value']) ?></td></tr>
        <?php if ($intra): ?>
          <tr><td class="muted">CGST</td><td class="right"><?= $m($doc['cgst']) ?></td></tr>
          <tr><td class="muted">SGST</td><td class="right"><?= $m($doc['sgst']) ?></td></tr>
        <?php else: ?>
          <tr><td class="muted">IGST</td><td class="right"><?= $m($doc['igst']) ?></td></tr>
        <?php endif; ?>
      <?php elseif ((float) ($doc['tax_rate'] ?? 0) > 0): ?>
        <tr><td class="muted"><?= e_html($c['tax_label'] ?: 'Tax') ?> (<?= e_html(diff_value($doc['tax_rate'])) ?>%)</td><td class="right"><?= $m((float) $doc['total'] - ((float) $doc['subtotal'] - (float) $doc['discount'])) ?></td></tr>
      <?php endif; ?>
      <tr class="grand"><td>Grand total</td><td class="right"><?= $m($doc['total']) ?></td></tr>
      <?php if ($doc['reverse_charge'] ?? 0): ?><tr><td colspan="2" class="small muted">Tax of <?= $m($doc['tax_total']) ?> is payable by the recipient under reverse charge.</td></tr><?php endif; ?>
      <?php if ($isInvoice && (float) $doc['adjustment'] != 0): ?><tr><td class="muted">Credit/debit notes</td><td class="right"><?= $m($doc['adjustment']) ?></td></tr><?php endif; ?>
      <?php if ($isInvoice && (float) $doc['amount_paid'] > 0): ?><tr><td class="muted">Amount received</td><td class="right">-<?= $m($doc['amount_paid']) ?></td></tr><?php endif; ?>
      <?php if ($isInvoice && ((float) $doc['amount_paid'] > 0 || (float) $doc['adjustment'] != 0)): ?><tr><td><b>Balance due</b></td><td class="right"><b><?= $m($doc['balance']) ?></b></td></tr><?php endif; ?>
    </table>
  </td>
</tr></table>

<?php $bank = array_filter([
    'Account name' => $c['bank_account_name'], 'Bank' => trim($c['bank_name'] . ($c['bank_branch'] ? ', ' . $c['bank_branch'] : ''), ', '),
    'Account no.' => $c['bank_account_number'], 'IFSC' => $c['bank_ifsc'], 'UPI ID' => $c['upi_id'],
]); ?>
<?php if ($isInvoice && ($bank || $qr || $c['bank_details'] || $c['payment_methods'])): ?>
<table style="margin-top:12px"><tr>
  <td class="box">
    <div class="label">Payment details</div>
    <table><tr><td>
      <?php foreach ($bank as $k => $v): ?><div><span class="muted"><?= e_html($k) ?>:</span> <b><?= e_html($v) ?></b></div><?php endforeach; ?>
      <?php if ($c['bank_details']): ?><div class="muted" style="margin-top:3px"><?= nl2br(e_html($c['bank_details'])) ?></div><?php endif; ?>
      <?php if ($c['payment_methods']): ?><div style="margin-top:3px"><span class="muted">We accept:</span> <?= e_html($c['payment_methods']) ?></div><?php endif; ?>
      <?php if ($doc['due_date']): ?><div style="margin-top:3px"><span class="muted">Payment due by:</span> <?= e_html(date('d M Y', strtotime($doc['due_date']))) ?></div><?php endif; ?>
    </td>
    <?php if ($qr): ?><td style="width:90px" class="center"><img src="<?= $qr ?>" style="width:80px; height:80px"><div class="small muted">Scan to pay</div></td><?php endif; ?>
    </tr></table>
  </td>
</tr></table>
<?php endif; ?>

<table style="margin-top:12px"><tr>
  <td style="width:62%; padding-right:14px" class="small">
    <?php if (!empty($doc['notes'])): ?><div class="label">Notes</div><div style="margin-bottom:6px"><?= nl2br(e_html($doc['notes'])) ?></div><?php endif; ?>
    <?php if (!empty($doc['terms'])): ?><div class="label">Terms &amp; conditions</div><div class="muted" style="margin-bottom:6px"><?= nl2br(e_html($doc['terms'])) ?></div><?php endif; ?>
    <?php if ($kind !== 'quotation' && $c['invoice_declaration']): ?><div class="label">Declaration</div><div class="muted"><?= nl2br(e_html($c['invoice_declaration'])) ?></div><?php endif; ?>
  </td>
  <td class="center">
    <div class="small">For <b><?= e_html($c['company_name']) ?></b></div>
    <div style="height:70px; margin:4px 0">
      <?php if ($seal): ?><img src="<?= $seal ?>" style="max-height:66px; max-width:80px"><?php endif; ?>
      <?php if ($sign): ?><img src="<?= $sign ?>" style="max-height:52px; max-width:120px"><?php endif; ?>
    </div>
    <?php if ($c['signatory_name']): ?><div><b><?= e_html($c['signatory_name']) ?></b></div><?php endif; ?>
    <div class="small muted" style="border-top:1px solid #94a3b8; padding-top:2px"><?= e_html($c['signatory_title'] ?: 'Authorised Signatory') ?></div>
  </td>
</tr></table>

<?php if ($c['thank_you_message']): ?><div class="center" style="margin-top:14px; font-weight:bold; color:#4338ca"><?= e_html($c['thank_you_message']) ?></div><?php endif; ?>
<div class="center small muted" style="margin-top:6px">This is a computer-generated document.</div>
</body></html>
    <?php
    return (string) ob_get_clean();
}

function render_pdf(string $html): string
{
    $options = new Options();
    $options->set('defaultFont', 'DejaVu Sans');
    $options->set('isRemoteEnabled', false);
    $options->set('isPhpEnabled', false);
    $tmp = sys_get_temp_dir() . '/chromolog-dompdf';
    if (!is_dir($tmp)) {
        @mkdir($tmp, 0750, true);
    }
    $options->set('tempDir', $tmp);
    $options->set('fontCache', $tmp);
    $pdf = new Dompdf($options);
    $pdf->loadHtml($html, 'UTF-8');
    $pdf->setPaper('A4');
    $pdf->render();
    return (string) $pdf->output();
}

function invoice_pdf(array $doc): string
{
    return render_pdf(document_html($doc, $doc['doc_type']));
}

/** Save a permanent PDF copy of an invoice version; returns its path (null if it could not be made). */
function store_invoice_pdf(array $doc): ?string
{
    try {
        $dir = upload_root() . '/invoices/' . date('Y/m');
        if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
            throw new RuntimeException('Invoice folder is not writable');
        }
        $name = preg_replace('/[^A-Za-z0-9-]/', '_', (string) $doc['number']) . '_' . gmdate('Ymd-His') . '_' . bin2hex(random_bytes(3)) . '.pdf';
        file_put_contents("{$dir}/{$name}", invoice_pdf($doc));
        return substr("{$dir}/{$name}", strlen(upload_root()) + 1);
    } catch (Throwable $e) {
        error_log('Chromolog portal: invoice PDF not stored: ' . $e->getMessage());
        return null;
    }
}

function send_pdf(string $binary, string $filename, bool $download): never
{
    header('Content-Type: application/pdf');
    header('Content-Length: ' . strlen($binary));
    header('Content-Disposition: ' . ($download ? 'attachment' : 'inline') . '; filename="' . str_replace(['"', '/'], ['', '-'], $filename) . '"');
    echo $binary;
    exit;
}

// ── Spreadsheet export (CSV or Excel) ───────────────────────────────────

function xlsx_col(int $i): string
{
    $s = '';
    for ($i++; $i > 0; $i = intdiv($i - 1, 26)) {
        $s = chr(65 + ($i - 1) % 26) . $s;
    }
    return $s;
}

/** Minimal single-sheet .xlsx (bold header row) without external libraries. */
function xlsx_binary(array $headers, array $rows, string $sheet = 'Report'): string
{
    $x = fn ($v) => htmlspecialchars(preg_replace('/[^\x09\x0A\x0D\x20-\x{D7FF}\x{E000}-\x{FFFD}]/u', '', (string) $v), ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $xmlRows = [];
    foreach ([$headers, ...$rows] as $r => $row) {
        $cells = [];
        foreach (array_values($row) as $c => $v) {
            $ref = xlsx_col($c) . ($r + 1);
            if ($r > 0 && (is_int($v) || is_float($v))) {
                $cells[] = "<c r=\"{$ref}\"><v>{$v}</v></c>";
            } elseif ($v !== null && $v !== '') {
                $style = $r === 0 ? ' s="1"' : '';
                $cells[] = "<c r=\"{$ref}\" t=\"inlineStr\"{$style}><is><t xml:space=\"preserve\">{$x($v)}</t></is></c>";
            }
        }
        $xmlRows[] = '<row r="' . ($r + 1) . '">' . implode('', $cells) . '</row>';
    }
    $files = [
        '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
        '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' . $x(mb_substr($sheet, 0, 31)) . '" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
        'xl/styles.xml' => '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>',
        'xl/worksheets/sheet1.xml' => '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>' . implode('', $xmlRows) . '</sheetData></worksheet>',
    ];
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx');
    $zip = new ZipArchive();
    $zip->open($tmp, ZipArchive::OVERWRITE);
    foreach ($files as $name => $content) {
        $zip->addFromString($name, $content);
    }
    $zip->close();
    $data = (string) file_get_contents($tmp);
    @unlink($tmp);
    return $data;
}

/** Send rows as a CSV or Excel download. */
function export_rows(string $basename, array $headers, array $rows, string $format): never
{
    $rows = array_map(fn ($r) => csv_safe(array_values($r)), $rows);
    if ($format === 'xlsx') {
        $data = xlsx_binary($headers, $rows);
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Length: ' . strlen($data));
        header("Content-Disposition: attachment; filename=\"{$basename}.xlsx\"");
        echo $data;
        exit;
    }
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"{$basename}.csv\"");
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // Excel reads UTF-8 (₹, names) correctly with a BOM.
    fputcsv($out, $headers, escape: '');
    foreach ($rows as $r) {
        fputcsv($out, $r, escape: '');
    }
    exit;
}
