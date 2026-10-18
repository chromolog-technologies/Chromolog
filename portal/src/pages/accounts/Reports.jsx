import { useState } from "react";
import { Download } from "lucide-react";
import { downloadFile } from "../../lib/api";
import { money, today } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Stat, Table, Button, Input } from "../../components/ui";

function fyStart() {
  // Indian financial year starts 1 April.
  const [y, m] = today().split("-").map(Number);
  return `${m >= 4 ? y : y - 1}-04-01`;
}

export default function Reports() {
  const [range, setRange] = useState({ from: fyStart(), to: today() });
  const res = useApi(`reports/pnl?from=${range.from}&to=${range.to}`);

  return (
    <>
      <PageHeader
        title="Profit & loss"
        subtitle="Income (invoice payments + other income) minus expenses for the period."
        actions={
          <Button variant="secondary" icon={Download} onClick={() => downloadFile(`reports/ledger.csv?from=${range.from}&to=${range.to}`, `ledger_${range.from}_${range.to}.csv`)}>
            Ledger CSV for accountant
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-6">
        <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
      </div>
      <Async result={res}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Income" value={money(d.income.total)} tone="green" />
              <Stat label="Expenses" value={money(d.expenses.total)} tone="red" />
              <Stat label="Net profit" value={money(d.net)} tone={d.net >= 0 ? "green" : "red"} />
              <Stat label="Receivables (unpaid invoices)" value={money(d.receivables)} tone="amber" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card title="Income" padded={false}>
                <Table
                  rows={[{ category: "Invoice payments", amount: d.income.invoice_payments }, ...d.income.other]}
                  columns={[
                    { key: "category", label: "Source" },
                    { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
                  ]}
                />
              </Card>
              <Card title="Expenses by category" padded={false}>
                <Table
                  rows={d.expenses.by_category}
                  empty="No expenses in this period."
                  columns={[
                    { key: "category", label: "Category" },
                    { key: "share", label: "Share", align: "right", render: (r) => (d.expenses.total ? `${Math.round((r.amount / d.expenses.total) * 100)}%` : "—") },
                    { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
                  ]}
                />
              </Card>
            </div>
            <Card title="Month by month" padded={false}>
              <Table
                rows={d.monthly}
                empty="No transactions in this period."
                columns={[
                  { key: "month", label: "Month", render: (r) => new Date(`${r.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) },
                  { key: "income", label: "Income", align: "right", render: (r) => money(r.income) },
                  { key: "expense", label: "Expenses", align: "right", render: (r) => money(r.expense) },
                  { key: "net", label: "Net", align: "right", render: (r) => <span className={r.net < 0 ? "text-red-600" : "text-emerald-700"}>{money(r.net)}</span> },
                ]}
              />
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
