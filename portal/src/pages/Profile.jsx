import { useState } from "react";
import { KeyRound, Copy, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth, ROLE_LABELS } from "../lib/auth";
import { date, dateTime } from "../lib/format";
import { useApi, useAction, useForm, useToast, PageHeader, Card, Button, Input, Table } from "../components/ui";

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [pw, setPw, setPwForm] = useForm({ current_password: "", new_password: "", confirm: "" });
  const keys = useApi("me/api-keys");
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [run, busy] = useAction();

  const changePassword = () => run(async () => {
    if (pw.new_password !== pw.confirm) throw new Error("The new passwords don't match.");
    await api("me/password", { method: "PUT", body: pw });
    setPwForm({ current_password: "", new_password: "", confirm: "" });
  }, "Password changed. Other devices were signed out.");

  const createKey = () => run(async () => {
    const d = await api("me/api-keys", { method: "POST", body: { label: label || "API key" } });
    setNewKey(d.token);
    setLabel("");
    keys.reload();
  });

  const revoke = (id) => run(async () => {
    await api(`me/api-keys/${id}`, { method: "DELETE" });
    keys.reload();
  }, "Key revoked");

  return (
    <>
      <PageHeader title="My profile" subtitle={`${user.email} · ${ROLE_LABELS[user.role]}`} />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title="Change password">
          <div className="space-y-4">
            <Input label="Current password" type="password" autoComplete="current-password" value={pw.current_password} onChange={setPw("current_password")} />
            <Input label="New password (min 8 characters)" type="password" autoComplete="new-password" value={pw.new_password} onChange={setPw("new_password")} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={setPw("confirm")} />
            <div className="flex justify-end">
              <Button onClick={changePassword} busy={busy} disabled={!pw.current_password || !pw.new_password}>Change password</Button>
            </div>
          </div>
        </Card>

        <Card title="Personal API keys">
          <p className="text-sm text-slate-500 mb-3">
            For submitting daily reports or timesheets from another app or script. Keys act as you and last one year.
          </p>
          <div className="flex gap-2">
            <Input className="flex-1" placeholder="Label, e.g. Report bot" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button icon={KeyRound} onClick={createKey} busy={busy} className="self-start">Create key</Button>
          </div>
          {newKey && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 mb-2">Copy this key now; it won't be shown again.</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs break-all">{newKey}</code>
                <Button size="sm" variant="secondary" icon={Copy} onClick={() => navigator.clipboard.writeText(newKey).then(() => toast("Copied"))}>Copy</Button>
              </div>
            </div>
          )}
          <div className="mt-4 -mx-5 -mb-5 border-t border-slate-100">
            <Table
              rows={keys.data?.items || []}
              empty="No API keys."
              columns={[
                { key: "label", label: "Label" },
                { key: "created_at", label: "Created", render: (r) => date(r.created_at) },
                { key: "last_used_at", label: "Last used", render: (r) => (r.last_used_at ? dateTime(r.last_used_at) : "Never") },
                { key: "x", label: "", render: (r) => (
                  <button onClick={() => revoke(r.id)} className="text-slate-400 hover:text-red-600" aria-label="Revoke key"><Trash2 className="h-4 w-4" /></button>
                ) },
              ]}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
