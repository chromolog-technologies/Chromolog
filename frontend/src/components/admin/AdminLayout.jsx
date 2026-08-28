import React, { useState } from "react";
import { LayoutDashboard, Users, BarChart3, Layers, Briefcase, LogOut, ArrowLeft, Shield, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../BrandLogo";

export default function AdminLayout({ activeTab, setActiveTab, children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "leads", label: "Lead CRM (Multi-Source)", icon: Users, badge: "CRM" },
    { id: "seo", label: "SEO Meta CRUD Manager", icon: Globe, badge: "SEO" },
    { id: "analytics", label: "Analytics & Search Console", icon: BarChart3 },
    { id: "services", label: "Services CMS", icon: Layers },
    { id: "projects", label: "Portfolio Projects", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-slate-100 flex font-body">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/[0.08] bg-surface/80 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <BrandLogo className="h-9 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-accent font-heading">
              Admin
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
                      : "text-muted-text hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-white/[0.08] space-y-3 bg-white/[0.01]">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent font-heading font-extrabold text-xs grid place-items-center">
                {user?.name?.[0] || "A"}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold font-heading text-white truncate max-w-[110px]">{user?.name || "Admin User"}</p>
                <p className="text-[10px] text-muted-text truncate max-w-[110px]">{user?.email || "admin@chromolog.com"}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-muted-text hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-heading font-bold text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Site
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 text-accent grid place-items-center md:hidden">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                Chromolog Command Center
              </h1>
              <p className="text-xs text-muted-text font-body">
                Multi-Source Lead CRM, GA4 Analytics &amp; Digital Systems Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-heading font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Systems Sync
            </span>
          </div>
        </div>

        {/* Dynamic Admin View */}
        {children}
      </main>
    </div>
  );
}
