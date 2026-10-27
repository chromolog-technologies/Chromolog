import { useState } from "react";
import { Plus, Send, Mail } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, ROLE_LABELS } from "../../lib/auth";
import { money, date, dateTime } from "../../lib/format";
import { isStrong } from "../../lib/password";
import PasswordField from "../../components/PasswordField";
import { useApi, useAction, useForm, useToast, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select } from "../../components/ui";

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
      <PageHeader title="Users & roles" subtitle="Add people by email. Each person gets an activation link and sets their own password." actions={<Button icon={Plus} onClick={() => setEditing({})}>Add user</Button>} />
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
                { key: "active", label: "Status", render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Disabled</Badge>}
                    {r.locked && <Badge tone="red">Locked</Badge>}
                    {r.invite_pending && <Badge tone="amber">Invite sent</Badge>}
                    {r.must_change_password && <Badge tone="amber">Must set password</Badge>}
                  </div>
                ) },
                { key: "last_login_at", label: "Last sign-in", render: (r) => (r.last_login_at ? dateTime(r.last_login_at) : <span className="text-slate-400">Never</span>) },
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
  const { user: me, settings } = useAuth();
  const toast = useToast();
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
  const [manual, setManual] = useState(false);
  const [run, busy] = useAction();
  const save = () => run(async () => {
    if (f.password && !isStrong(f.password, f)) throw new Error("The password doesn't meet all the rules yet.");
    const body = { ...f };
    if (isNew || !body.password) delete body.password;
    const d = await api(isNew ? "users" : `users/${u.id}`, { method: isNew ? "POST" : "PUT", body });
    if (isNew) {
      if (d.email_sent) toast(`User added. An activation link was emailed to ${f.email}.`);
      else toast("User added, but the activation email could not be sent. Open the user and resend it.", "error");
    }
    onSaved();
    onClose();
  }, isNew ? undefined : "User updated");
  const sendLink = () => run(async () => {
    const d = await api(`users/${u.id}/send-link`, { method: "POST" });
    onSaved();
    return d;
  }, u.invite_pending ? `Activation link sent again to ${u.email}` : `Password reset link sent to ${u.email}`);
  const self = u.id === me.id;
  const from = settings?.company_email || "info@chromologtechnologies.com";
  return (
    <Modal open onClose={onClose} title={isNew ? "Add user" : u.name} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={isNew ? Send : undefined} onClick={save} busy={busy}>{isNew ? "Add & send invite" : "Save"}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full name *" value={f.name} onChange={set("name")} />
        <Input label="Email (login) *" type="email" value={f.email} onChange={set("email")} />
        <Input label="Phone" value={f.phone} onChange={set("phone")} />
        <Select label="Role" value={f.role} onChange={set("role")} disabled={self} options={Object.entries(ROLE_LABELS).map(([k, v]) => [k, v])} hint={ROLE_HELP[f.role]} />
        <Input label="Default rate per hour" type="number" min="0" step="any" value={f.hourly_rate} onChange={set("hourly_rate")} hint="Used for payouts unless a project sets its own rate" />
      </div>
      {isNew ? (
        <p className="text-sm rounded-lg bg-brand-50 text-slate-700 p-3">
          No password needed. We'll email an activation link from <b>{from}</b>. They choose their own password from that link (valid for 7 days).
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-600">
              {u.invite_pending ? "Hasn't activated the account yet." : "Forgot their password? Email them a link to set a new one."}
            </span>
            {!self && u.active && (
              <Button size="sm" variant="secondary" icon={Mail} busy={busy} onClick={sendLink}>
                {u.invite_pending ? "Resend activation link" : "Email reset link"}
              </Button>
            )}
          </div>
          {!u.invite_pending && !manual && (
            <button type="button" onClick={() => setManual(true)} className="text-xs text-slate-500 hover:text-slate-700 underline">Set a temporary password instead</button>
          )}
          {manual && (
            <>
              <PasswordField label="Temporary password (leave blank to keep)" value={f.password} onChange={(v) => set("password")(v)} who={f} allowGenerate />
              <p className="text-xs text-slate-500">Share it privately (not by email or group chat). They'll be asked to set their own at the next sign-in, and their current sessions end.</p>
            </>
          )}
        </div>
      )}
      {!isNew && !self && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.active} onChange={set("active")} className="rounded border-slate-300" />
          Active (untick to block this person from signing in)
        </label>
      )}
      {u.locked && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Locked after too many wrong passwords.
          <Button size="sm" variant="secondary" busy={busy} onClick={() => run(async () => { await api(`users/${u.id}`, { method: "PUT", body: { unlock: true } }); onSaved(); onClose(); }, "Account unlocked")}>Unlock now</Button>
        </div>
      )}
    </Modal>
  );
}
