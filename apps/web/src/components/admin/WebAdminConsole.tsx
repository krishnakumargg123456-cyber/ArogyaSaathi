import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Users, UserCheck, Building2, Stethoscope,
  ArrowUpRight, Calendar, Radar, Shield, CheckCircle2, RefreshCw, Settings
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface AdminUser {
  id: string;
  full_name: string;
  role: string;
  mobile: string;
  is_active: boolean;
  doctor_details?: {
    qualification?: string | null;
    specialization?: string | null;
    registration_number?: string | null;
    facility?: string | null;
    department?: string | null;
  } | null;
  scope?: {
    village?: string;
    block?: string;
    district?: string;
    facility_id?: string;
  };
}

interface StoredAdminSession {
  access_token?: string;
  full_name?: string;
  role?: string;
}

interface AdminAccountSettings {
  email: string | null;
  full_name: string;
}

interface AdminOverview {
  reporting_period: string;
  kpis: Record<string, number>;
  system_health: Record<string, string>;
  recent_activity: Array<{
    id: string;
    action: string;
    entity_type: string;
    details: string;
    timestamp: string;
    hash: string | null;
  }>;
}

interface HealthRadarAlert {
  id: string;
  alert_code: string;
  title: string;
  disease_category: string;
  district: string;
  block: string;
  village_name: string | null;
  severity: string;
  status: string;
  case_count: number;
  data_quality: string;
  detected_at: string;
  review_notes: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  details: string;
  timestamp: string;
  hash_signature: string | null;
}

type AdminRecord = Record<string, string | number | boolean | null>;

async function fetchAdminUsers(token: string) {
  return apiRequest<AdminUser[]>("/admin/users", {}, token);
}

type AdminSection =
  | "overview"
  | "users"
  | "patients"
  | "workers"
  | "doctors"
  | "referrals"
  | "appointments"
  | "radar"
  | "audit"
  | "settings";

