import { useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, ROLE_LABELS } from "../../lib/auth";
import { money, date } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select } from "../../components/ui";

const ROLE_HELP = {
  admin: "Everything, including users and settings.",
  marketing: "Leads, CRM, clients, contracts and quotations.",
  accounts: "Invoices, payments, expenses, income, payouts and reports.",
  project: "All projects, tasks, timesheet approvals and daily reports.",
  employee: "Own tasks, timesheet, daily report and earnings.",
};

export default function Users() {
  const res = useApi("users");
  const [editing, setEditing] = useState(null);
  return (
    <>
      <PageHeader title="Users & roles" subtitle="Create logins for your marketing, accounts and project teams, and for employees/freelancers." actions={<Button icon={Plus} onClick={() => setEditing({})}>Add user</Button>} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => setEditing(r)}
              columns={[
                { key: "name", label: "Name", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
                { key: "email", label: "Email" },
                { key: "role", label: "Role", render: (r) => <Badge tone={r.role === "admin" ? "brand" : "slate"}>{ROLE_LABELS[r.role]}</Badge> },
                { key: "hourly_rate", label: "Default rate / hour", align: "right", render: (r) => (r.hourly_rate ? money(r.hourly_rate) : "—") },
                { key: "active", label: "Status", render: (r) => (r.active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Disabled</Badge>) },
                { key: "created_at", label: "Added", render: (r) => date(r.created_at) },
              ]}
            />
          )}
        </Async>
      </Card>
      <Card title="What each role can do" className="mt-6">
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          {Object.entries(ROLE_HELP).map(([k, v]) => (
            <div key={k}><dt className="font-medium">{ROLE_LABELS[k]}</dt><dd className="text-slate-500">{v}</dd></div>
          ))}
        </dl>
        <p className="text-xs text-slate-400 mt-3">Everyone can also log time, submit daily reports and see their own earnings.</p>
      </Card>
      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={res.reload} />}
    </>
  );
}

function UserForm({ user: u, onClose, onSaved }) {
  const { user: me } = useAuth();
  const isNew = !u.id;
  const [f, set] = useForm({
    name: u.name || "",
    email: u.email || "",
    phone: u.phone || "",
    role: u.role || "employee",
    hourly_rate: u.hourly_rate ?? 0,
    active: u.active ?? true,
    password: "",
  });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    const body = { ...f };
    if (!isNew && !body.password) delete body.password;
    await api(isNew ? "users" : `users/${u.id}`, { method: isNew ? "POST" : "PUT", body });
    onSaved();
    onClose();
  }, isNew ? "User created" : "User updated");
  const self = u.id === me.id;
  return (
    <Modal open onClose={onClose} title={isNew ? "Add user" : u.name} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full name *" value={f.name} onChange={set("name")} />
        <Input label="Email (login) *" type="email" value={f.email} onChange={set("email")} />
        <Input label="Phone" value={f.phone} onChange={set("phone")} />
        <Select label="Role" value={f.role} onChange={set("role")} disabled={self} options={Object.entries(ROLE_LABELS).map(([k, v]) => [k, v])} hint={ROLE_HELP[f.role]} />
        <Input label="Default rate per hour" type="number" min="0" step="any" value={f.hourly_rate} onChange={set("hourly_rate")} hint="Used for payouts unless a project sets its own rate" />
        <Input label={isNew ? "Password * (min 8 chars)" : "New password (leave blank to keep)"} type="password" autoComplete="new-password" value={f.password} onChange={set("password")} />
      </div>
      {!isNew && !self && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={set("active")} className="rounded border-slate-300" />
          Active (untick to block this person from signing in)
        </label>
      )}
      {isNew && <p className="text-xs text-slate-500">Share the email and password with the person; they can change the password on their Profile page.</p>}
    </Modal>
  );
}
