import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, RotateCcw, DatabaseBackup, Download, CloudUpload, Unplug, ExternalLink } from "lucide-react";
import { api, downloadFile } from "../../lib/api";
import { dateTime, label } from "../../lib/format";
import { useApi, useAction, useToast, Async, PageHeader, Card, Table, Badge, Button } from "../../components/ui";

function describe(job, detail) {
  if (!detail) return "—";
  if (typeof detail === "string") return detail;
  if (job === "recurring") return Array.isArray(detail) ? (detail.length ? `${detail.length} invoice(s): ${detail.map((i) => i.number).join(", ")}` : "No invoices due") : "";
  if (job === "backup") {
    const where = detail.offsite?.status === "sent" ? `copied to ${detail.offsite.to}` : "kept on the server only";
    return `${detail.file} · ${(detail.size / 1024).toFixed(0)} KB · ${detail.uploads} uploaded files${detail.locked ? " · locked" : ""} · ${where}`;
  }
  if (job === "digest") return detail.note || `${detail.sent} digest email(s) sent`;
  if (job === "cleanup") return `Removed ${detail.chats} old chat(s) with no lead (older than ${detail.chat_months} months) and ${detail.requests} anti-spam record(s) older than ${detail.requests_days} days`;
  return JSON.stringify(detail);
}

/** Where the daily backup goes besides the server: Google Drive (connect once) or a separate inbox. */
function OffsiteCard({ offsite, run, busy, reload }) {
  const g = offsite.google || {};
  const last = offsite.last;
  const connect = () => run(async () => {
    const { url } = await api("system/google/connect", { method: "POST" });
    window.location.assign(url);
  });
  const disconnect = () => run(async () => {
    await api("system/google", { method: "DELETE" });
    reload();
  }, "Google Drive disconnected");

  let status;
  if (!offsite.method) status = <Badge tone="amber">Not set up</Badge>;
  else if (offsite.method === "google_drive" && !g.connected) status = <Badge tone="amber">Google Drive not connected</Badge>;
  else status = <Badge tone="green">{offsite.method === "google_drive" ? "Google Drive connected" : "Email copy on"}</Badge>;

  return (
    <Card
      title="Off-site copy"
      actions={offsite.method === "google_drive" && (g.connected ? (
        <>
          {g.folder_url && (
            <a href={g.folder_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline mr-2">
              Open folder <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Button size="sm" variant="secondary" icon={Unplug} onClick={disconnect} busy={busy}>Disconnect</Button>
        </>
      ) : (
        <Button size="sm" icon={CloudUpload} onClick={connect} busy={busy} disabled={!g.configured}>Connect Google Drive</Button>
      ))}
    >
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <div><dt className="text-slate-500">Status</dt><dd className="mt-0.5">{status}</dd></div>
        <div><dt className="text-slate-500">Last copy</dt><dd>{last ? `${dateTime(last.at)} · ${(last.size / 1024).toFixed(0)} KB · ${last.to}` : "None yet"}</dd></div>
        <div><dt className="text-slate-500">Password lock</dt><dd>{offsite.locked ? "On (backup_password in config.php)" : "Off: set backup_password in config.php"}</dd></div>
      </dl>
      {!offsite.method && (
        <p className="mt-3 text-xs text-slate-500">Backups are kept only on this server. If the hosting account is lost, so are they. Set up the off-site copy as described in the portal README (Back-ups).</p>
      )}
      {offsite.method === "google_drive" && !g.configured && (
        <p className="mt-3 text-xs text-slate-500">Add the Google <code>client_id</code> and <code>client_secret</code> to config.php first (portal README, Back-ups). Allowed redirect URI: <code className="break-all">{g.redirect_uri}</code></p>
      )}
      {offsite.method === "google_drive" && g.connected && (
        <p className="mt-3 text-xs text-slate-500">Connected {dateTime(g.connected_at)}. Each daily backup is uploaded to the “Chromolog backups” folder in Google Drive. The portal can only see the files it created there.</p>
      )}
    </Card>
  );
}

export default function Automation() {
  const res = useApi("system/jobs");
  const [run, busy] = useAction();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Back from Google's sign-in page.
  useEffect(() => {
    if (params.get("drive") === "connected") toast("Google Drive connected. The next backup will be copied there.");
    else if (params.get("drive_error")) toast(params.get("drive_error"), "error");
    if (params.has("drive") || params.has("drive_error")) setParams({}, { replace: true });
  }, [params, setParams, toast]);

  const runDaily = (force) => run(async () => {
    const d = await api("system/run-daily", { method: "POST", body: { force } });
    res.reload();
    return d;
  }, force ? "Daily jobs ran again" : "Daily jobs checked");

  const retryTriggers = () => run(async () => {
    const r = await api("system/triggers", { method: "POST" });
    res.reload();
    toast(r.message, r.missing ? "error" : "success");
  });

  // Reload even when the off-site copy fails: the copy on the server was still made.
  const backupNow = () => run(async () => {
    try {
      await api("system/backup", { method: "POST" });
    } finally {
      res.reload();
    }
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
            {d.offsite && <OffsiteCard offsite={d.offsite} run={run} busy={busy} reload={res.reload} />}
            {d.database && (
              <Card title="Database">
                <dl className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-slate-500">Server</dt><dd>MySQL / MariaDB {d.database.server}</dd></div>
                  <div><dt className="text-slate-500">Moved from the old SQLite file</dt><dd>
                    {d.database.sqlite_import?.at ? `Yes, ${dateTime(d.database.sqlite_import.at)}` : d.database.sqlite_import?.skipped || "Not needed"}
                  </dd></div>
                  <div><dt className="text-slate-500">Database-level protection</dt><dd>
                    {d.database.protected_by_triggers.length >= (d.database.triggers_expected || 1)
                      ? "On (history and issued invoices locked)"
                      : d.database.protected_by_triggers.length
                        ? `Partly on (${d.database.protected_by_triggers.length} of ${d.database.triggers_expected} rules)`
                        : "Enforced by the portal only (host didn't allow triggers)"}
                    {d.database.protected_by_triggers.length < (d.database.triggers_expected || 1) && (
                      <button type="button" className="ml-2 text-brand-700 hover:underline text-xs" onClick={retryTriggers} disabled={busy}>Try again</button>
                    )}
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
                Each backup contains the full database and every uploaded bill and contract. The newest 14 are kept on the server, and the off-site copy above keeps them safe if the server is lost.
              </p>
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
