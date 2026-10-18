import { useState } from "react";
import { Plus, Paperclip, AlertTriangle } from "lucide-react";
import { api, openFile } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, date, label } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea, Field, Confirm } from "../../components/ui";

const TYPES = ["project", "amc", "support", "retainer", "nda", "other"];
const STATUSES = ["draft", "active", "expired", "cancelled"];

export default function Contracts() {
  const res = useApi("contracts");
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader
        title="Contracts"
        subtitle="Signed agreements, AMCs and support renewals. Renewals due soon are shown first."
        actions={<Button icon={Plus} onClick={() => setEditing({})}>Add contract</Button>}
      />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => setEditing(r)}
              empty="No contracts yet."
              columns={[
                { key: "title", label: "Contract", render: (r) => (
                  <span className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                    {r.renewal_due ? <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Renewal due" /> : null}
                    {r.title}
                    {r.file_name && <Paperclip className="h-3.5 w-3.5 text-slate-400" />}
                  </span>
                ) },
                { key: "client", label: "Client", render: (r) => r.client_company || r.client_name },
                { key: "type", label: "Type", render: (r) => label(r.type) },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "start_date", label: "Start", render: (r) => date(r.start_date) },
                { key: "end_date", label: "End", render: (r) => date(r.end_date) },
                { key: "value", label: "Value", align: "right", render: (r) => money(r.value) },
              ]}
            />
          )}
        </Async>
      </Card>
      {editing && <ContractForm contract={editing} onClose={() => setEditing(null)} onSaved={res.reload} />}
    </>
  );
}

/** Add/edit a contract. `contract` may be {} (new) or {client_id} (new for a client). */
export function ContractForm({ contract, onClose, onSaved }) {
  const { user } = useAuth();
  const isNew = !contract.id;
  const clients = useApi("clients");
  const [f, set] = useForm({
    client_id: contract.client_id || "",
    title: contract.title || "",
    type: contract.type || "project",
    status: contract.status || "active",
    start_date: contract.start_date || "",
    end_date: contract.end_date || "",
    value: contract.value ?? "",
    renewal_reminder_days: contract.renewal_reminder_days ?? 30,
    notes: contract.notes || "",
  });
  const [file, setFile] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [run, busy] = useAction();

  const save = () =>
    run(async () => {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (file) fd.append("file", file);
      await api(isNew ? "contracts" : `contracts/${contract.id}`, { method: isNew ? "POST" : "PUT", body: fd });
      onSaved();
      onClose();
    }, "Contract saved");

  const remove = () =>
    run(async () => {
      await api(`contracts/${contract.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    }, "Contract deleted");

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? "Add contract" : contract.title}
      footer={
        <>
          {!isNew && user.role === "admin" && <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirm(true)}>Delete</Button>}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} busy={busy}>Save</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Client *" value={f.client_id} onChange={set("client_id")} placeholder="Choose client" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} />
        <Input label="Title *" value={f.title} onChange={set("title")} />
        <Select label="Type" value={f.type} onChange={set("type")} options={TYPES.map((t) => [t, label(t)])} />
        <Select label="Status" value={f.status} onChange={set("status")} options={STATUSES.map((t) => [t, label(t)])} />
        <Input label="Start date" type="date" value={f.start_date} onChange={set("start_date")} />
        <Input label="End / renewal date" type="date" value={f.end_date} onChange={set("end_date")} />
        <Input label="Contract value" type="number" min="0" value={f.value} onChange={set("value")} />
        <Input label="Remind me (days before end)" type="number" min="0" value={f.renewal_reminder_days} onChange={set("renewal_reminder_days")} />
      </div>
      <Textarea label="Notes" value={f.notes} onChange={set("notes")} rows={2} />
      <Field label="Signed document (PDF, image, Word)" hint={contract.file_name ? `Current: ${contract.file_name} — choose a file to replace it` : "Max 10 MB"}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => setFile(e.target.files[0] || null)} className="block text-sm text-slate-600" />
      </Field>
      {contract.file_name && (
        <Button variant="secondary" size="sm" icon={Paperclip} onClick={() => run(() => openFile(`contracts/${contract.id}/file`))}>
          Open {contract.file_name}
        </Button>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} busy={busy} message="Delete this contract and its document?" />
    </Modal>
  );
}