export function WebAdminConsole({ initialSection = "overview" }: { initialSection?: AdminSection }) {
  const [activeSection, setActiveSection] = useState<
    AdminSection
  >(initialSection);

  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [adminToken, setAdminToken] = useState("");
  const [adminIdentity, setAdminIdentity] = useState<StoredAdminSession | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [alerts, setAlerts] = useState<HealthRadarAlert[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState("");
  const [alertNotes, setAlertNotes] = useState<Record<string, string>>({});
  const [updatingAlertId, setUpdatingAlertId] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [moduleRecords, setModuleRecords] = useState<AdminRecord[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      const savedSession = sessionStorage.getItem("arogyasaathi_session");
      if (!savedSession) {
        setUsersError("Sign in with an administrator account to review registrations.");
        return;
      }

      let session: StoredAdminSession;
      try {
        session = JSON.parse(savedSession) as StoredAdminSession;
      } catch {
        setUsersError("Your saved session is invalid. Sign in again with an administrator account.");
        return;
      }

      if (session.role !== "ADMIN" || !session.access_token) {
        setUsersError("Administrator access is required to review registrations.");
        return;
      }

      setAdminIdentity(session);
      setAdminToken(session.access_token);
      setUsersLoading(true);
      try {
        const accountSettings = await apiRequest<AdminAccountSettings>("/auth/admin/settings", {}, session.access_token);
        if (active) setAdminEmail(accountSettings.email ?? "");
      } catch (error) {
        if (active) setSettingsError(error instanceof Error ? error.message : "Could not load administrator settings.");
      }
      try {
        const users = await fetchAdminUsers(session.access_token);
        if (active) setUsersList(users);
      } catch (error) {
        if (active) setUsersError(error instanceof Error ? error.message : "Could not load user accounts.");
      } finally {
        if (active) setUsersLoading(false);
      }
    }

    void loadUsers();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    let active = true;

    if (activeSection === "overview") {
      setOverviewLoading(true);
      setOverviewError("");
      void apiRequest<AdminOverview>("/admin/overview", {}, adminToken)
        .then((data) => { if (active) setOverview(data); })
        .catch((error: unknown) => {
          if (active) setOverviewError(error instanceof Error ? error.message : "Could not load live dashboard data.");
        })
        .finally(() => { if (active) setOverviewLoading(false); });
    } else if (activeSection === "radar") {
      setRadarLoading(true);
      setRadarError("");
      void apiRequest<HealthRadarAlert[]>("/surveillance/alerts", {}, adminToken)
        .then((data) => { if (active) setAlerts(data); })
        .catch((error: unknown) => {
          if (active) setRadarError(error instanceof Error ? error.message : "Could not load health-radar alerts.");
        })
        .finally(() => { if (active) setRadarLoading(false); });
    } else if (activeSection === "audit") {
      setAuditLoading(true);
      setAuditError("");
      void apiRequest<AuditLog[]>("/admin/audit-logs?limit=100", {}, adminToken)
        .then((data) => { if (active) setAuditLogs(data); })
        .catch((error: unknown) => {
          if (active) setAuditError(error instanceof Error ? error.message : "Could not load audit records.");
        })
        .finally(() => { if (active) setAuditLoading(false); });
    } else {
      const endpoints: Partial<Record<AdminSection, string>> = {
        patients: "/admin/patients",
        workers: "/admin/users",
        doctors: "/admin/doctors",
        referrals: "/admin/referrals",
        appointments: "/admin/appointments",
      };
      const endpoint = endpoints[activeSection];
      if (endpoint) {
        setModuleLoading(true);
        setModuleError("");
        void apiRequest<AdminRecord[]>(endpoint, {}, adminToken)
          .then((records) => {
            if (!active) return;
            const filteredRecords = activeSection === "workers"
              ? records.filter((record) => !["DOCTOR", "ADMIN", "PATIENT"].includes(String(record.role)))
              : records;
            setModuleRecords(filteredRecords);
          })
          .catch((error: unknown) => {
            if (active) setModuleError(error instanceof Error ? error.message : `Could not load ${activeSection} records.`);
          })
          .finally(() => { if (active) setModuleLoading(false); });
      }
    }

    return () => { active = false; };
  }, [activeSection, adminToken]);

  async function handleRefreshUsers() {
    if (!adminToken) return;
    setUsersLoading(true);
    setUsersError("");
    try {
      setUsersList(await fetchAdminUsers(adminToken));
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not load user accounts.");
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleReviewAlert(alert: HealthRadarAlert, status: string) {
    if (!adminToken) return;
    const reviewNotes = alertNotes[alert.id]?.trim();
    if (!reviewNotes) {
      setRadarError("Add review notes before changing an alert status.");
      return;
    }

    setUpdatingAlertId(alert.id);
    setRadarError("");
    try {
      await apiRequest(`/surveillance/alerts/${alert.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, review_notes: reviewNotes }),
      }, adminToken);
      setAlerts(await apiRequest<HealthRadarAlert[]>("/surveillance/alerts", {}, adminToken));
      setAlertNotes((current) => ({ ...current, [alert.id]: "" }));
    } catch (error) {
      setRadarError(error instanceof Error ? error.message : "Could not update this alert.");
    } finally {
      setUpdatingAlertId("");
    }
  }

  async function handleUserStatusChange(user: AdminUser) {
    if (!adminToken) return;
    setUpdatingUserId(user.id);
    setUsersError("");
    try {
      await apiRequest<{ status: string }>(
        `/admin/users/${user.id}/status?is_active=${!user.is_active}`,
        { method: "PATCH" },
        adminToken
      );
      setUsersList(await fetchAdminUsers(adminToken));
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not update this account.");
    } finally {
      setUpdatingUserId("");
    }
  }

  async function handleUpdateAdminSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) return;
    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError("The new password and confirmation do not match.");
      return;
    }
    if (!adminEmail.trim() && !newPassword) {
      setSettingsError("Enter a new email address or password.");
      return;
    }
    setSettingsError("");
    setSettingsMessage("");
    setSettingsSaving(true);
    try {
      const updated = await apiRequest<AdminAccountSettings>("/auth/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          email: adminEmail.trim() || undefined,
          new_password: newPassword || undefined,
        }),
      }, adminToken);
      setAdminEmail(updated.email ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSettingsMessage("Administrator account settings updated.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Could not update administrator settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  const adminName = adminIdentity?.full_name?.trim() || "Administrator";
  const adminInitials = adminName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen bg-[#F4FBF8] text-gray-800 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#064E3B] text-white flex flex-col shadow-xl shrink-0">
        <div className="p-5 border-b border-[#0F5B47] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-[#064E3B] flex items-center justify-center font-extrabold text-lg shadow-sm">
            AS
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none text-white">ArogyaSaathi</h1>
            <span className="text-[10px] text-emerald-300 font-mono tracking-wider">ADMIN CONSOLE v2.1</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-semibold">
          {[
            { id: "overview", label: "Overview Dashboard", icon: LayoutDashboard },
            { id: "users", label: "User & Role Access", icon: Users },
            { id: "patients", label: "Patient Registry & Consent", icon: UserCheck },
            { id: "workers", label: "Healthcare Workers (ASHA/ANM)", icon: Building2 },
            { id: "doctors", label: "Doctors & OPD Slots", icon: Stethoscope },
            { id: "referrals", label: "Referral Closed Loop", icon: ArrowUpRight },
            { id: "appointments", label: "MediSlot Appointments", icon: Calendar },
            { id: "radar", label: "Health Radar Surveillance", icon: Radar },
            { id: "audit", label: "Security & Tamper Audit", icon: Shield },
            { id: "settings", label: "Account Settings", icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-[#0B6E4F] text-white shadow-xs font-bold"
                    : "text-emerald-100/80 hover:bg-[#0F5B47] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-200" : "text-emerald-300/70"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Administrator profile */}
        <div className="p-4 border-t border-[#0F5B47] bg-[#053B2D] text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
              {adminToken ? adminInitials : "AS"}
            </div>
            <div>
              <span className="font-bold text-white block">{adminToken ? adminName : "Sign-in required"}</span>
              <span className="text-[10px] text-emerald-300">{adminToken ? "System Administrator" : "Protected workspace"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Administrative Surface */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 capitalize">
              {activeSection.replace("-", " ")}
            </h2>
            <p className="text-[11px] text-gray-500">
              {adminToken
                ? `Signed in as ${adminName}`
                : "Administrator sign-in is required to load protected records"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${adminToken ? "bg-emerald-500" : "bg-amber-500"}`} />
              {adminToken ? "Live API" : "Sign-in required"}
            </span>
            {!adminToken && (
              <Link href="/login?portal=admin" className="inline-flex min-h-9 items-center rounded-lg bg-[#0B6E4F] px-3 text-xs font-bold text-white hover:bg-[#064E3B]">
                Admin sign in
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {!adminToken && (
            <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
              <p>Sign in with an administrator account to load live platform records. This preview does not use a sample administrator identity.</p>
              <Link href="/login?portal=admin" className="shrink-0 font-bold underline underline-offset-2">Continue to admin sign in</Link>
            </div>
          )}
          {/* ==========================================
              1. OVERVIEW DASHBOARD (Live Calculated DB KPIs)
             ========================================== */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {overviewError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{overviewError}</p>}
              <p className="text-xs text-gray-500">{overview?.reporting_period ?? (overviewLoading ? "Loading live metrics…" : "No live metrics available.")}</p>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  ["Registered patients", "total_registered_patients"],
                  ["Active ASHA workers", "active_asha_workers"],
                  ["Active ANM workers", "active_anms"],
                  ["Registered doctors", "registered_doctors"],
                  ["Health facilities", "total_facilities"],
                  ["Pending referrals", "pending_referrals"],
                  ["Urgent referrals", "urgent_referrals"],
                  ["Today’s appointments", "today_appointments"],
                  ["Overdue follow-ups", "overdue_followups"],
                  ["Active radar alerts", "health_radar_active_alerts"],
                  ["Active devices", "registered_active_devices"],
                  ["Completed referrals", "completed_referrals"],
                ].map(([label, key]) => (
                  <div key={key} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                    <span className="block text-xs font-semibold text-gray-500">{label}</span>
                    <span className="mt-1 block text-2xl font-black text-gray-900">
                      {overviewLoading && !overview ? "…" : overview?.kpis[key] ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <h3 className="mb-3 text-sm font-bold text-gray-900">Backend service status</h3>
                  {overview ? Object.entries(overview.system_health).map(([name, value]) => (
                    <div key={name} className="flex justify-between gap-4 border-t border-gray-100 py-2 text-xs">
                      <span className="text-gray-600">{name.replaceAll("_", " ")}</span>
                      <span className="font-bold text-emerald-800">{value}</span>
                    </div>
                  )) : <p className="text-xs text-gray-500">{overviewLoading ? "Loading…" : "No service status available."}</p>}
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                  <h3 className="mb-3 text-sm font-bold text-gray-900">Recent server activity</h3>
                  {overview?.recent_activity.length ? overview.recent_activity.map((event) => (
                    <div key={event.id} className="border-t border-gray-100 py-2">
                      <div className="flex justify-between gap-3 text-xs">
                        <strong>{event.action}</strong>
                        <time className="text-gray-500">{new Date(event.timestamp).toLocaleString()}</time>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{event.details || event.entity_type}</p>
                    </div>
                  )) : <p className="text-xs text-gray-500">{overviewLoading ? "Loading…" : "No recorded activity."}</p>}
                </section>
              </div>
            </div>
          )}

          {/* ==========================================
              2. USER & ROLE ACCESS
             ========================================== */}
          {activeSection === "users" && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">User Accounts & Geographical Scopes</h3>
                  <p className="text-xs text-gray-500">Review doctor credentials and approve access for doctors and health workers</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshUsers}
                  disabled={!adminToken || usersLoading}
                  aria-label="Refresh user accounts"
                  className="px-3.5 py-2 bg-[#0B6E4F] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                  <span>Refresh users</span>
                </button>
              </div>

              {usersError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">{usersError}</p>}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold bg-surface-light">
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Mobile Identifier</th>
                      <th className="py-2.5 px-3">Professional Details</th>
                      <th className="py-2.5 px-3">Geographical Scope</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersLoading && usersList.length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Loading registered users…</td></tr>
                    ) : usersList.length === 0 ? (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">{usersError ? "Sign in as an administrator to view pending registrations." : "No registered users found."}</td></tr>
                    ) : usersList.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-bold text-gray-900">{u.full_name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">{u.mobile}</td>
                        <td className="py-3 px-3 text-gray-600">
                          {u.doctor_details
                            ? <span>{u.doctor_details.qualification} · {u.doctor_details.specialization}<br />Reg. {u.doctor_details.registration_number}<br />{u.doctor_details.facility} · {u.doctor_details.department}</span>
                            : "—"}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{[u.scope?.village, u.scope?.block, u.scope?.district].filter(Boolean).join(", ") || u.scope?.facility_id || "Not assigned"}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold ${u.is_active ? "text-emerald-700" : "text-amber-700"}`}>● {u.is_active ? "Active" : "Pending / inactive"}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleUserStatusChange(u)}
                            className={`font-semibold hover:underline disabled:cursor-wait disabled:opacity-50 ${u.is_active ? "text-red-700" : "text-[#0B6E4F]"}`}
                          >
                            {updatingUserId === u.id ? "Updating…" : u.is_active ? "Deactivate" : "Approve access"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              3. HEALTH RADAR (Surveillance)
             ========================================== */}
          {activeSection === "radar" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Health Radar Surveillance Map & Alerts</h3>
                    <p className="text-xs text-gray-500">
                      Server-generated candidate alerts only. Human review is required; this is not an outbreak declaration.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">{alerts.length} Alerts</span>
                </div>
                {radarError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{radarError}</p>}
                {radarLoading && <p className="text-xs text-gray-500">Loading alerts from the server…</p>}
                <div className="grid grid-cols-3 gap-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="space-y-2 rounded-2xl border border-gray-200 bg-surface-light p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-[10px] font-bold">{alert.alert_code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-900">{alert.title}</h4>
                      <p className="text-[11px] text-gray-600">{alert.disease_category} · {alert.case_count} reported cases · {alert.data_quality} data</p>
                      <p className="text-[11px] text-gray-500">{[alert.village_name, alert.block, alert.district].filter(Boolean).join(" · ") || "Location not specified"} · {alert.status}</p>
                      {alert.review_notes && <p className="text-[11px] text-gray-600">Latest note: {alert.review_notes}</p>}
                      <textarea
                        aria-label={`Review notes for ${alert.alert_code}`}
                        value={alertNotes[alert.id] ?? ""}
                        onChange={(event) => setAlertNotes((current) => ({ ...current, [alert.id]: event.target.value }))}
                        placeholder="Required review notes"
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 p-2 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={updatingAlertId === alert.id || !alertNotes[alert.id]?.trim()}
                          onClick={() => void handleReviewAlert(alert, "UNDER_REVIEW")}
                          className="flex-1 rounded-xl bg-[#0B6E4F] py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {updatingAlertId === alert.id ? "Saving…" : "Start review"}
                        </button>
                        <button
                          disabled={updatingAlertId === alert.id || !alertNotes[alert.id]?.trim()}
                          onClick={() => void handleReviewAlert(alert, "ACKNOWLEDGED")}
                          className="flex-1 rounded-xl border border-gray-300 bg-white py-2 text-xs font-bold disabled:opacity-50"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {!radarLoading && !radarError && alerts.length === 0 && <p className="py-8 text-center text-xs text-gray-500">No alerts are available in the server data for this account.</p>}
              </div>
            </div>
          )}

          {/* ==========================================
              4. SECURITY & AUDIT LOGS (Hash Chaining)
             ========================================== */}
          {activeSection === "audit" && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Tamper-Evident Audit Event Trail</h3>
                <p className="text-xs text-gray-500">
                  Audit records returned by the server, including available integrity hashes.
                </p>
              </div>
              {auditError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{auditError}</p>}
              {auditLoading && <p className="text-xs text-gray-500">Loading audit records…</p>}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold bg-surface-light">
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3 text-right">SHA-256 Hash Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-500">{new Date(row.timestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{row.action}</td>
                        <td className="py-2.5 px-3 text-emerald-800">{row.entity_type}</td>
                        <td className="py-2.5 px-3 font-sans text-gray-700">{row.details}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{row.hash_signature ?? "Unavailable"}</td>
                      </tr>
                    ))}
                    {!auditLoading && auditLogs.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">No audit records returned.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <section className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-900">Administrator account</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">Change the email used for admin sign-in and/or set a new password. Confirm your current password to save.</p>
              <form onSubmit={handleUpdateAdminSettings} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-gray-800">
                  Admin email
                  <input type="email" autoComplete="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-gray-800">
                  New password <span className="font-normal text-gray-500">(leave blank to keep current)</span>
                  <input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-gray-800">
                  Confirm new password
                  <input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-gray-800">
                  Current password <span className="text-red-700">*</span>
                  <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal" />
                </label>
                {settingsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{settingsError}</p>}
                {settingsMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{settingsMessage}</p>}
                <button type="submit" disabled={settingsSaving || !adminToken} className="min-h-11 rounded-xl bg-[#0B6E4F] px-5 font-bold text-white disabled:opacity-60">
                  {settingsSaving ? "Saving…" : "Save account settings"}
                </button>
              </form>
            </section>
          )}

          {/* Fallback for other sections */}
          {!["overview", "users", "radar", "audit", "settings"].includes(activeSection) && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#0B6E4F] mx-auto" />
              <h3 className="font-bold text-sm text-gray-900 capitalize">{activeSection} Module Not Connected</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                This dashboard section is a navigation placeholder. It does not currently load or change live records.
              </p>
            </div>
          )}

          {["patients", "workers", "doctors", "referrals", "appointments"].includes(activeSection) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold capitalize text-gray-900">{activeSection} · live server records</h3>
                  <p className="text-xs text-gray-500">Loaded from the protected administration API.</p>
                </div>
                {moduleLoading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-800" />}
              </div>
              {moduleError && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{moduleError}</p>}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-surface-light text-gray-500">
                      {(moduleRecords[0] ? Object.keys(moduleRecords[0]) : []).map((key) => (
                        <th key={key} className="whitespace-nowrap px-3 py-2.5 font-bold">{key.replaceAll("_", " ")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {moduleRecords.map((record, rowIndex) => (
                      <tr key={String(record.id ?? record.internal_id ?? rowIndex)} className="hover:bg-gray-50">
                        {Object.entries(record).map(([key, value]) => (
                          <td key={key} className="max-w-64 px-3 py-2.5 text-gray-700">
                            {typeof value === "boolean" ? value ? "Yes" : "No"
                              : value == null ? "—"
                                : typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)
                                  ? new Date(value).toLocaleString()
                                  : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!moduleLoading && !moduleError && moduleRecords.length === 0 && (
                      <tr><td colSpan={12} className="px-3 py-8 text-center text-gray-500">No records returned for this section.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

    </div>
  );
}
