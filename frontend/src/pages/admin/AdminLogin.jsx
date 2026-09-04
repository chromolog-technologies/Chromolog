import React, { useState } from "react";
import { Lock, Mail, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

export default function AdminLogin({ onLoginSuccess }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@chromologtechnologies.com");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const result = await login(email, password);
    if (result.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="glass" className="max-w-md w-full p-8 border-accent/20 bg-surface/90 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <BrandLogo className="h-12 w-auto mx-auto" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-heading font-bold">
            <Shield className="w-3.5 h-3.5" /> Security Portal Authentication
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Admin Command Center</h1>
          <p className="text-xs text-slate-600">
            Sign in to access Multi-Source CRM, GA4 Search Console Hub, and Content Management.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-heading">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent" /> Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chromologtechnologies.com"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] text-white text-xs font-body focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] text-white text-xs font-body focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full justify-center py-3 text-xs font-heading font-bold"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Admin Portal"} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-4 border-t border-white/[0.06] text-center">
          <a href="/" className="text-xs font-heading text-muted-text hover:text-white transition-colors">
            ← Return to Chromolog Technologies Home
          </a>
        </div>
      </Card>
    </div>
  );
}
