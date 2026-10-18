import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users2, Building2, FileSignature, FileText, Receipt, Wallet, PiggyBank, BarChart3,
  HandCoins, FolderKanban, ClipboardCheck, NotebookPen, ListTodo, Timer, FileClock, IndianRupee,
  UserCog, Settings, LogOut, Menu, X, UserCircle, Repeat, LifeBuoy, Workflow,
} from "lucide-react";
import { useAuth, can, ROLE_LABELS } from "../lib/auth";
import { BrandMark } from "./Brand";

/** Menu sections; `roles` lists who sees an item (admin always does). Empty = everyone. */
const NAV = [
  { items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, roles: [] }] },
  {
    title: "Sales & CRM",
    items: [
      { to: "/leads", label: "Leads", icon: Users2, roles: ["marketing"] },
      { to: "/quotations", label: "Quotations", icon: FileText, roles: ["marketing", "accounts"] },
      { to: "/clients", label: "Clients", icon: Building2, roles: ["marketing", "accounts", "project"] },
      { to: "/contracts", label: "Contracts", icon: FileSignature, roles: ["marketing", "accounts"] },
    ],
  },
  {
    title: "Accounts",
    items: [
      { to: "/invoices", label: "Invoices", icon: Receipt, roles: ["accounts"] },
      { to: "/recurring", label: "Recurring invoices", icon: Repeat, roles: ["accounts"] },
      { to: "/expenses", label: "Expenses & bills", icon: Wallet, roles: ["accounts"] },
      { to: "/income", label: "Other income", icon: PiggyBank, roles: ["accounts"] },
      { to: "/payouts", label: "Freelancer payouts", icon: HandCoins, roles: ["accounts"] },
      { to: "/reports", label: "Profit & loss", icon: BarChart3, roles: ["accounts"] },
    ],
  },
  {
    title: "Projects",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban, roles: [] },
      { to: "/tickets", label: "Support tickets", icon: LifeBuoy, roles: [] },
      { to: "/approvals", label: "Timesheet approvals", icon: ClipboardCheck, roles: ["project"] },
      { to: "/daily-reports", label: "Daily reports", icon: NotebookPen, roles: ["project"] },
    ],
  },
  {
    title: "My work",
    items: [
      { to: "/my/tasks", label: "My tasks", icon: ListTodo, roles: [] },
      { to: "/my/timesheet", label: "My timesheet", icon: Timer, roles: [] },
      { to: "/my/report", label: "Daily report", icon: FileClock, roles: [] },
      { to: "/my/earnings", label: "My earnings", icon: IndianRupee, roles: [] },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/users", label: "Users & roles", icon: UserCog, roles: ["__admin"] },
      { to: "/settings", label: "Company settings", icon: Settings, roles: ["__admin"] },
      { to: "/automation", label: "Automation & backups", icon: Workflow, roles: ["__admin"] },
    ],
  },
];

function visible(user, item) {
  if (!item.roles.length) return true;
  if (item.roles.includes("__admin")) return user.role === "admin";
  return can(user, ...item.roles);
}

export default function Layout() {
  const { user, settings, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV.map((section, i) => {
        const items = section.items.filter((it) => visible(user, it));
        if (!items.length) return null;
        return (
          <div key={i}>
            {section.title && <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</div>}
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-white/10 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <BrandMark className="h-9 w-9" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{settings?.company_name || "Chromolog"}</div>
          <div className="text-[11px] text-slate-400">Company portal</div>
        </div>
      </div>
      {nav}
      <div className="border-t border-white/10 p-3 space-y-0.5">
        <NavLink to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
          <UserCircle className="h-4 w-4" />
          <span className="truncate">
            {user.name} <span className="text-slate-500">· {ROLE_LABELS[user.role]}</span>
          </span>
        </NavLink>
        <button onClick={logout} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:block lg:w-64 no-print">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden no-print">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 no-print">
          <button onClick={() => setOpen((o) => !o)} aria-label="Open menu" className="text-slate-600">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <BrandMark className="h-6 w-6" />
            Chromolog Portal
          </span>
          <span className="w-5" />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
