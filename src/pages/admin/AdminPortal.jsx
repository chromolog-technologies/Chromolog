import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import LeadsManager from "./LeadsManager";
import AnalyticsOverview from "./AnalyticsOverview";

export default function AdminPortal() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "overview" && <AdminDashboard onNavigateTab={setActiveTab} />}
      {activeTab === "leads" && <LeadsManager />}
      {activeTab === "analytics" && <AnalyticsOverview />}
      {activeTab === "services" && <AdminDashboard onNavigateTab={setActiveTab} />}
      {activeTab === "projects" && <AdminDashboard onNavigateTab={setActiveTab} />}
    </AdminLayout>
  );
}
