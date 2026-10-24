import { useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { downloadFile } from "../../lib/api";
import { money, today, label } from "../../lib/format";
import { SUPPLY_LABELS } from "../../lib/gst";
import { useApi, useToast, Async, PageHeader, Card, Stat, Table, Button, Input, Select, Tabs, Badge } from "../../components/ui";

function fyStart() {
  const [y, m] = today().split("-").map(Number);
  return `${m >= 4 ? y : y - 1}-04-01`;
}

const monthLabel = (p) => new Date(`${p}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

/** Sales by date / month / financial year, invoice status summary, and GST summary, with CSV/Excel export. */
export default function SalesReports() {
  const [tab, setTab] = useState("sales");
  const [range, setRange] = useState({ from: fyStart(), to: today() });
  const [group, setGroup] = useState("month");
  const [clientId, setClientId] = useState("");
  const clients = useApi("clients");
  const toast = useToast();
  const qs = `from=${range.from}&to=${range.to}${clientId && tab === "sales" ? `&client_id=${clientId}` : ""}`;
  const download = (path, name) => downloadFile(path, name).catch((e) => toast(e.message, "error"));
  const exportButtons = (path, name) => (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" icon={Download} onClick={() => download(`${path}&format=csv`, `${name}.csv`)}>CSV</Button>
      <Button size="sm" variant="ghost" icon={Download} onClick={() => download(`${path}&format=xlsx`, `${name}.xlsx`)}>Excel</Button>
    </div>
  );

  return (
    <>
      <PageHeader title="Sales & GST reports" subtitle="Issued invoices only (drafts and cancelled invoices are left out). Credit notes count as negative sales." />
      <Tabs value={tab} onChange={setTab} tabs={[["sales", "Sales"], ["gst", "GST summary"]]} />
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        <div className="flex gap-1 pb-0.5">
          {[["Month", `${today().slice(0, 8)}01`], ["FY", fyStart()], ["Year", `${today().slice(0, 4)}-01-01`]].map(([t, from]) => (
            <Button key={t} size="sm" variant="secondary" onClick={() => setRange({ from, to: today() })}>This {t === "FY" ? "financial year" : t.toLowerCase()}</Button>
          ))}
        </div>
        {tab === "sales" && (
          <>
            <Select label="Group by" value={group} onChange={(e) => setGroup(e.target.value)} options={[["day", "Date"], ["month", "Month"], ["fy", "Financial year"]]} />
            <Select label="Customer" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="All customers" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} />
          </>
        )}
      </div>
      {tab === "sales" ? <Sales qs={`${qs}&group=${group}`} group={group} exportButtons={exportButtons} /> : <Gst qs={qs} exportButtons={exportButtons} range={range} />}
    </>
  );
}

function Sales({ qs, group, exportButtons }) {
  const res = useApi(`reports/sales?${qs}`);
  return (
    <Async result={res}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label={`Net sales (${d.totals.invoices} invoices)`} value={money(d.totals.net_sales)} />
            <Stat label="GST charged" value={money(d.totals.tax)} tone="brand" />
            <Stat label="Received" value={money(d.totals.received)} tone="green" />
            <Stat label="Outstanding" value={money(d.totals.outstanding)} tone="amber" />
          </div>
          <Card title="Sales" actions={exportButtons(`reports/sales?${qs}`, `sales_${d.from}_${d.to}`)} padded={false}>
            <Table
              rows={d.rows}
              empty="No issued invoices in this period."
              columns={[
                { key: "period", label: { day: "Date", month: "Month", fy: "Financial year" }[group], render: (r) => (group === "month" ? monthLabel(r.period) : group === "day" ? new Date(`${r.period}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : `FY ${r.period}`) },
                { key: "invoices", label: "Invoices", align: "right" },
                { key: "invoiced", label: "Invoiced", align: "right", render: (r) => money(r.invoiced) },
                { key: "credit_notes", label: "Credit notes", align: "right", render: (r) => (r.credit_notes ? `−${money(r.credit_notes)}` : "—") },
                { key: "debit_notes", label: "Debit notes", align: "right", render: (r) => (r.debit_notes ? money(r.debit_notes) : "—") },
                { key: "taxable", label: "Taxable value", align: "right", render: (r) => money(r.taxable) },
                { key: "tax", label: "GST", align: "right", render: (r) => money(r.tax) },
                { key: "net_sales", label: "Net sales", align: "right", render: (r) => <b>{money(r.net_sales)}</b> },
                { key: "received", label: "Received", align: "right", render: (r) => money(r.received) },
                { key: "outstanding", label: "Outstanding", align: "right", render: (r) => money(r.outstanding) },
              ]}
            />
          </Card>
          <Card title="Invoices by status" padded={false}>
            <Table
              rows={d.by_status}
              empty="No issued invoices in this period."
              columns={[
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "count", label: "Invoices", align: "right" },
                { key: "total", label: "Value", align: "right", render: (r) => money(r.total) },
                { key: "balance", label: "Still to collect", align: "right", render: (r) => (["issued", "partially_paid", "overdue"].includes(r.status) ? money(r.balance) : "—") },
                { key: "link", label: "", render: () => <Link to="/invoices" className="text-xs text-brand-700 hover:underline">Invoice list</Link> },
              ]}
            />
          </Card>
        </div>
      )}
    </Async>
  );
}

