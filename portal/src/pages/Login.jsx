import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button, Input } from "../components/ui";
import { BrandLogo } from "../components/Brand";

export default function Login() {
  const { user, login, expired } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Always start on the dashboard; each role sees its own sections there.
  if (user) return <Navigate to="/" replace />;

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
          <BrandLogo className="mx-auto h-28 w-auto" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Company Portal</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        {expired && <p className="text-sm rounded-lg bg-amber-50 text-amber-800 p-3">Your session ended for security. Please sign in again.</p>}
        <Input label="Email" type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="rounded border-slate-300" />
          Keep me signed in on this device (7 days)
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" busy={busy} icon={LogIn} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
