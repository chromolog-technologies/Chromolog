import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth, can } from "../../lib/auth";
import { money, date, today } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Table, Badge, Button, Tabs } from "../../components/ui";

export function QuotationList() {
  const nav = useNavigate();
  const [status, setStatus] = useState("");
  const res = useApi(`quotations${status ? `?status=${status}` : ""}`);
  return (
    <>
      <PageHeader title="Quotations" subtitle="Estimates sent to leads and clients." actions={<Button icon={Plus} onClick={() => nav("/quotations/new")}>New quotation</Button>} />
      <Tabs value={status} onChange={setStatus} tabs={[["", "All"], ["draft", "Draft"], ["sent", "Sent"], ["accepted", "Accepted"], ["rejected", "Rejected"], ["invoiced", "Invoiced"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/quotations/${r.id}`)}
              empty="No quotations yet."
              columns={[
                { key: "number", label: "Number", render: (r) => <span className="font-medium text-slate-900">{r.number}</span> },
                { key: "party", label: "For" },
                { key: "title", label: "Title" },
                { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
                { key: "valid_until", label: "Valid until", render: (r) => date(r.valid_until) },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
              ]}
            />
          )}
        </Async>
      </Card>
    </>
  );
}

export function InvoiceList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const res = useApi(`invoices${status ? `?status=${status}` : ""}`);
  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bill clients, record payments and track what's outstanding."
        actions={can(user, "accounts") && <Button icon={Plus} onClick={() => nav("/invoices/new")}>New invoice</Button>}
      />
      <Tabs value={status} onChange={setStatus} tabs={[["", "All"], ["draft", "Draft"], ["sent", "Sent"], ["partially_paid", "Partly paid"], ["overdue", "Overdue"], ["paid", "Paid"], ["cancelled", "Cancelled"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => {
            const outstanding = d.items.filter((r) => ["sent", "partially_paid"].includes(r.status)).reduce((s, r) => s + (r.total - r.amount_paid), 0);
            return (
              <Table
                rows={d.items}
                onRowClick={(r) => nav(`/invoices/${r.id}`)}
                empty="No invoices yet."
                columns={[
                  { key: "number", label: "Number", render: (r) => <span className="font-medium text-slate-900">{r.number}</span> },
                  { key: "client", label: "Client" },
                  { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
                  { key: "due_date", label: "Due", render: (r) => {
                    const late = ["sent", "partially_paid"].includes(r.status) && r.due_date < today();
                    return <span className={late ? "text-red-600 font-medium" : ""}>{date(r.due_date)}</span>;
                  } },
                  { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                  { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
                  { key: "balance", label: "Balance", align: "right", render: (r) => money(r.total - r.amount_paid) },
                ]}
                footer={
                  <tr>
                    <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Outstanding in this list</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(outstanding)}</td>
                  </tr>
                }
              />
            );
          }}
        </Async>
      </Card>
    </>
  );
}
