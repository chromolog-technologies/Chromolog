import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AuthProvider, useAuth, can } from "./lib/auth";
import { ToastProvider, Loading } from "./components/ui";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Activate from "./pages/Activate";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/crm/Leads";
import LeadDetail from "./pages/crm/LeadDetail";
import Clients from "./pages/crm/Clients";
import ClientDetail from "./pages/crm/ClientDetail";
import Contracts from "./pages/crm/Contracts";
import { QuotationList, InvoiceList } from "./pages/sales/DocList";
import DocEditor from "./pages/sales/DocEditor";
import DocView from "./pages/sales/DocView";
import Ledger from "./pages/accounts/Ledger";
import Reports from "./pages/accounts/Reports";
import SalesReports from "./pages/accounts/SalesReports";
import Services from "./pages/accounts/Services";
import Payouts from "./pages/accounts/Payouts";
import Recurring from "./pages/accounts/Recurring";
import Tickets from "./pages/tickets/Tickets";
import TicketDetail from "./pages/tickets/TicketDetail";
import Automation from "./pages/admin/Automation";
import PayoutDetail from "./pages/accounts/PayoutDetail";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import Approvals from "./pages/projects/Approvals";
import DailyReports from "./pages/projects/DailyReports";
import MyTasks from "./pages/my/MyTasks";
import MyTimesheet from "./pages/my/MyTimesheet";
import MyReport from "./pages/my/MyReport";
import MyEarnings from "./pages/my/MyEarnings";
import Users from "./pages/admin/Users";
import CompanySettings from "./pages/admin/CompanySettings";
import Profile from "./pages/Profile";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import SecurityLog from "./pages/admin/SecurityLog";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <ForcePasswordChange />;
  return children;
}

/** Page-level role guard (the API enforces the same rules). */
function Only({ roles, children }) {
  const { user } = useAuth();
  const allowed = roles === "admin" ? user.role === "admin" : can(user, ...roles);
  if (allowed) return children;
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
      <ShieldAlert className="h-10 w-10 mb-3 text-slate-400" />
      <p className="text-sm">This page isn't part of your role.</p>
      <Link to="/" className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Go to my dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename="/portal">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/activate" element={<Activate />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />

              <Route path="leads" element={<Only roles={["marketing"]}><Leads /></Only>} />
              <Route path="leads/:id" element={<Only roles={["marketing"]}><LeadDetail /></Only>} />
              <Route path="clients" element={<Only roles={["marketing", "accounts", "project"]}><Clients /></Only>} />
              <Route path="clients/:id" element={<Only roles={["marketing", "accounts", "project"]}><ClientDetail /></Only>} />
              <Route path="contracts" element={<Only roles={["marketing", "accounts"]}><Contracts /></Only>} />

              <Route path="quotations" element={<Only roles={["marketing", "accounts"]}><QuotationList /></Only>} />
              <Route path="quotations/new" element={<Only roles={["marketing", "accounts"]}><DocEditor kind="quotation" /></Only>} />
              <Route path="quotations/:id" element={<Only roles={["marketing", "accounts"]}><DocView kind="quotation" /></Only>} />
              <Route path="quotations/:id/edit" element={<Only roles={["marketing", "accounts"]}><DocEditor kind="quotation" /></Only>} />
              <Route path="invoices" element={<Only roles={["accounts"]}><InvoiceList /></Only>} />
              <Route path="invoices/new" element={<Only roles={["accounts"]}><DocEditor kind="invoice" /></Only>} />
              <Route path="invoices/:id" element={<Only roles={["accounts"]}><DocView kind="invoice" /></Only>} />
              <Route path="invoices/:id/edit" element={<Only roles={["accounts"]}><DocEditor kind="invoice" /></Only>} />

              <Route path="services" element={<Only roles={["marketing", "accounts"]}><Services /></Only>} />
              <Route path="sales-reports" element={<Only roles={["accounts"]}><SalesReports /></Only>} />
              <Route path="expenses" element={<Only roles={["accounts"]}><Ledger kind="expenses" /></Only>} />
              <Route path="recurring" element={<Only roles={["accounts"]}><Recurring /></Only>} />
              <Route path="income" element={<Only roles={["accounts"]}><Ledger kind="income" /></Only>} />
              <Route path="reports" element={<Only roles={["accounts"]}><Reports /></Only>} />
              <Route path="payouts" element={<Only roles={["accounts"]}><Payouts /></Only>} />
              <Route path="payouts/:id" element={<Only roles={["accounts"]}><PayoutDetail /></Only>} />

              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="approvals" element={<Only roles={["project"]}><Approvals /></Only>} />
              <Route path="daily-reports" element={<Only roles={["project"]}><DailyReports /></Only>} />

              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="my/tasks" element={<MyTasks />} />
              <Route path="my/timesheet" element={<MyTimesheet />} />
              <Route path="my/report" element={<MyReport />} />
              <Route path="my/earnings" element={<MyEarnings />} />

              <Route path="users" element={<Only roles="admin"><Users /></Only>} />
              <Route path="settings" element={<Only roles="admin"><CompanySettings /></Only>} />
              <Route path="automation" element={<Only roles="admin"><Automation /></Only>} />
              <Route path="security" element={<Only roles="admin"><SecurityLog /></Only>} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
