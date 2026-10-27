import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { isStrong } from "../lib/password";
import { Button, Input, Loading } from "../components/ui";
import PasswordField from "../components/PasswordField";
import { BrandLogo } from "../components/Brand";

/** Opened from the emailed link: activate a new account or reset the password, then sign in. */
export default function Activate() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const { refreshMe } = useAuth();
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`auth/link?token=${encodeURIComponent(token)}`)
      .then(setLink)
      .catch((e) => setError(e.message));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isStrong(form.password, link)) return setError("The password doesn't meet all the rules yet.");
    if (form.password !== form.confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      await api("auth/link", { method: "POST", body: { token, password: form.password } });
      await refreshMe();
      nav("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const invite = link?.kind === "invite";
  return (
    <div className="min-h-full flex items-center justify-center bg-sidebar px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div className="text-center">
          <BrandLogo className="mx-auto h-24 w-auto" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">{link ? (invite ? "Activate your account" : "Set a new password") : "Company Portal"}</h1>
          {link && <p className="text-sm text-slate-500">{invite ? `Welcome, ${link.name}. Choose a password to finish setting up your account.` : `Hello ${link.name}, choose a new password.`}</p>}
        </div>
        {!link && !error && <Loading />}
        {!link && error && (
          <div className="space-y-4">
            <p className="text-sm rounded-lg bg-amber-50 text-amber-800 p-3" role="alert">{error}</p>
            <Link to="/login" className="block text-center text-sm text-brand-700 hover:underline">Go to sign in</Link>
          </div>
        )}
        {link && (
          <>
            <Input label="Sign-in email" value={link.email} readOnly disabled autoComplete="username" />
            <PasswordField label="New password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} who={link} />
            <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" busy={busy} icon={KeyRound} className="w-full">{invite ? "Activate and sign in" : "Save password and sign in"}</Button>
          </>
        )}
      </form>
    </div>
  );
}
