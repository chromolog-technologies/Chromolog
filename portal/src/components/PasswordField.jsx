import { useState } from "react";
import { Check, X, Eye, EyeOff, Wand2 } from "lucide-react";
import { passwordChecks, generatePassword } from "../lib/password";
import { Field } from "./ui";

/**
 * New-password input with a live checklist. `who` = {name, email} so the checklist can
 * flag passwords containing them. `allowGenerate` adds a "Generate" button (for admins).
 */
export default function PasswordField({ label = "New password", value, onChange, who, allowGenerate = false, autoComplete = "new-password" }) {
  const [show, setShow] = useState(false);
  const checks = passwordChecks(value, who);
  const passed = checks.filter((c) => c.ok).length;
  const strength = value ? passed / checks.length : 0;
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-500"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {allowGenerate && (
          <button
            type="button"
            onClick={() => {
              onChange(generatePassword());
              setShow(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-3 text-xs font-medium ring-1 ring-inset ring-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Wand2 className="h-3.5 w-3.5" /> Generate
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
        <div
          className={`h-1.5 rounded-full transition-all ${strength === 1 ? "bg-emerald-500" : strength >= 0.6 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${Math.max(strength * 100, value ? 8 : 0)}%` }}
        />
      </div>
      <ul className="mt-2 grid gap-1 text-xs">
        {checks.map((c) => (
          <li key={c.text} className={`flex items-center gap-1.5 ${c.ok ? "text-emerald-700" : "text-slate-500"}`}>
            {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
            {c.text}
          </li>
        ))}
      </ul>
    </Field>
  );
}
