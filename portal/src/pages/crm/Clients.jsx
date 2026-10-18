import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Button, Modal, Input, Textarea } from "../../components/ui";

export default function Clients() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const clients = useApi(`clients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const [adding, setAdding] = useState(false);
  const showMoney = can(user, "accounts", "marketing");

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Companies and people you work for."
        actions={can(user, "marketing", "accounts") && <Button icon={Plus} onClick={() => setAdding(true)}>Add client</Button>}
      />
      <Card padded={false}>
        <div className="p-3 border-b border-slate-100">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients"
            className="w-full max-w-sm rounded-lg py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-500 border-0"
          />
        </div>
        <Async result={clients}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/clients/${r.id}`)}
              empty="No clients yet. Convert a won lead or add one."
              columns={[
                { key: "name", label: "Name", render: (r) => <span className="font-medium text-slate-900">{r.company || r.name}</span> },
                { key: "contact", label: "Contact", render: (r) => <div className="text-xs">{r.company ? r.name : ""}<br />{r.email} {r.phone}</div> },
                { key: "projects", label: "Projects", align: "right" },
                ...(showMoney
                  ? [
                      { key: "invoiced", label: "Invoiced", align: "right", render: (r) => money(r.invoiced) },
                      { key: "outstanding", label: "Outstanding", align: "right", render: (r) => <span className={r.outstanding > 0 ? "text-amber-700 font-medium" : ""}>{money(r.outstanding)}</span> },
                    ]
                  : []),
              ]}
            />
          )}
        </Async>
      </Card>
      <ClientForm open={adding} onClose={() => setAdding(false)} onSaved={(c) => nav(`/clients/${c.id}`)} />
    </>
  );
}

export function ClientForm({ open, onClose, onSaved, client }) {
  const [f, set] = useForm({
    name: client?.name || "",
    company: client?.company || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    tax_id: client?.tax_id || "",
    notes: client?.notes || "",
  });
  const [run, busy] = useAction();
  const save = () =>
    run(async () => {
      const d = client ? await api(`clients/${client.id}`, { method: "PUT", body: f }) : await api("clients", { method: "POST", body: f });
      onSaved(d.client);
      onClose();
    }, "Client saved");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? "Edit client" : "Add client"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} busy={busy}>Save</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Contact name *" value={f.name} onChange={set("name")} />
        <Input label="Company" value={f.company} onChange={set("company")} />
        <Input label="Email" type="email" value={f.email} onChange={set("email")} />
        <Input label="Phone" value={f.phone} onChange={set("phone")} />
        <Input label="Tax ID (GSTIN / TRN)" value={f.tax_id} onChange={set("tax_id")} />
      </div>
      <Textarea label="Billing address" value={f.address} onChange={set("address")} rows={2} />
      <Textarea label="Notes" value={f.notes} onChange={set("notes")} rows={2} />
    </Modal>
  );
}
