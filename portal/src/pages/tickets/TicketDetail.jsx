import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Send } from "lucide-react";
import { api } from "../../lib/api";
import { dateTime, label } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Badge, Button, Select, Textarea } from "../../components/ui";
import { TICKET_STATUSES, TICKET_PRIORITIES, dueIn } from "./Tickets";

export default function TicketDetail() {
  const { id } = useParams();
  const res = useApi(`tickets/${id}`);
  const [reply, setReply] = useState({ body: "", internal: false });
  const [run, busy] = useAction();
  const manage = res.data?.access === "manage";
  const users = useApi(manage ? "users/options" : null);

  const update = (body, msg) => run(async () => {
    await api(`tickets/${id}`, { method: "PUT", body });
    res.reload();
  }, msg);

  const send = () => run(async () => {
    await api(`tickets/${id}/comments`, { method: "POST", body: reply });
    setReply({ body: "", internal: false });
    res.reload();
  }, reply.internal ? "Note added" : "Reply logged");

  return (
    <Async result={res}>
      {({ ticket: t, comments, access }) => {
        const done = ["resolved", "closed"].includes(t.status);
        return (
          <>
            <Link to="/tickets" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
              <ArrowLeft className="h-4 w-4" /> Tickets
            </Link>
            <PageHeader title={`${t.number} · ${t.subject}`} subtitle={[t.client, `via ${label(t.channel)}`, `opened ${dateTime(t.created_at)} by ${t.created_by_name || "—"}`].filter(Boolean).join(" · ")} />
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6">
                {t.description && <Card><p className="text-sm whitespace-pre-line text-slate-700">{t.description}</p></Card>}
                <Card title="Conversation & notes">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-400">No updates yet.</p>
                  ) : (
                    <ol className="space-y-3">
                      {comments.map((c) => (
                        <li key={c.id} className={`rounded-lg px-3 py-2 text-sm ${c.internal ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"}`}>
                          <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                            {c.internal ? <Lock className="h-3 w-3" /> : null}
                            {c.internal ? "Internal note" : "Update to client"} · {c.user_name || "System"} · {dateTime(c.created_at)}
                          </div>
                          <p className="whitespace-pre-line text-slate-700">{c.body}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                    <Textarea placeholder="Log what you told the client, or add an internal note…" value={reply.body} onChange={(e) => setReply({ ...reply, body: e.target.value })} />
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={reply.internal} onChange={(e) => setReply({ ...reply, internal: e.target.checked })} className="rounded border-slate-300" />
                        Internal note (doesn't count as a response to the client)
                      </label>
                      <Button icon={Send} onClick={send} busy={busy} disabled={!reply.body.trim()}>Save</Button>
                    </div>
                  </div>
                </Card>
              </div>

              <Card title="Details">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center gap-3">
                    <dt className="text-slate-500">Status</dt>
                    <dd>
                      {access === "creator" ? <Badge status={t.status === "open" ? "new" : t.status}>{label(t.status)}</Badge> : (
                        <select value={t.status} onChange={(e) => update({ status: e.target.value }, "Status updated")} className="rounded-md text-sm ring-1 ring-slate-300 border-0 py-1 px-2" aria-label="Status">
                          {TICKET_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                        </select>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <dt className="text-slate-500">Priority</dt>
                    <dd>
                      {manage ? (
                        <select value={t.priority} onChange={(e) => update({ priority: e.target.value }, "Priority updated; targets recalculated")} className="rounded-md text-sm ring-1 ring-slate-300 border-0 py-1 px-2" aria-label="Priority">
                          {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                        </select>
                      ) : <Badge status={t.priority} />}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <dt className="text-slate-500">Assigned to</dt>
                    <dd>
                      {manage ? (
                        <Select value={t.assignee_id || ""} onChange={(e) => update({ assignee_id: e.target.value || null }, "Assigned")} placeholder="Unassigned" options={(users.data?.items || []).map((u) => [u.id, u.name])} />
                      ) : (t.assignee_name || "Unassigned")}
                    </dd>
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <Target label="First response" due={t.response_due_at} doneAt={t.first_response_at} />
                    <Target label="Resolution" due={t.resolve_due_at} doneAt={done ? t.resolved_at : null} />
                  </div>
                </dl>
              </Card>
            </div>
          </>
        );
      }}
    </Async>
  );
}

function Target({ label: text, due, doneAt }) {
  const met = doneAt && doneAt <= due;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{text}</dt>
      <dd className="text-right">
        {doneAt ? (
          <span className={met ? "text-emerald-700" : "text-red-600"}>{met ? "On time" : "Late"} · {dateTime(doneAt)}</span>
        ) : (
          <span className={dueIn(due).includes("overdue") ? "text-red-600 font-medium" : "text-slate-700"}>Due {dueIn(due)}</span>
        )}
      </dd>
    </div>
  );
}
