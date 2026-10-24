import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Search } from "lucide-react";
import { downloadFile } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money, date, today, addDays } from "../../lib/format";
import { useApi, useToast, Async, PageHeader, Card, Table, Badge, Button, Tabs, Select, Input, Stat } from "../../components/ui";

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

const PERIODS = [
  ["", "All dates"], ["today", "Today"], ["week", "This week"], ["month", "This month"], ["last_month", "Last month"],
  ["year", "This year"], ["fy", "This financial year"], ["date", "A specific date"], ["custom", "Date range"],
];

/** from/to (YYYY-MM-DD) for a period preset, in the company timezone. */
function periodRange(period) {
  const t = today();
  const [y, m] = t.split("-").map(Number);
  const iso = (d) => d.toISOString().slice(0, 10);
  const d = new Date(`${t}T00:00:00Z`);
  switch (period) {
    case "today": return { from: t, to: t };
    case "week": { const dow = (d.getUTCDay() + 6) % 7; return { from: addDays(t, -dow), to: t }; }
    case "month": return { from: `${t.slice(0, 8)}01`, to: t };
    case "last_month": { const first = new Date(Date.UTC(y, m - 2, 1)); const last = new Date(Date.UTC(y, m - 1, 0)); return { from: iso(first), to: iso(last) }; }
    case "year": return { from: `${y}-01-01`, to: t };
    case "fy": return { from: `${m >= 4 ? y : y - 1}-04-01`, to: t };
    default: return {};
  }
}

export function InvoiceList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ doc_type: "invoice", status: "", q: "", client_id: "", period: "", date: today(), from: today().slice(0, 8) + "01", to: today(), sort: "newest" });
  const [q, setQ] = useState("");
  const clients = useApi("clients");
  useEffect(() => {
    const t = setTimeout(() => setF((x) => ({ ...x, q })), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ doc_type: f.doc_type, sort: f.sort });
  if (f.status) params.set("status", f.status);
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.client_id) params.set("client_id", f.client_id);
  if (f.period === "date") params.set("date", f.date);
  else if (f.period === "custom") { params.set("from", f.from); params.set("to", f.to); }
  else Object.entries(periodRange(f.period)).forEach(([k, v]) => params.set(k, v));
  const res = useApi(`invoices?${params}`);
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((x) => ({ ...x, [k]: v }));
  };
  const exportAs = (format) => downloadFile(`invoices/export?${params}&format=${format}`, `invoices_${today()}.${format}`).catch((e) => toast(e.message, "error"));
  const noun = { invoice: "invoices", credit_note: "credit notes", debit_note: "debit notes" }[f.doc_type];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bill customers, record payments and track what's outstanding."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => exportAs("csv")}>CSV</Button>
            <Button variant="secondary" icon={Download} onClick={() => exportAs("xlsx")}>Excel</Button>
            {can(user, "accounts") && <Button icon={Plus} onClick={() => nav("/invoices/new")}>New invoice</Button>}
          </>
        }
      />
      <div className="flex gap-1 mb-4 rounded-lg bg-slate-100 p-1 w-fit">
        {[["invoice", "Invoices"], ["credit_note", "Credit notes"], ["debit_note", "Debit notes"]].map(([k, t]) => (
          <button key={k} onClick={() => setF((x) => ({ ...x, doc_type: k, status: "" }))} className={`px-3 py-1.5 text-sm rounded-md ${f.doc_type === k ? "bg-white shadow-sm font-medium text-slate-900" : "text-slate-500"}`}>{t}</button>
        ))}
      </div>
      <Tabs
        value={f.status}
        onChange={(status) => setF((x) => ({ ...x, status }))}
        tabs={f.doc_type === "invoice"
          ? [["", "All"], ["draft", "Draft"], ["issued", "Issued"], ["partially_paid", "Partly paid"], ["overdue", "Overdue"], ["unpaid", "All unpaid"], ["paid", "Paid"], ["cancelled", "Cancelled"]]
          : [["", "All"], ["draft", "Draft"], ["issued", "Issued"], ["cancelled", "Cancelled"]]}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="relative lg:col-span-2">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, customer, PO or amount" aria-label="Search invoices"
            className="block w-full rounded-lg border-0 py-2 pl-9 pr-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-500" />
        </div>
        <Select value={f.client_id} onChange={set("client_id")} placeholder="All customers" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} aria-label="Customer" />
        <Select value={f.period} onChange={set("period")} options={PERIODS} aria-label="Period" />
        <Select value={f.sort} onChange={set("sort")} options={[["newest", "Latest to oldest"], ["oldest", "Oldest to latest"]]} aria-label="Sort" />
        {f.period === "date" && <Input type="date" value={f.date} onChange={set("date")} aria-label="Date" />}
        {f.period === "custom" && (
          <>
            <Input type="date" value={f.from} onChange={set("from")} aria-label="From" />
            <Input type="date" value={f.to} onChange={set("to")} aria-label="To" />
          </>
        )}
      </div>
      <Async result={res}>
        {(d) => (
          <>
            {f.doc_type === "invoice" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Stat label={`Invoices (${d.summary.count})`} value={money(d.summary.total)} hint="Issued, excluding drafts and cancelled" />
                <Stat label="Received" value={money(d.summary.received)} tone="green" />
                <Stat label="Outstanding" value={money(d.summary.outstanding)} tone="amber" />
                <Stat label="Overdue" value={d.items.filter((r) => r.status === "overdue").length} tone="red" onClick={() => setF((x) => ({ ...x, status: "overdue" }))} />
              </div>
            )}
            <Card padded={false}>
              <Table
                rows={d.items}
                onRowClick={(r) => nav(`/invoices/${r.id}`)}
                empty={`No ${noun} match these filters.`}
                columns={[
                  { key: "number", label: "Number", render: (r) => <span className="font-medium text-slate-900">{r.status === "draft" ? <span className="text-slate-400 font-normal">Draft</span> : r.number}</span> },
                  { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
                  { key: "client", label: "Customer" },
                  ...(f.doc_type === "invoice"
                    ? [{ key: "due_date", label: "Due", render: (r) => <span className={r.status === "overdue" ? "text-red-600 font-medium" : ""}>{date(r.due_date)}</span> }]
                    : [{ key: "original_number", label: "Against invoice" }]),
                  { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                  { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
                  ...(f.doc_type === "invoice" ? [{ key: "balance", label: "Balance", align: "right", render: (r) => (Number(r.balance) ? money(r.balance) : "—") }] : []),
                ]}
              />
            </Card>
          </>
        )}
      </Async>
    </>
  );
}
