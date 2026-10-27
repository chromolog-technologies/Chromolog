import { useNavigate } from "react-router-dom";
import { useAuth, can } from "../lib/auth";
import { useApi, Async, PageHeader, Stat, Card, Table, Badge, Button } from "../components/ui";
import { money, date, hours } from "../lib/format";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const dash = useApi("dashboard");
  const myTasks = useApi("tasks?mine=1&open=1");
  const followUps = useApi(can(user, "marketing") ? "leads?follow_up_due=1" : null);
  const overdue = useApi(can(user, "accounts") ? "invoices?status=overdue" : null);
  const missing = useApi(can(user, "project") ? "reports/missing" : null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(" ")[0]}`} subtitle="Here's what needs your attention today." />
      <Async result={dash}>
        {(d) => (
          <div className="space-y-8">
            {d.leads && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Sales & leads</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat label="New leads this month" value={d.leads.new_this_month} onClick={() => nav("/leads")} />
                  <Stat label="Open leads" value={d.leads.open} onClick={() => nav("/leads")} />
                  <Stat label="Won this month" value={d.leads.won_this_month} tone="green" />
                  <Stat label="Follow-ups due" value={d.leads.follow_ups_due} tone={d.leads.follow_ups_due ? "amber" : "slate"} onClick={() => nav("/leads?follow_up_due=1")} />
                </div>
              </section>
            )}

            {d.accounts && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Accounts (this month)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat label="Income" value={money(d.accounts.income_this_month)} tone="green" onClick={() => nav("/reports")} />
                  <Stat label="Expenses" value={money(d.accounts.expenses_this_month)} tone="red" onClick={() => nav("/expenses")} />
                  <Stat label="Net" value={money(d.accounts.net_this_month)} tone={d.accounts.net_this_month >= 0 ? "green" : "red"} />
                  <Stat label="Outstanding invoices" value={money(d.accounts.outstanding)} hint={`${d.accounts.overdue_invoices} overdue`} tone={d.accounts.overdue_invoices ? "amber" : "slate"} onClick={() => nav("/invoices")} />
                  <Stat label="Pending payouts" value={money(d.accounts.pending_payouts)} onClick={() => nav("/payouts")} />
                  <Stat label="Recurring invoices due (7 days)" value={d.accounts.recurring_due_7_days} onClick={() => nav("/recurring")} />
                  <Stat label="Contracts due for renewal" value={d.accounts.contracts_expiring} tone={d.accounts.contracts_expiring ? "amber" : "slate"} onClick={() => nav("/contracts")} />
                </div>
              </section>
            )}

            {d.projects && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Projects & team</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat label="Active projects" value={d.projects.active} onClick={() => nav("/projects")} />
                  <Stat label="Overdue tasks" value={d.projects.overdue_tasks} tone={d.projects.overdue_tasks ? "red" : "slate"} />
                  <Stat label="Timesheets to approve" value={d.projects.pending_timesheets} tone={d.projects.pending_timesheets ? "amber" : "slate"} onClick={() => nav("/approvals")} />
                  <Stat label="Daily reports today" value={`${d.projects.reports_today}`} hint={`${d.projects.people} active people`} onClick={() => nav("/daily-reports")} />
                  <Stat label="Open support tickets" value={d.projects.open_tickets} onClick={() => nav("/tickets")} />
                  <Stat label="Tickets past target" value={d.projects.breached_tickets} tone={d.projects.breached_tickets ? "red" : "slate"} onClick={() => nav("/tickets")} />
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">My work</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="My open tasks" value={d.me.open_tasks} onClick={() => nav("/my/tasks")} />
                <Stat label="Hours this month" value={hours(d.me.hours_this_month)} onClick={() => nav("/my/timesheet")} />
                <Stat
                  label="Today's report"
                  value={d.me.report_submitted_today ? "Submitted" : "Not yet"}
                  tone={d.me.report_submitted_today ? "green" : "amber"}
                  onClick={() => nav("/my/report")}
                />
                {d.me.unpaid_earnings !== null && d.me.unpaid_earnings !== undefined && <Stat label="Unpaid earnings" value={money(d.me.unpaid_earnings)} onClick={() => nav("/my/earnings")} />}
                {d.me.open_tickets > 0 && <Stat label="My open tickets" value={d.me.open_tickets} tone="amber" onClick={() => nav("/tickets")} />}
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              {followUps.data?.items?.length > 0 && (
                <Card title="Lead follow-ups due" padded={false}>
                  <Table
                    rows={followUps.data.items.slice(0, 8)}
                    onRowClick={(r) => nav(`/leads/${r.id}`)}
                    columns={[
                      { key: "full_name", label: "Lead" },
                      { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                      { key: "next_follow_up", label: "Follow up", render: (r) => date(r.next_follow_up) },
                    ]}
                  />
                </Card>
              )}
              {overdue.data?.items?.length > 0 && (
                <Card title="Overdue invoices" padded={false}>
                  <Table
                    rows={overdue.data.items.slice(0, 8)}
                    onRowClick={(r) => nav(`/invoices/${r.id}`)}
                    columns={[
                      { key: "number", label: "Invoice" },
                      { key: "client", label: "Client" },
                      { key: "due", label: "Balance", align: "right", render: (r) => money(r.total - r.amount_paid) },
                      { key: "due_date", label: "Due", render: (r) => date(r.due_date) },
                    ]}
                  />
                </Card>
              )}
              {missing.data?.items?.length > 0 && (
                <Card title="No daily report yet today" actions={<Button size="sm" variant="secondary" onClick={() => nav("/daily-reports")}>View reports</Button>}>
                  <div className="flex flex-wrap gap-2">
                    {missing.data.items.map((m) => (
                      <Badge key={m.id} tone="amber">{m.name}</Badge>
                    ))}
                  </div>
                </Card>
              )}
              <Card title="My open tasks" padded={false}>
                <Async result={myTasks}>
                  {(t) => (
                    <Table
                      rows={t.items.slice(0, 8)}
                      empty="No open tasks assigned to you."
                      onRowClick={(r) => nav(`/projects/${r.project_id}`)}
                      columns={[
                        { key: "title", label: "Task" },
                        { key: "project_name", label: "Project" },
                        { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
                        { key: "due_date", label: "Due", render: (r) => date(r.due_date) },
                      ]}
                    />
                  )}
                </Async>
              </Card>
            </div>
          </div>
        )}
      </Async>
    </>
  );
}
