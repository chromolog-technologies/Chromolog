import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth, can } from "../../lib/auth";
import { money, date, hours, label, today } from "../../lib/format";
import { useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea, Tabs } from "../../components/ui";

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];

export default function Projects() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const res = useApi(`projects${status ? `?status=${status}` : ""}`);
  const [creating, setCreating] = useState(false);
  const manager = can(user, "project");

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={manager ? "All company projects, their progress and effort." : "Projects you are a member of."}
        actions={user.role === "admin" && <Button icon={Plus} onClick={() => setCreating(true)}>New project</Button>}
      />
      <Tabs value={status} onChange={setStatus} tabs={[["", "All"], ...PROJECT_STATUSES.map((s) => [s, label(s)])]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/projects/${r.id}`)}
              empty="No projects yet."
              columns={[
                { key: "name", label: "Project", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
                { key: "client", label: "Client" },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "progress", label: "Progress", render: (r) => {
                  const pct = r.task_count ? Math.round((r.tasks_done / r.task_count) * 100) : 0;
                  return (
                    <div className="flex items-center gap-2 min-w-32">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-slate-500 tabular-nums">{r.tasks_done}/{r.task_count}</span>
                    </div>
                  );
                } },
                { key: "hours_logged", label: "Hours", align: "right", render: (r) => hours(r.hours_logged) },
                { key: "deadline", label: "Deadline", render: (r) => (
                  <span className={r.deadline && r.deadline < today() && !["completed", "cancelled"].includes(r.status) ? "text-red-600 font-medium" : ""}>{date(r.deadline)}</span>
                ) },
                ...(manager ? [{ key: "budget", label: "Budget", align: "right", render: (r) => (Number(r.budget) ? money(r.budget) : "—") }] : []),
              ]}
            />
          )}
        </Async>
      </Card>
      {creating && <ProjectForm onClose={() => setCreating(false)} onSaved={(p) => nav(`/projects/${p.id}`)} />}
    </>
  );
}

export function ProjectForm({ project, onClose, onSaved }) {
  const isNew = !project;
  const clients = useApi("clients");
  const users = useApi(isNew ? "users/options" : null);
  const [f, set] = useForm({
    name: project?.name || "",
    client_id: project?.client_id || "",
    status: project?.status || "active",
    start_date: project?.start_date || today(),
    deadline: project?.deadline || "",
    budget: project?.budget ?? "",
    description: project?.description || "",
  });
  const [members, setMembers] = useState([]);
  const [run, busy] = useAction();

  const save = () => run(async () => {
    const body = { ...f, client_id: f.client_id || null, budget: f.budget || 0 };
    if (isNew) body.members = members.map((m) => ({ user_id: m }));
    const d = await api(isNew ? "projects" : `projects/${project.id}`, { method: isNew ? "POST" : "PUT", body });
    onSaved(d.project);
    onClose();
  }, "Project saved");

  return (
    <Modal open wide onClose={onClose} title={isNew ? "New project" : "Edit project"} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} busy={busy}>Save</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Project name *" value={f.name} onChange={set("name")} />
        <Select label="Client" value={f.client_id} onChange={set("client_id")} placeholder="Internal / no client" options={(clients.data?.items || []).map((c) => [c.id, c.company || c.name])} />
        <Select label="Status" value={f.status} onChange={set("status")} options={PROJECT_STATUSES.map((s) => [s, label(s)])} />
        <Input label="Budget" type="number" min="0" value={f.budget} onChange={set("budget")} />
        <Input label="Start date" type="date" value={f.start_date} onChange={set("start_date")} />
        <Input label="Deadline" type="date" value={f.deadline} onChange={set("deadline")} />
      </div>
      <Textarea label="Description / scope" value={f.description} onChange={set("description")} />
      {isNew && (
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Team members (you can set per-project rates later)</div>
          <div className="flex flex-wrap gap-2">
            {(users.data?.items || []).map((u) => {
              const on = members.includes(u.id);
              return (
                <button key={u.id} type="button" onClick={() => setMembers(on ? members.filter((m) => m !== u.id) : [...members, u.id])}
                  className={`rounded-full px-3 py-1 text-xs ring-1 ${on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-300"}`}>
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
