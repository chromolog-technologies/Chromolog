import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { isStrong } from "../lib/password";
import { Button, Input } from "../components/ui";
import PasswordField from "../components/PasswordField";
import { BrandMark } from "../components/Brand";

/** Shown instead of the portal until a new or reset account sets its own password. */
export default function ForcePasswordChange() {
  const { user, refreshMe, logout } = useAuth();
  const [f, setF] = useState({ current_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = f.current_password && isStrong(f.new_password, user) && f.new_password === f.confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (f.new_password !== f.confirm) return setError("The two new passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await api("me/password", { method: "PUT", body: f });
      await refreshMe();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-sidebar px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Set your own password</h1>
            <p className="text-sm text-slate-500">Welcome, {user.name}. For security, replace the password you were given before continuing.</p>
          </div>
        </div>
        <Input label="Password you were given" type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} />
        <PasswordField value={f.new_password} onChange={(v) => setF({ ...f, new_password: v })} who={user} />
        <Input label="Type the new password again" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" icon={LogOut} onClick={logout}>Sign out</Button>
          <Button type="submit" icon={KeyRound} busy={busy} disabled={!ready}>Save and continue</Button>
        </div>
      </form>
    </div>
  );
}
