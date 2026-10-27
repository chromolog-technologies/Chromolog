<?php

declare(strict_types=1);

/** Expenses (bills paid), other income, and profit & loss. @var Router $router */

const MONEY_METHODS = ['bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'];

/**
 * Shared CRUD for the two ledgers. Both keep an optional uploaded bill/receipt.
 * $partyField is 'vendor' for expenses and 'source' for income.
 */
function ledger_routes(Router $router, string $route, string $table, string $partyField, string $label): void
{
    $roles = [ROLE_ACCOUNTS];

    $data = function (array $b, bool $creating) use ($partyField, $table): array {
        $d = [];
        if ($creating || array_key_exists('date', $b)) {
            $d['date'] = date_in($b, 'date') ?? today();
        }
        if ($creating || array_key_exists('category', $b)) {
            $d['category'] = str_in($b, 'category', 80, true);
        }
        if ($creating || array_key_exists('amount', $b)) {
            $amount = num_in($b, 'amount', null, 0.01);
            if ($amount === null) {
                throw new ApiError('Amount is required.', 422);
            }
            $d['amount'] = $amount;
        }
        foreach ([$partyField => 160, 'description' => 2000, 'reference' => 120] as $f => $max) {
            if (array_key_exists($f, $b)) {
                $d[$f] = str_in($b, $f, $max);
            }
        }
        if (array_key_exists('payment_method', $b)) {
            $d['payment_method'] = enum_in($b, 'payment_method', MONEY_METHODS);
        }
        if ($table === 'expenses' && array_key_exists('project_id', $b)) {
            $d['project_id'] = ($b['project_id'] ?? null) ? (int) $b['project_id'] : null;
        }
        return $d;
    };

    $router->add('GET', $route, $roles, function () use ($table, $partyField) {
        $where = ['1=1'];
        $args = [];
        if ($s = query('from')) {
            $where[] = 't.date >= ?';
            $args[] = $s;
        }
        if ($s = query('to')) {
            $where[] = 't.date <= ?';
            $args[] = $s;
        }
        if ($s = query('category')) {
            $where[] = 't.category = ?';
            $args[] = $s;
        }
        if ($s = query('q')) {
            $where[] = "(t.{$partyField} LIKE ? OR t.description LIKE ? OR t.reference LIKE ?)";
            array_push($args, "%{$s}%", "%{$s}%", "%{$s}%");
        }
        $join = $table === 'expenses' ? 'LEFT JOIN projects p ON p.id = t.project_id' : '';
        $projectCol = $table === 'expenses' ? ', p.name AS project_name' : '';
        $sqlWhere = implode(' AND ', $where);
        $items = q("SELECT t.*, u.name AS created_by_name{$projectCol} FROM {$table} t LEFT JOIN users u ON u.id = t.created_by {$join}
            WHERE {$sqlWhere} ORDER BY t.date DESC, t.id DESC LIMIT 1000", $args)->fetchAll();
        $total = money((float) q("SELECT COALESCE(SUM(t.amount),0) FROM {$table} t WHERE {$sqlWhere}", $args)->fetchColumn());
        return ['items' => $items, 'total' => $total];
    });

    $router->add('POST', $route, $roles, function () use ($table, $data, $label) {
        $row = $data(body(), true) + ['created_by' => current_user()['id']] + (store_upload('file', $table) ?? []);
        $id = insert($table, $row);
        audit('create', $label, $id);
        return ['item' => find_or_404($table, $id, ucfirst($label))];
    });

    $router->add('PUT', "{$route}/{id}", $roles, function ($p) use ($table, $data, $label) {
        $id = id_param($p);
        $before = find_or_404($table, $id, ucfirst($label));
        if (!empty($before['payout_id'])) {
            throw new ApiError('This entry was created from a payout; edit the payout instead.', 422);
        }
        $row = $data(body(), false);
        if ($file = store_upload('file', $table)) {
            delete_upload($before['file_path']);
            $row += $file;
        }
        update($table, $id, $row);
        audit('update', $label, $id);
        return ['item' => find_or_404($table, $id, ucfirst($label))];
    });

    $router->add('DELETE', "{$route}/{id}", [ROLE_ADMIN, ROLE_ACCOUNTS], function ($p) use ($table, $label) {
        $row = find_or_404($table, id_param($p), ucfirst($label));
        if (!empty($row['payout_id'])) {
            throw new ApiError('This entry belongs to a payout and cannot be deleted here.', 422);
        }
        delete_upload($row['file_path']);
        q("DELETE FROM {$table} WHERE id = ?", [$row['id']]);
        audit('delete', $label, (int) $row['id']);
    });

    $router->add('GET', "{$route}/{id}/file", $roles, function ($p) use ($table, $label) {
        $row = find_or_404($table, id_param($p), ucfirst($label));
        send_file($row['file_path'], $row['file_name']);
    });
}

ledger_routes($router, 'expenses', 'expenses', 'vendor', 'expense');
ledger_routes($router, 'income', 'other_income', 'source', 'income');

// ── Profit & loss ───────────────────────────────────────────────────────

$router->add('GET', 'reports/pnl', [ROLE_ACCOUNTS], function () {
    $from = query('from') ?? date('Y-01-01');
    $to = query('to') ?? today();
    $args = [$from, $to];

    $invoiceIncome = money((float) q('SELECT COALESCE(SUM(amount),0) FROM payments WHERE date BETWEEN ? AND ?', $args)->fetchColumn());
    $otherByCat = q('SELECT category, ROUND(SUM(amount),2) AS amount FROM other_income WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY amount DESC', $args)->fetchAll();
    $expenseByCat = q('SELECT category, ROUND(SUM(amount),2) AS amount FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY amount DESC', $args)->fetchAll();
    $income = money($invoiceIncome + array_sum(array_column($otherByCat, 'amount')));
    $expenses = money(array_sum(array_column($expenseByCat, 'amount')));

    $monthly = q("SELECT month, ROUND(SUM(income),2) AS income, ROUND(SUM(expense),2) AS expense FROM (
            SELECT DATE_FORMAT(date, '%Y-%m') AS month, amount AS income, 0 AS expense FROM payments WHERE date BETWEEN ? AND ?
            UNION ALL SELECT DATE_FORMAT(date, '%Y-%m'), amount, 0 FROM other_income WHERE date BETWEEN ? AND ?
            UNION ALL SELECT DATE_FORMAT(date, '%Y-%m'), 0, amount FROM expenses WHERE date BETWEEN ? AND ?
        ) AS t GROUP BY month ORDER BY month", [...$args, ...$args, ...$args])->fetchAll();

    return [
        'from' => $from, 'to' => $to,
        'income' => ['total' => $income, 'invoice_payments' => $invoiceIncome, 'other' => $otherByCat],
        'expenses' => ['total' => $expenses, 'by_category' => $expenseByCat],
        'net' => money($income - $expenses),
        'monthly' => array_map(fn ($m) => $m + ['net' => money((float) $m['income'] - (float) $m['expense'])], $monthly),
        'receivables' => money((float) q('SELECT COALESCE(SUM(' . BALANCE_SQL . '),0) FROM invoices WHERE ' . OPEN_INVOICE_SQL)->fetchColumn()),
    ];
});

// Combined ledger CSV for the accountant.
$router->add('GET', 'reports/ledger.csv', [ROLE_ACCOUNTS], function () {
    $from = query('from') ?? date('Y-01-01');
    $to = query('to') ?? today();
    $rows = q("SELECT * FROM (
            SELECT p.date, 'Income' AS type, 'Invoice payment' AS category, COALESCE(c.company, c.name) AS party,
                   CONCAT('Invoice ', i.number) AS description, p.amount, p.method AS payment_method, p.reference
            FROM payments p JOIN invoices i ON i.id = p.invoice_id JOIN clients c ON c.id = i.client_id WHERE p.date BETWEEN ? AND ?
            UNION ALL SELECT date, 'Income', category, source, description, amount, payment_method, reference FROM other_income WHERE date BETWEEN ? AND ?
            UNION ALL SELECT date, 'Expense', category, vendor, description, -amount, payment_method, reference FROM expenses WHERE date BETWEEN ? AND ?
        ) AS t ORDER BY date", [$from, $to, $from, $to, $from, $to])->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"ledger_{$from}_{$to}.csv\"");
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Date', 'Type', 'Category', 'Party', 'Description', 'Amount', 'Payment method', 'Reference'], escape: '');
    foreach ($rows as $r) {
        fputcsv($out, csv_safe($r), escape: '');
    }
    exit;
});
