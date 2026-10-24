import { useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money } from "../../lib/format";
import { GST_RATES } from "../../lib/gst";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea } from "../../components/ui";

/** Standard services with default description, rate, unit, HSN/SAC and GST rate (picked when invoicing). */
export default function Services() {
  const { user, settings } = useAuth();
  const admin = user.role === "admin";
  const res = useApi("services");
  const [editing, setEditing] = useState(null);
  return (
    <>
      <PageHeader
        title="Service list"
        subtitle={admin
          ? "Picking a service on an invoice fills in its details. Changing a rate here never changes invoices already issued."
          : "Standard services and rates. Only an admin can change them."}
        actions={admin && <Button icon={Plus} onClick={() => setEditing({})}>Add service</Button>}
      />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={admin ? (r) => setEditing(r) : undefined}
              empty="No services yet. Add the services you sell most often."
              columns={[
                { key: "name", label: "Service", render: (r) => <><div className="font-medium text-slate-900">{r.name}</div>{r.description && <div className="text-xs text-slate-500 line-clamp-1">{r.description}</div>}</> },
                { key: "hsn_sac", label: "HSN/SAC" },
                { key: "unit", label: "Unit" },
                ...(settings.tax_enabled === "1" ? [{ key: "gst_rate", label: "GST", align: "right", render: (r) => `${Number(r.gst_rate)}%` }] : []),
                { key: "active", label: "Status", render: (r) => (r.active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Hidden</Badge>) },
                { key: "rate", label: "Default rate", align: "right", render: (r) => money(r.rate) },
              ]}
            />
          )}
        </Async>
      </Card>
      {editing && <ServiceForm service={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={res.reload} />}
    </>
  );
}

function ServiceForm({ service, onClose, onSaved }) {
  const { settings } = useAuth();
  const [f, set] = useForm({
    name: service?.name || "",
    description: service?.description || "",
    unit: service?.unit || "Nos",
    hsn_sac: service?.hsn_sac || "",
    rate: service?.rate ?? "",
    gst_rate: String(service?.gst_rate ?? settings.default_gst_rate ?? 18),
    active: service ? !!service.active : true,
  });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    await api(service ? `services/${service.id}` : "services", { method: service ? "PUT" : "POST", body: f });
    onSaved();
    onClose();
  }, "Service saved");
  return (
    <Modal open onClose={onClose} title={service ? "Edit service" : "Add service"} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save</Button></>}>
      <Input label="Service name *" value={f.name} onChange={set("name")} placeholder="e.g. Website development" />
      <Textarea label="Default description" rows={2} value={f.description} onChange={set("description")} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Default rate" type="number" min="0" step="any" value={f.rate} onChange={set("rate")} />
        <Input label="Unit" value={f.unit} onChange={set("unit")} placeholder="Nos, Hours, Month, Year…" />
        <Input label="HSN/SAC code" value={f.hsn_sac} onChange={(e) => set("hsn_sac")(e.target.value.replace(/\D/g, "").slice(0, 8))} hint="IT services usually use SAC 998314 (development) or 998313 (consulting)." />
        <Select label="GST rate" value={f.gst_rate} onChange={set("gst_rate")} options={GST_RATES.map((r) => [String(r), `${r}%`])} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={f.active} onChange={set("active")} className="rounded border-slate-300" /> Show in the service list when invoicing
      </label>
    </Modal>
  );
}
