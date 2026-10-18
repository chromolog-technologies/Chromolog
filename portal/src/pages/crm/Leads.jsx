import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Download, Search } from "lucide-react";
import { api, downloadFile } from "../../lib/api";
import { money, date, label, today } from "../../lib/format";
import {
  useApi, useAction, useForm, Async, PageHeader, Card, Table, Badge, Button, Modal, Input, Select, Textarea, Tabs,
} from "../../components/ui";

export const LEAD_STATUSES = ["new", "contacted", "meeting", "proposal", "won", "lost", "spam"];
export const SOURCES = ["manual", "website_chat", "contact_form", "free_consultation", "service_quote", "digital_audit", "newsletter", "whatsapp", "phone", "email", "referral", "instagram", "facebook", "linkedin", "outbound", "walk_in", "other"];

export default function Leads() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const followUp = params.get("follow_up_due") || "";
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (followUp) qs.set("follow_up_due", "1");
  if (q) qs.set("q", q);
  const leads = useApi(`leads?${qs}`);

  const tab = followUp ? "follow" : status || "open";
  const setTab = (t) => setParams(t === "open" ? {} : t === "follow" ? { follow_up_due: "1" } : { status: t });

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Every inquiry from the website, chat, forms and manual entries."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => downloadFile("leads/export", `leads_${today()}.csv`)}>
              Export CSV
            </Button>
            <Button icon={Plus} onClick={() => setAdding(true)}>
              Add lead
            </Button>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[["open", "All open"], ["follow", "Follow-ups due"], ...LEAD_STATUSES.map((s) => [s, label(s)])]}
      />
      <Card padded={false}>
        <form
          className="flex gap-2 p-3 border-b border-slate-100"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
          }}
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, company"
              className="w-full rounded-lg py-2 pl-9 pr-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-500 border-0"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Async result={leads}>
          {(d) => (
            <Table
              rows={d.items}
              onRowClick={(r) => nav(`/leads/${r.id}`)}
              empty="No leads match."
              columns={[
                { key: "full_name", label: "Name", render: (r) => <span className="font-medium text-slate-900">{r.full_name}</span> },
                { key: "company", label: "Company" },
                { key: "contact", label: "Contact", render: (r) => <div className="text-xs">{r.email}<br />{r.phone}</div> },
                { key: "source", label: "Source", render: (r) => <span className="text-xs">{label(r.source)}</span> },
                { key: "score", label: "Score", render: (r) => (r.score ? <Badge status={r.score} /> : "—") },
                { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                { key: "estimated_value", label: "Value", align: "right", render: (r) => (r.estimated_value ? money(r.estimated_value) : "—") },
                { key: "next_follow_up", label: "Follow up", render: (r) => <span className={r.next_follow_up && r.next_follow_up <= today() ? "text-amber-700 font-medium" : ""}>{date(r.next_follow_up)}</span> },
                { key: "assigned_name", label: "Owner" },
                { key: "created_at", label: "Created", render: (r) => date(r.created_at) },
              ]}
            />
          )}
        </Async>
      </Card>
      <LeadForm open={adding} onClose={() => setAdding(false)} onSaved={(lead) => nav(`/leads/${lead.id}`)} />
    </>
  );
}

export function LeadForm({ open, onClose, onSaved, lead }) {
  const users = useApi(open ? "users/options" : null);
  const [f, set] = useForm({
    full_name: lead?.full_name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    company: lead?.company || "",
    industry: lead?.industry || "",
    location: lead?.location || "",
    service_interest: lead?.service_interest || "",
    budget_range: lead?.budget_range || "",
    timeline: lead?.timeline || "",
    estimated_value: lead?.estimated_value ?? "",
    source: lead?.source || "manual",
    status: lead?.status || "new",
    score: lead?.score || "",
    assigned_to: lead?.assigned_to || "",
    next_follow_up: lead?.next_follow_up || "",
    summary: lead?.summary || "",
  });
  const [run, busy] = useAction();

  const save = () =>
    run(async () => {
      const body = { ...f, score: f.score || null, assigned_to: f.assigned_to || null, estimated_value: f.estimated_value === "" ? null : f.estimated_value };
      const d = lead ? await api(`leads/${lead.id}`, { method: "PUT", body }) : await api("leads", { method: "POST", body });
      onSaved(d.lead);
      onClose();
    }, lead ? "Lead updated" : "Lead added");

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={lead ? "Edit lead" : "Add lead"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} busy={busy}>Save</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Name *" value={f.full_name} onChange={set("full_name")} />
        <Input label="Company" value={f.company} onChange={set("company")} />
        <Input label="Email" type="email" value={f.email} onChange={set("email")} />
        <Input label="Phone / WhatsApp" value={f.phone} onChange={set("phone")} />
        <Input label="Industry" value={f.industry} onChange={set("industry")} />
        <Input label="Location" value={f.location} onChange={set("location")} />
        <Input label="Service interest" value={f.service_interest} onChange={set("service_interest")} />
        <Input label="Estimated deal value" type="number" min="0" value={f.estimated_value} onChange={set("estimated_value")} />
        <Input label="Budget range" value={f.budget_range} onChange={set("budget_range")} />
        <Input label="Timeline" value={f.timeline} onChange={set("timeline")} />
        <Select label="Source" value={f.source} onChange={set("source")} options={SOURCES.map((s) => [s, label(s)])} />
        <Select label="Status" value={f.status} onChange={set("status")} options={LEAD_STATUSES.map((s) => [s, label(s)])} />
        <Select label="Score" value={f.score} onChange={set("score")} placeholder="Unscored" options={[["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"]]} />
        <Select label="Owner" value={f.assigned_to} onChange={set("assigned_to")} placeholder="Unassigned" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
        <Input label="Next follow-up" type="date" value={f.next_follow_up} onChange={set("next_follow_up")} />
      </div>
      <Textarea label="Summary / requirement" value={f.summary} onChange={set("summary")} />
    </Modal>
  );
}
