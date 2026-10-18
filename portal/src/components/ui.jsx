import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Loader2, X, AlertTriangle, CheckCircle2, Inbox } from "lucide-react";
import { api } from "../lib/api";

// ── Data loading ────────────────────────────────────────────────────────

/** Load `path` from the API; returns { data, error, loading, reload }. Pass null to skip. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path, path });
  const [tick, setTick] = useState(0);
  // A new path must never show the previous path's data (e.g. quotation → invoice on the same screen).
  if (state.path !== path) {
    setState({ data: null, error: null, loading: !!path, path });
  }
  useEffect(() => {
    if (!path) return;
    let alive = true;
    // Same path (reload): keep showing the current data while refreshing.
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path)
      .then((data) => alive && setState({ data, error: null, loading: false, path }))
      .catch((error) => alive && setState({ data: null, error, loading: false, path }));
    return () => {
      alive = false;
    };
  }, [path, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

// ── Toasts ──────────────────────────────────────────────────────────────

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 no-print" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg text-white ${
              t.type === "error" ? "bg-red-600" : "bg-slate-900"
            }`}
          >
            {t.type === "error" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Wrap an async action: shows errors as toasts and tracks a busy flag. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const result = await fn();
        if (successMessage) toast(successMessage);
        return result;
      } catch (e) {
        toast(e.message || "Something went wrong", "error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );
  return [run, busy];
}

// ── Layout primitives ───────────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 no-print">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", padded = true }) {
  return (
    <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = "slate", onClick }) {
  const tones = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    brand: "text-brand-600",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${onClick ? "hover:border-brand-500 transition-colors" : ""}`}
    >
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tones[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </Tag>
  );
}

const BADGE_TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

const STATUS_TONES = {
  new: "blue", contacted: "brand", meeting: "brand", proposal: "amber", won: "green", lost: "slate", spam: "slate",
  hot: "red", warm: "amber", cold: "blue",
  draft: "slate", sent: "blue", accepted: "green", rejected: "red", invoiced: "brand",
  partially_paid: "amber", paid: "green", cancelled: "slate", overdue: "red",
  active: "green", expired: "red", planning: "blue", on_hold: "amber", completed: "brand",
  todo: "slate", in_progress: "blue", review: "amber", done: "green",
  low: "slate", medium: "blue", high: "amber", urgent: "red",
  pending: "amber", approved: "green",
};

export function Badge({ children, tone, status }) {
  const t = tone || STATUS_TONES[status] || "slate";
  const text = children ?? String(status || "").replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize whitespace-nowrap ${BADGE_TONES[t]}`}>
      {text}
    </span>
  );
}

export function Button({ children, variant = "primary", size = "md", busy, icon: Icon, className = "", ...props }) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" };
  return (
    <button
      type="button"
      disabled={busy || props.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────

const inputCls =
  "block w-full rounded-lg border-0 py-2 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 disabled:bg-slate-50";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Input({ label, hint, className, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input className={inputCls} {...props} />
    </Field>
  );
}

export function Textarea({ label, hint, className, rows = 3, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea rows={rows} className={inputCls} {...props} />
    </Field>
  );
}

export function Select({ label, hint, className, options = [], placeholder, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className={inputCls} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const [value, text] = Array.isArray(o) ? o : typeof o === "object" ? [o.value, o.label] : [o, o];
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

/** Controlled form state helper: const [f, set, setForm] = useForm({...}); <Input value={f.x} onChange={set("x")} /> */
export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const set = useCallback(
    (key) => (e) => {
      const v = e && e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
      setForm((f) => ({ ...f, [key]: v }));
    },
    []
  );
  return [form, set, setForm];
}

// ── Table ───────────────────────────────────────────────────────────────

/**
 * columns: [{ key, label, render?(row), className?, align? }]
 */
export function Table({ columns, rows, onRowClick, empty = "Nothing here yet.", footer }) {
  if (!rows?.length) return <Empty text={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr
              key={r.id ?? i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 text-slate-700 ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.className || ""}`}>
                  {c.render ? c.render(r) : (r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t border-slate-200 bg-slate-50/60">{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Empty({ text = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Inbox className="h-8 w-8 mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between gap-3">
      <span>{error.message || String(error)}</span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Render loading / error / content for a useApi() result. */
export function Async({ result, children }) {
  if (result.loading && !result.data) return <Loading />;
  if (result.error) return <ErrorBox error={result.error} onRetry={result.reload} />;
  if (!result.data) return null;
  return children(result.data);
}

// ── Modal ───────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector("input, select, textarea")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8 no-print" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white rounded-xl shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title = "Are you sure?", message, confirmLabel = "Delete", busy }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto no-print">
      {tabs.map(([key, text]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
            value === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
