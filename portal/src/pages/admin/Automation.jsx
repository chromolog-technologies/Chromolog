import { Play, RotateCcw, DatabaseBackup, Download } from "lucide-react";
import { api, downloadFile } from "../../lib/api";
import { dateTime, label } from "../../lib/format";
import { useApi, useAction, Async, PageHeader, Card, Table, Badge, Button } from "../../components/ui";

function describe(job, detail) {
  if (!detail) return "—";
  if (typeof detail === "string") return detail;
  if (job === "recurring") return Array.isArray(detail) ? (detail.length ? `${detail.length} invoice(s): ${detail.map((i) => i.number).join(", ")}` : "No invoices due") : "";
  if (job === "backup") return `${detail.file} · ${(detail.size / 1024).toFixed(0)} KB · ${detail.uploads} uploaded files`;
  if (job === "digest") return detail.note || `${detail.sent} digest email(s) sent`;
  return JSON.stringify(detail);
}

export default function Automation() {
  const res = useApi("system/jobs");
  const [run, busy] = useAction();

  const runDaily = (force) => run(async () => {
    const d = await api("system/run-daily", { method: "POST", body: { force } });
    res.reload();
    return d;
  }, force ? "Daily jobs ran again" : "Daily jobs checked");

  const backupNow = () => run(async () => {
    await api("system/backup", { method: "POST" });
    res.reload();
  }, "Backup created");

  return (
    <>
      <PageHeader
        title="Automation & backups"
        subtitle="Every morning the server creates due recurring invoices, backs up everything and emails each person their digest."
        actions={
          <>
            <Button variant="secondary" icon={DatabaseBackup} onClick={backupNow} busy={busy}>Back up now</Button>
            <Button variant="secondary" icon={RotateCcw} onClick={() => runDaily(true)} busy={busy}>Run again (force)</Button>
            <Button icon={Play} onClick={() => runDaily(false)} busy={busy}>Run today's jobs</Button>
          </>
        }
      />
      <Async result={res}>
        {(d) => (
          <div className="space-y-6">
            <Card title="Recent runs" padded={false}>
              <Table
                rows={d.runs}
                empty="The daily jobs haven't run yet. Set up the cron job (see the portal README) or press “Run today's jobs”."
                columns={[
                  { key: "created_at", label: "When", render: (r) => dateTime(r.created_at) },
                  { key: "job", label: "Job", render: (r) => label(r.job) },
                  { key: "status", label: "Result", render: (r) => <Badge tone={r.status === "ok" ? "green" : "red"}>{r.status}</Badge> },
                  { key: "detail", label: "Details", render: (r) => <span className="text-xs text-slate-600">{describe(r.job, r.detail)}</span> },
                ]}
              />
            </Card>
            {d.database && (
              <Card title="Database">
                <dl className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-slate-500">Server</dt><dd>MySQL / MariaDB {d.database.server}</dd></div>
                  <div><dt className="text-slate-500">Moved from the old SQLite file</dt><dd>
                    {d.database.sqlite_import?.at ? `Yes, ${dateTime(d.database.sqlite_import.at)}` : d.database.sqlite_import?.skipped || "Not needed"}
                  </dd></div>
                  <div><dt className="text-slate-500">Database-level protection</dt><dd>
                    {d.database.protected_by_triggers.length ? "On (history and issued invoices locked)" : "Enforced by the portal (host doesn't allow triggers)"}
                  </dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(d.database.rows).map(([t, n]) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {label(t)}: <b>{n}</b>{d.database.sqlite_import?.rows?.[t] !== undefined && d.database.sqlite_import.rows[t] !== n ? ` (copied ${d.database.sqlite_import.rows[t]})` : ""}
                    </span>
                  ))}
                </div>
              </Card>
            )}
            <Card title="Backups (newest first)" padded={false}>
              <Table
                rows={d.backups.map((b) => ({ ...b, id: b.file }))}
                empty="No backups yet."
                columns={[
                  { key: "file", label: "File" },
                  { key: "created_at", label: "Created", render: (r) => dateTime(r.created_at) },
                  { key: "size", label: "Size", align: "right", render: (r) => `${(r.size / 1024).toFixed(0)} KB` },
                  { key: "dl", label: "", render: (r) => (
                    <Button size="sm" variant="secondary" icon={Download} onClick={() => run(() => downloadFile(`system/backups/${r.file}`, r.file))}>Download</Button>
                  ) },
                ]}
              />
              <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">
                Each backup contains the full database and every uploaded bill and contract. The newest 14 are kept on the server; download one now and then and keep it somewhere safe (e.g. Google Drive).
              </p>
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
