import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { dateTime, label } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Stat, Table, Badge, Button, Modal, Input, Select, Textarea, Tabs } from "../../components/ui";

export const TICKET_STATUSES = ["open", "in_progress", "waiting_client", "resolved", "closed"];
export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"];
export const CHANNELS = ["phone", "whatsapp", "email", "portal", "in_person", "other"];

/** "in 3h" / "2h overdue" relative to now, for UTC timestamps from the API. */
export function dueIn(utc) {
  if (!utc) return "";
  const ms = new Date(utc.replace(" ", "T") + "Z").getTime() - Date.now();
  const h = Math.abs(ms) / 3600000;
  const txt = h >= 48 ? `${Math.round(h / 24)}d` : h >= 1 ? `${Math.round(h)}h` : `${Math.max(1, Math.round(h * 60))}m`;
  return ms >= 0 ? `in ${txt}` : `${txt} overdue`;
}

export default function Tickets() {
  const nav = useNavigate();
  const { user } = useAuth();
  const manager = can(user, "project");
  const [status, setStatus] = useState("active");
  const [creating, setCreating] = useState(false);
  const res = useApi(`tickets?status=${status === "breached" ? "active&breached=1" : status}`);
  const stats = useApi(manager ? "tickets/stats" : null);

  return (
    <>
      <PageHeader
        title="Support tickets"
        subtitle={manager ? "Client issues for AMC and support contracts, with response and resolution targets." : "Tickets assigned to you or logged by you."}
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New ticket</Button>}
      />
      {stats.data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat label="Open tickets" value={stats.data.open} hint={`${stats.data.unassigned} unassigned`} />
          <Stat label="Past target" value={stats.data.breached} tone={stats.data.breached ? "red" : "slate"} onClick={() => setStatus("breached")} />
          <Stat label="Avg first response (30 days)" value={stats.data.last_30_days.avg_first_response_hours === null ? "—" : `${stats.data.last_30_days.avg_first_response_hours} h`} />
          <Stat
            label="On time (30 days)"
            value={stats.data.last_30_days.responded_on_time_pct === null ? "—" : `${stats.data.last_30_days.responded_on_time_pct}%`}
            hint={stats.data.last_30_days.resolved_on_time_pct === null ? "responses" : `responses · ${stats.data.last_30_days.resolved_on_time_pct}% resolved on time`}
          />
        </div>
      )}
      <Tabs value={status} onChange={setStatus} tabs={[["active", "Active"], ["breached", "Past target"], ["waiting_client", "Waiting on client"], ["resolved", "Resolved"], ["closed", "Closed"], ["all", "All"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/tickets/${r.id}`)}
              empty="No tickets here."
              columns={[
                { key: "number", label: "Ticket", render: (r) => (
                  <span className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                    {r.breached ? <AlertTriangle className="h-4 w-4 text-red-500" aria-label="Past target" /> : null}{r.number}
                  </span>
                ) },
                { key: "subject", label: "Subject", className: "max-w-xs truncate" },
                { key: "client", label: "Client" },
                { key: "priority", label: "Priority", render: (r) => <Badge status={r.priority} /> },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status === "open" ? "new" : r.status}>{label(r.status)}</Badge> },
                { key: "assignee_name", label: "Assigned to", render: (r) => r.assignee_name || <span className="text-amber-700">Unassigned</span> },
                { key: "due", label: "Target", render: (r) => {
                  if (["resolved", "closed"].includes(r.status)) return <span className="text-xs text-slate-400">done</span>;
                  const due = r.first_response_at ? r.resolve_due_at : r.response_due_at;
                  return <span className={`text-xs ${r.breached ? "text-red-600 font-medium" : "text-slate-500"}`}>{r.first_response_at ? "Resolve " : "Respond "}{dueIn(due)}</span>;
                } },
                { key: "created_at", label: "Opened", render: (r) => dateTime(r.created_at) },
              ]}
            />
          )}
        </Async>
      </Card>
      {creating && <TicketForm onClose={() => setCreating(false)} onSaved={(t) => nav(`/tickets/${t.id}`)} />}
    </>
  );
}

function TicketForm({ onClose, onSaved }) {
  const { user } = useAuth();
  const manager = can(user, "project");
  const seesClients = can(user, "marketing", "accounts", "project");
  const clients = useApi(seesClients ? "clients" : null);
  const users = useApi(manager ? "users/options" : null);
  const [f, set] = useForm({ subject: "", description: "", client_id: "", priority: "medium", channel: "phone", assignee_id: "" });
  const [run, busy] = useAction();
  const save = () => run(async () => {
    const d = await api("tickets", { method: "POST", body: { ...f, client_id: f.client_id || null, assignee_id: f.assignee_id || null } });
    onSaved(d.ticket);
    onClose();
  }, "Ticket created");
  return (
    <Modal open wide onClose={onClose} title="New support ticket" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Create ticket</Button></>}>
      <Input label="Subject *" value={f.subject} onChange={set("subject")} placeholder="e.g. Token display not updating in OP block" />
      <Textarea label="What's the problem?" value={f.description} onChange={set("description")} rows={4} />
      <div className="grid sm:grid-cols-2 gap-4">
        {seesClients && (
          <Select label="Client" value={f.client_id} onChange={set("client_id")} placeholder="—" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} />
        )}
        <Select label="Priority" value={f.priority} onChange={set("priority")} options={TICKET_PRIORITIES.map((p) => [p, label(p)])} />
        <Select label="Reported via" value={f.channel} onChange={set("channel")} options={CHANNELS.map((c) => [c, label(c)])} />
        {manager && <Select label="Assign to" value={f.assignee_id} onChange={set("assignee_id")} placeholder="Unassigned" options={(users.data?.items || []).map((u) => [u.id, u.name])} />}
      </div>
    </Modal>
  );
}
