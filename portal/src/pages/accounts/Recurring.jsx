import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Zap } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, date, label, today } from "../../lib/format";
import { defaultSupply, taxEnabled } from "../../lib/gst";
import LineItems, { blankLine } from "../../components/LineItems";
import { useApi, useAction, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea, Confirm } from "../../components/ui";

const FREQUENCIES = [["monthly", "Monthly"], ["quarterly", "Every 3 months"], ["half_yearly", "Every 6 months"], ["yearly", "Yearly"]];

export default function Recurring() {
  const res = useApi("recurring");
  const [editing, setEditing] = useState(null);
  return (
    <>
      <PageHeader
        title="Recurring invoices"
        subtitle="AMC, support and retainer billing. The daily job creates each invoice on its date (as a draft, or issued straight away if you choose)."
        actions={<Button icon={Plus} onClick={() => setEditing({})}>New schedule</Button>}
      />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => setEditing(r)}
              empty="No recurring invoices yet."
              columns={[
                { key: "title", label: "Schedule", render: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
                { key: "client", label: "Client" },
                { key: "frequency", label: "Every", render: (r) => FREQUENCIES.find((f) => f[0] === r.frequency)?.[1] },
                { key: "next_date", label: "Next invoice", render: (r) => (r.active ? date(r.next_date) : "—") },
                { key: "end_date", label: "Ends", render: (r) => date(r.end_date) },
                { key: "issued", label: "Issued", align: "right" },
                { key: "active", label: "Status", render: (r) => (r.active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Paused / ended</Badge>) },
                { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) },
              ]}
            />
          )}
        </Async>
      </Card>
      {editing && <RecurringForm id={editing.id} onClose={() => setEditing(null)} onSaved={res.reload} />}
    </>
  );
}

function RecurringForm({ id, onClose, onSaved }) {
  const nav = useNavigate();
  const { settings } = useAuth();
  const defaultGst = taxEnabled(settings) ? Number(settings.default_gst_rate || 0) : 0;
  const services = useApi("services?active=1");
  const existing = useApi(id ? `recurring/${id}` : null);
  const clients = useApi("clients");
  const contracts = useApi("contracts");
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [run, busy] = useAction();

  const loaded = id ? existing.data?.recurring : null;
  if (!form && (!id || loaded)) {
    setForm(
      loaded
        ? { ...loaded, auto_send: !!loaded.auto_send, active: !!loaded.active, end_date: loaded.end_date || "", contract_id: loaded.contract_id || "" }
        : { client_id: "", contract_id: "", title: "", frequency: "monthly", next_date: today(), end_date: "", auto_send: false, active: true, discount: 0, notes: "", items: [blankLine(defaultGst)] }
    );
  }
  if (!form) return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const client = (clients.data?.items || []).find((c) => String(c.id) === String(form.client_id));
  const supplyType = defaultSupply(settings, client?.state_code || settings.company_state);

  const save = () => run(async () => {
    const body = { ...form, contract_id: form.contract_id || null, end_date: form.end_date || null, items: form.items.filter((it) => it.description.trim()) };
    await api(id ? `recurring/${id}` : "recurring", { method: id ? "PUT" : "POST", body });
    onSaved();
    onClose();
  }, "Schedule saved");

  const issueNow = () => run(async () => {
    const d = await api(`recurring/${id}/issue`, { method: "POST" });
    onSaved();
    nav(`/invoices/${d.invoice_id}`);
  }, "Invoice created");

  const remove = () => run(async () => {
    await api(`recurring/${id}`, { method: "DELETE" });
    onSaved();
    onClose();
  }, "Schedule deleted (invoices already issued are kept)");

  const clientContracts = (contracts.data?.items || []).filter((k) => String(k.client_id) === String(form.client_id));

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={id ? form.title : "New recurring invoice"}
      footer={
        <>
          {id && <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirm(true)}>Delete</Button>}
          {id && form.active && <Button variant="secondary" icon={Zap} onClick={issueNow} busy={busy}>Issue next invoice now</Button>}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} busy={busy}>Save</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Client *" value={form.client_id} onChange={set("client_id")} placeholder="Choose client" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} />
        <Select label="Contract (optional)" value={form.contract_id} onChange={set("contract_id")} placeholder="—" options={clientContracts.map((k) => [k.id, `${k.title} (${label(k.type)})`])} />
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="e.g. Annual maintenance — monthly" />
        <Select label="Repeat" value={form.frequency} onChange={set("frequency")} options={FREQUENCIES} />
        <Input label="Next invoice date *" type="date" value={form.next_date} onChange={set("next_date")} hint="Later invoices fall on the same day of the month" />
        <Input label="End date (optional)" type="date" value={form.end_date} onChange={set("end_date")} />
      </div>

      <div className="rounded-lg border border-slate-200 -mx-1">
        <LineItems
          items={form.items}
          onChange={(items) => setForm({ ...form, items })}
          services={services.data?.items || []}
          supplyType={supplyType}
          defaultGst={defaultGst}
        />
        <p className="px-4 pb-3 text-xs text-slate-500">GST is worked out from the customer's state each time an invoice is created.</p>
      </div>

      <Textarea label="Notes printed on each invoice" value={form.notes || ""} onChange={set("notes")} rows={2} />
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.auto_send} onChange={set("auto_send")} className="rounded border-slate-300" /> Issue invoices automatically (otherwise they're drafts to review and issue)</label>
        {id && <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={set("active")} className="rounded border-slate-300" /> Active</label>}
      </div>

      {loaded?.invoices?.length > 0 && (
        <div className="rounded-lg border border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">Invoices from this schedule</div>
          <Table rows={loaded.invoices} onRowClick={(r) => nav(`/invoices/${r.id}`)} columns={[
            { key: "number", label: "Invoice", render: (r) => (r.status === "draft" ? "Draft" : r.number) },
            { key: "issue_date", label: "Date", render: (r) => date(r.issue_date) },
            { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
            { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
          ]} />
        </div>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={busy} message="Delete this schedule? Invoices it already created stay as they are." />
    </Modal>
  );
}