function Gst({ qs, exportButtons, range }) {
  const res = useApi(`reports/gst?${qs}`);
  const money2 = (k) => ({ key: k, label: k.toUpperCase(), align: "right", render: (r) => money(r[k]) });
  const name = `${range.from}_${range.to}`;
  return (
    <Async result={res}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Taxable value" value={money(d.totals.taxable)} />
            <Stat label="CGST" value={money(d.totals.cgst)} tone="brand" />
            <Stat label="SGST" value={money(d.totals.sgst)} tone="brand" />
            <Stat label="IGST" value={money(d.totals.igst)} tone="brand" />
            <Stat label="Total GST" value={money(d.totals.tax)} tone="green" />
          </div>
          <Card title="By GST rate" actions={exportButtons(`reports/gst?${qs}&table=rate`, `gst_summary_${name}`)} padded={false}>
            <Table rows={d.by_rate} empty="No issued invoices in this period." columns={[
              { key: "rate", label: "GST rate", render: (r) => `${Number(r.rate)}%` },
              { key: "taxable", label: "Taxable value", align: "right", render: (r) => money(r.taxable) },
              money2("cgst"), money2("sgst"), money2("igst"),
              { key: "tax", label: "Total GST", align: "right", render: (r) => <b>{money(r.tax)}</b> },
            ]} />
          </Card>
          <Card title="By HSN/SAC" actions={exportButtons(`reports/gst?${qs}&table=hsn`, `gst_hsn_${name}`)} padded={false}>
            <Table rows={d.by_hsn} empty="No issued invoices in this period." columns={[
              { key: "hsn_sac", label: "HSN/SAC" },
              { key: "description", label: "Description", className: "max-w-xs truncate" },
              { key: "rate", label: "Rate", align: "right", render: (r) => `${Number(r.rate)}%` },
              { key: "quantity", label: "Qty", align: "right", render: (r) => Number(r.quantity) },
              { key: "taxable", label: "Taxable value", align: "right", render: (r) => money(r.taxable) },
              { key: "tax", label: "GST", align: "right", render: (r) => money(r.tax) },
            ]} />
          </Card>
          <Card title="By customer type and tax type" actions={exportButtons(`reports/gst?${qs}&table=register`, `gst_register_${name}`)} padded={false}>
            <Table rows={d.by_type} empty="No issued invoices in this period." columns={[
              { key: "customer_type", label: "Customers", render: (r) => (r.customer_type === "B2B" ? "Registered (B2B)" : "Unregistered (B2C)") },
              { key: "supply_type", label: "Tax type", render: (r) => SUPPLY_LABELS[r.supply_type] || label(r.supply_type) },
              { key: "reverse_charge", label: "Reverse charge", render: (r) => (r.reverse_charge ? "Yes" : "No") },
              { key: "taxable", label: "Taxable value", align: "right", render: (r) => money(r.taxable) },
              { key: "tax", label: "GST", align: "right", render: (r) => money(r.tax) },
            ]} />
            <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">The export here is the invoice-wise GST register (one row per invoice and rate), useful for GSTR-1.</p>
          </Card>
        </div>
      )}
    </Async>
  );
}
