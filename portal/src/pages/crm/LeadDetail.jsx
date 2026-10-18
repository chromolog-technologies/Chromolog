import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, UserCheck, FileText, Trash2, Phone, Mail, MessageCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { money, date, dateTime, label } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Badge, Button, Select, Textarea, Input, Confirm } from "../../components/ui";
import { LeadForm, LEAD_STATUSES } from "./Leads";

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const res = useApi(`leads/${id}`);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState({ type: "note", body: "", next_follow_up: "" });
  const [run, busy] = useAction();

  const setStatus = (status) => run(async () => {
    await api(`leads/${id}`, { method: "PUT", body: { status } });
    res.reload();
  }, "Status updated");

  const addNote = () => run(async () => {
    const body = { type: note.type, body: note.body };
    if (note.next_follow_up) body.next_follow_up = note.next_follow_up;
    await api(`leads/${id}/notes`, { method: "POST", body });
    setNote({ type: "note", body: "", next_follow_up: "" });
    res.reload();
  }, "Activity logged");

  const convert = () => run(async () => {
    const d = await api(`leads/${id}/convert`, { method: "POST" });
    nav(`/clients/${d.client.id}`);
  }, "Converted to client");

  const remove = () => run(async () => {
    await api(`leads/${id}`, { method: "DELETE" });
    nav("/leads");
  }, "Lead deleted");

  return (
    <Async result={res}>
      {({ lead, notes, chat, quotations }) => (
        <>
          <Link to="/leads" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
            <ArrowLeft className="h-4 w-4" /> Leads
          </Link>
          <PageHeader
            title={lead.full_name}
            subtitle={[lead.company, lead.location, label(lead.source)].filter(Boolean).join(" · ")}
            actions={
              <>
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="secondary" icon={FileText} onClick={() => nav(`/quotations/new?lead_id=${lead.id}`)}>New quotation</Button>
                {lead.client_id ? (
                  <Button variant="secondary" icon={UserCheck} onClick={() => nav(`/clients/${lead.client_id}`)}>View client</Button>
                ) : (
                  <Button icon={UserCheck} busy={busy} onClick={convert}>Convert to client</Button>
                )}
                {user.role === "admin" && <Button variant="ghost" icon={Trash2} onClick={() => setDeleting(true)} aria-label="Delete lead" />}
              </>
            }
          />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card title="Details">
                <dl className="space-y-3 text-sm">
                  <Row k="Status">
                    <select value={lead.status} onChange={(e) => setStatus(e.target.value)} className="rounded-md text-sm ring-1 ring-slate-300 border-0 py-1 px-2">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </Row>
                  <Row k="Score">{lead.score ? <Badge status={lead.score} /> : "—"}</Row>
                  <Row k="Email">{lead.email ? <a className="text-brand-600 inline-flex items-center gap-1" href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" />{lead.email}</a> : "—"}</Row>
                  <Row k="Phone">
                    {lead.phone ? (
                      <span className="inline-flex gap-2">
                        <a className="text-brand-600 inline-flex items-center gap-1" href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" />{lead.phone}</a>
                        <a className="text-emerald-600 inline-flex items-center" href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
                      </span>
                    ) : "—"}
                  </Row>
                  <Row k="Industry">{lead.industry || "—"}</Row>
                  <Row k="Interest">{lead.service_interest || "—"}</Row>
                  <Row k="Budget">{lead.budget_range || "—"}</Row>
                  <Row k="Timeline">{lead.timeline || "—"}</Row>
                  <Row k="Deal value">{lead.estimated_value ? money(lead.estimated_value) : "—"}</Row>
                  <Row k="Follow up">{date(lead.next_follow_up)}</Row>
                  <Row k="Created">{dateTime(lead.created_at)}</Row>
                </dl>
                {lead.summary && <p className="mt-4 text-sm text-slate-600 whitespace-pre-line border-t border-slate-100 pt-3">{lead.summary}</p>}
              </Card>
              {quotations.length > 0 && (
                <Card title="Quotations">
                  <ul className="space-y-2 text-sm">
                    {quotations.map((q) => (
                      <li key={q.id} className="flex justify-between">
                        <Link className="text-brand-600" to={`/quotations/${q.id}`}>{q.number}</Link>
                        <span className="flex gap-2 items-center">{money(q.total)} <Badge status={q.status} /></span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card title="Log activity">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })} options={[["note", "Note"], ["call", "Call"], ["email", "Email"], ["meeting", "Meeting"], ["whatsapp", "WhatsApp"]]} />
                  <Input type="date" value={note.next_follow_up} onChange={(e) => setNote({ ...note, next_follow_up: e.target.value })} hint="Next follow-up (optional)" className="sm:col-span-2" />
                </div>
                <Textarea className="mt-3" placeholder="What happened? What was agreed?" value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} />
                <div className="mt-3 flex justify-end">
                  <Button onClick={addNote} busy={busy} disabled={!note.body.trim()}>Save activity</Button>
                </div>
              </Card>

              <Card title="Timeline">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-400">No activity yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {notes.map((n) => (
                      <li key={n.id} className="flex gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                        <div className="text-sm">
                          <div className="text-xs text-slate-400">
                            {label(n.type)} · {n.user_name || "System"} · {dateTime(n.created_at)}
                          </div>
                          <p className="text-slate-700 whitespace-pre-line">{n.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              {chat.length > 0 && (
                <Card title="Website chat transcript">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chat.map((m, i) => (
                      <div key={i} className={`rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-50 ml-8" : "bg-slate-100 mr-8"}`}>
                        <div className="text-[11px] text-slate-400 mb-0.5">{m.role === "user" ? "Visitor" : "Assistant"} · {dateTime(m.created_at)}</div>
                        <p className="whitespace-pre-line">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
          {editing && <LeadForm open lead={lead} onClose={() => setEditing(false)} onSaved={() => res.reload()} />}
          <Confirm open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} busy={busy} message="Delete this lead and its activity? This cannot be undone." />
        </>
      )}
    </Async>
  );
}

function Row({ k, children }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right text-slate-800">{children}</dd>
    </div>
  );
}
