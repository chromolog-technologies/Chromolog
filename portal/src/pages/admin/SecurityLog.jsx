import { useState } from "react";
import { dateTime } from "../../lib/format";
import { useApi, Async, PageHeader, Card, Table, Badge, Tabs } from "../../components/ui";

const EVENTS = {
  login: ["Signed in", "green"],
  logout: ["Signed out", "slate"],
  login_failed: ["Wrong password", "amber"],
  account_locked: ["Account locked", "red"],
  account_unlocked: ["Unlocked by admin", "blue"],
  password_changed: ["Password changed", "brand"],
  password_change_failed: ["Password change failed", "amber"],
  password_reset: ["Password reset by admin", "brand"],
  user_created: ["User created", "blue"],
  user_disabled: ["User disabled", "red"],
  user_enabled: ["User enabled", "green"],
  role_changed: ["Role changed", "brand"],
  api_key_created: ["API key created", "slate"],
  api_key_revoked: ["API key revoked", "slate"],
};

export default function SecurityLog() {
  const [tab, setTab] = useState("all");
  const res = useApi(`security/log${tab === "failures" ? "?failures=1" : ""}`);
  return (
    <>
      <PageHeader title="Security log" subtitle="Sign-ins, failed attempts, lockouts, password and role changes. Network is shown as a short anonymous code." />
      <Tabs value={tab} onChange={setTab} tabs={[["all", "All events"], ["failures", "Failures & lockouts"]]} />
      <Card padded={false}>
        <Async result={res}>
          {(d) => (
            <Table
              rows={d.items}
              empty="No events yet."
              columns={[
                { key: "created_at", label: "When", render: (r) => dateTime(r.created_at) },
                { key: "action", label: "Event", render: (r) => {
                  const [text, tone] = EVENTS[r.action] || [r.action, "slate"];
                  return <Badge tone={tone}>{text}</Badge>;
                } },
                { key: "user_name", label: "Account", render: (r) => (r.user_name ? <span>{r.user_name} <span className="text-xs text-slate-400">{r.user_email}</span></span> : <span className="text-slate-400">Unknown email</span>) },
                { key: "detail", label: "Details", render: (r) => <span className="text-xs text-slate-600">{r.detail || "—"}</span> },
                { key: "ip_hash", label: "Network", render: (r) => <code className="text-xs text-slate-500">{r.ip_hash || "—"}</code> },
              ]}
            />
          )}
        </Async>
      </Card>
    </>
  );
}
