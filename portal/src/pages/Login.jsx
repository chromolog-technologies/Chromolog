import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button, Input } from "../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email.trim(), form.password, form.remember);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-sidebar px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 flex items-center justify-center text-white text-lg font-bold">C</div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Chromolog Portal</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        <Input label="Email" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="rounded border-slate-300" />
          Keep me signed in on this device
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" busy={busy} icon={LogIn} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
