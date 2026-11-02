"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  Hospital,
  KeyRound,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Stethoscope,
  Users,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  adminFetch,
  adminLogin,
  clearAdminToken,
  getAdminToken,
} from "../lib/api";

type SectionKey =
  | "overview"
  | "users"
  | "patients"
  | "workers"
  | "doctors"
  | "facilities"
  | "villages"
  | "referrals"
  | "appointments"
  | "surveillance"
  | "tasks"
  | "devices"
  | "audit"
  | "protocols"
  | "settings";

interface NavigationItem {
  key: SectionKey;
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { key: "overview", label: "Overview", href: "/", icon: Activity },
  { key: "users", label: "Users & access", href: "/users", icon: Users },
  { key: "patients", label: "Patients & consent", href: "/patients", icon: HeartPulse },
  { key: "workers", label: "Frontline workers", href: "/workers", icon: UserRound },
  { key: "doctors", label: "Doctors & OPD", href: "/doctors", icon: Stethoscope },
  { key: "facilities", label: "Facilities", href: "/facilities", icon: Hospital },
  { key: "villages", label: "Villages & coverage", href: "/villages", icon: Building2 },
  { key: "referrals", label: "Referrals", href: "/referrals", icon: ArrowUpRight },
  { key: "appointments", label: "Appointments", href: "/appointments", icon: CalendarDays },
  { key: "surveillance", label: "Health radar", href: "/surveillance", icon: Radar },
  { key: "tasks", label: "Follow-up tasks", href: "/tasks", icon: ClipboardList },
  { key: "devices", label: "Registered devices", href: "/devices", icon: Smartphone },
  { key: "audit", label: "Audit trail", href: "/audit", icon: Shield },
  { key: "protocols", label: "Safety protocols", href: "/protocols", icon: CheckCircle2 },
  { key: "settings", label: "Account settings", href: "/settings", icon: KeyRound },
];

interface AdminOverview {
  reporting_period: string;
  kpis: {
    total_registered_patients: number;
    active_asha_workers: number;
    active_anms: number;
    registered_doctors: number;
    total_facilities: number;
    pending_referrals: number;
    completed_referrals: number;
    urgent_referrals: number;
    today_appointments: number;
    upcoming_appointments: number;
    overdue_followups: number;
    health_radar_active_alerts: number;
    registered_active_devices: number;
    revoked_devices: number;
  };
  system_health: Record<string, string>;
  recent_activity: {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: string | null;
    timestamp: string;
    hash: string | null;
  }[];
}

interface UserRecord {
  id: string;
  employee_id: string | null;
  mobile: string;
  full_name: string;
  role: string;
  is_active: boolean;
  first_login_done: boolean;
  created_at: string;
  scope: {
    district?: string | null;
    block?: string | null;
    village?: string | null;
    facility_id?: string | null;
  } | null;
  doctor_details?: { specialization?: string | null } | null;
}

interface PatientRecord {
  id: string;
  internal_id: string;
  name: string;
  age: number;
  gender: string;
  village_name: string | null;
  is_active: boolean;
  consent_status: "ACTIVE" | "WITHDRAWN" | "MISSING";
  created_at: string;
}

interface FacilityRecord {
  id: string;
  name: string;
  type: string;
  district: string;
  block: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  village_count: number;
  doctor_count: number;
}

interface VillageRecord {
  id: string;
  name: string;
  block: string;
  district: string;
  population: number;
  assigned_facility_id: string | null;
  assigned_facility_name: string | null;
}

interface FacilityOption {
  id: string;
  name: string;
}

interface VillageDirectory {
  villages: VillageRecord[];
  facilities: FacilityOption[];
}

interface AdminSettings {
  email: string | null;
  full_name: string;
}

interface DoctorRecord {
  id: string;
  user_id: string;
  full_name: string;
  mobile: string;
  department_name: string | null;
  facility_name: string | null;
  specialization: string;
  qualification: string;
  registration_number: string | null;
  experience_years: number;
  opd_days: string;
  opd_timings: string;
  is_active: boolean;
}

interface AppointmentRecord {
  id: string;
  booking_ref: string;
  patient_name: string | null;
  doctor_name: string | null;
  facility_name: string | null;
  slot_date: string | null;
  slot_time: string | null;
  reason_code: string;
  status: string;
  created_at: string;
}

interface ReferralRecord {
  id: string;
  referral_code: string;
  patient_name: string | null;
  receiving_facility_name: string | null;
  urgency: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TaskRecord {
  id: string;
  patient_name: string | null;
  assigned_user_name: string | null;
  task_type: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string | null;
}

interface AlertRecord {
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

interface DeviceRecord {
  id: string;
  device_id: string;
  user_name: string;
  role: string;
  device_model: string | null;
  is_revoked: boolean;
  registered_at: string;
  last_seen_at: string;
}

interface AuditRecord {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  timestamp: string;
  hash_signature: string | null;
}

interface ProtocolRecord {
  protocol_version: string;
  title: string;
  effective_date: string;
  clinician_signoff: string;
  golden_vectors: unknown[];
  status: string;
}

type SectionPayload =
  | AdminOverview
  | UserRecord[]
  | PatientRecord[]
  | FacilityRecord[]
  | VillageDirectory
  | AdminSettings
  | DoctorRecord[]
  | AppointmentRecord[]
  | ReferralRecord[]
  | TaskRecord[]
  | AlertRecord[]
  | DeviceRecord[]
  | AuditRecord[]
  | ProtocolRecord
  | null;

const sectionForPath = (pathname: string): SectionKey =>
  navigation.find((item) => item.href === pathname)?.key ?? "overview";

const endpointForSection: Record<SectionKey, string> = {
  overview: "/admin/overview",
  users: "/admin/users",
  patients: "/admin/patients",
  workers: "/admin/users",
  doctors: "/admin/doctors",
  facilities: "/admin/facilities",
  villages: "/admin/villages",
  referrals: "/admin/referrals",
  appointments: "/admin/appointments",
  surveillance: "/surveillance/alerts",
  tasks: "/admin/tasks",
  devices: "/admin/devices",
  audit: "/admin/audit-logs?limit=100",
  protocols: "/triage/protocols/current",
  settings: "/auth/admin/settings",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(date);
}

function scopeLabel(scope: UserRecord["scope"]): string {
  if (!scope) return "No scope assigned";
  return [scope.village, scope.block, scope.district].filter(Boolean).join(", ") ||
    (scope.facility_id ? "Facility scope" : "No scope assigned");
}

function badgeTone(value: string): string {
  const normalized = value.toUpperCase();
  if (["ACTIVE", "COMPLETED", "ACKNOWLEDGED", "INVESTIGATED", "CONFIRMED", "BOUND"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (["URGENT", "CRITICAL", "HIGH", "OVERDUE", "NEW", "PENDING", "UNDER_REVIEW"].includes(normalized)) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }
  if (["REVOKED", "CANCELLED", "CLOSED", "REJECTED", "INACTIVE", "WITHDRAWN"].includes(normalized)) {
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  }
  return "bg-slate-100 text-slate-700 ring-slate-500/20";
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${badgeTone(value)}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        <ClipboardList className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-800">No records found</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
        {children}
      </table>
    </div>
  );
}

function TableHeader({ labels }: { labels: string[] }) {
  return (
    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
      <tr>
        {labels.map((label) => (
          <th key={label} scope="col" className="whitespace-nowrap px-4 py-3">
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await adminLogin(identifier.trim(), password);
      onSuccess(result.full_name);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4fbf8] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a4333] text-lg font-black text-white">AS</div>
          <div>
            <p className="font-extrabold tracking-tight text-slate-900">ArogyaSaathi</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Admin console</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Administrator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with an authorized administrator account to manage the healthcare network.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-identifier">
            Mobile number or employee ID
            <input id="admin-identifier" required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-password">
            Password
            <input id="admin-password" required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
          <button disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0a4333] px-4 text-sm font-bold text-white transition hover:bg-[#0f5b47] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? "Signing in..." : "Sign in securely"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-slate-500">Administrator access is verified by the ArogyaSaathi API.</p>
      </section>
    </main>
  );
}

export function WebAdminConsole() {
  const pathname = usePathname();
  const activeSection = sectionForPath(pathname);
  const activeNavigation = navigation.find((item) => item.key === activeSection) ?? navigation[0];
  const [signedIn, setSignedIn] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");
  const [authReady, setAuthReady] = useState(false);
  const [payload, setPayload] = useState<SectionPayload>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [apiConnected, setApiConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modal, setModal] = useState<"user" | "facility" | "village" | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSignedIn(Boolean(getAdminToken()));
    setAuthReady(true);
  }, []);

  useEffect(() => {
    setSearch("");
    setNotice("");
  }, [activeSection]);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    setLoading(true);
    setPayload(null);
    setLoadError("");

    adminFetch<SectionPayload>(endpointForSection[activeSection])
      .then((result) => {
        if (!active) return;
        setPayload(result);
        setApiConnected(true);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setLoadError(requestError instanceof Error ? requestError.message : "Unable to load this module.");
        setApiConnected(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeSection, refreshKey, signedIn]);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(payload)) return [];
    return (payload as UserRecord[]).filter((user) => {
      const term = search.trim().toLowerCase();
      const roleMatches = activeSection !== "workers" || ["ASHA", "ANM"].includes(user.role);
      return roleMatches && (!term || [user.full_name, user.mobile, user.role, scopeLabel(user.scope)]
        .join(" ").toLowerCase().includes(term));
    });
  }, [activeSection, payload, search]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    setLoadError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      refresh();
      return true;
    } catch (requestError) {
      setLoadError(requestError instanceof Error ? requestError.message : "The requested action failed.");
      return false;
    }
  }

  function logout() {
    clearAdminToken();
    setSignedIn(false);
    setPayload(null);
    setAdminName("Administrator");
  }

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading administrator session...</div>;
  }
  if (!signedIn) {
    return <AdminLogin onSuccess={(name) => {
      setAdminName(name);
      setSignedIn(true);
    }} />;
  }

  const searchPlaceholder =
    activeSection === "patients" ? "Search patient name or ID" :
    activeSection === "facilities" ? "Search facility, district or block" :
    activeSection === "villages" ? "Search village, district or block" :
    activeSection === "doctors" ? "Search doctor, department or facility" :
    activeSection === "appointments" ? "Search patient, doctor or booking ref" :
    activeSection === "referrals" ? "Search patient, referral or facility" :
    activeSection === "surveillance" ? "Search alert, village or condition" :
    activeSection === "tasks" ? "Search patient, task or worker" :
    activeSection === "devices" ? "Search device, user or role" :
    activeSection === "audit" ? "Search action, entity or details" :
    "Search name, mobile or role";
  const supportsSearch = !["overview", "protocols", "settings"].includes(activeSection);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#062e23] text-white lg:flex">
        <Brand />
        <Navigation pathname={pathname} />
        <AdminProfile name={adminName} onLogout={logout} />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{activeNavigation.label}</p>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block">ArogyaSaathi · District health operations</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold sm:inline-flex ${apiConnected ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${apiConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
              {apiConnected ? "API connected" : "API unavailable"}
            </span>
            <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label="Refresh data">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button type="button" onClick={logout} className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 lg:hidden" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <aside className="flex h-full w-[min(20rem,85vw)] flex-col bg-[#062e23] text-white" onClick={(event) => event.stopPropagation()}>
              <Brand />
              <Navigation pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
              <AdminProfile name={adminName} onLogout={logout} />
            </aside>
          </div>
        )}

        <main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Administration</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{activeNavigation.label}</h1>
              <p className="mt-1 text-sm text-slate-500">Manage care operations with authorized, auditable access.</p>
            </div>
            {supportsSearch && (
              <label className="relative block w-full sm:max-w-xs" htmlFor="module-search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="module-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
              </label>
            )}
          </div>

          {loadError && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1"><p className="font-semibold">Unable to complete the request</p><p className="mt-0.5 text-xs">{loadError}</p></div>
              <button type="button" onClick={() => setLoadError("")} aria-label="Dismiss error" className="rounded p-1 hover:bg-rose-100"><X className="h-4 w-4" /></button>
            </div>
          )}
          {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><Check className="h-4 w-4" />{notice}</div>}

          {loading ? (
            <LoadingState />
          ) : !loadError || payload ? (
            <SectionContent
              section={activeSection}
              payload={payload}
              search={search}
              filteredUsers={filteredUsers}
              onCreateUser={() => setModal("user")}
              onCreateFacility={() => setModal("facility")}
              onCreateVillage={() => setModal("village")}
              onAction={runAction}
            />
          ) : (
            <Panel title="Data could not be loaded"><EmptyState label="Check that the API is running, then retry." /></Panel>
          )}
        </main>
      </div>

      {modal === "user" && <CreateUserModal onClose={() => setModal(null)} onSubmit={async (body) => {
        const saved = await runAction(
          () => adminFetch("/admin/users", { method: "POST", body: JSON.stringify(body) }),
          "User account created.",
        );
        if (saved) setModal(null);
      }} />}
      {modal === "facility" && <CreateFacilityModal onClose={() => setModal(null)} onSubmit={async (body) => {
        const saved = await runAction(
          () => adminFetch("/admin/facilities", { method: "POST", body: JSON.stringify(body) }),
          "Facility created.",
        );
        if (saved) setModal(null);
      }} />}
      {modal === "village" && <CreateVillageModal
        facilities={(payload as VillageDirectory | null)?.facilities ?? []}
        onClose={() => setModal(null)}
        onSubmit={async (body) => {
          const saved = await runAction(
            () => adminFetch("/admin/villages", { method: "POST", body: JSON.stringify(body) }),
            "Village created.",
          );
          if (saved) setModal(null);
        }}
      />}
    </div>
  );
}

function Brand() {
  return (
    <div className="flex h-20 shrink-0 items-center gap-3 border-b border-emerald-900 px-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-[#064e3b]">AS</div>
      <div>
        <p className="text-sm font-extrabold tracking-tight">ArogyaSaathi</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Admin console</p>
      </div>
    </div>
  );
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin modules" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <a key={item.key} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${active ? "bg-[#0b6e4f] text-white shadow-sm" : "text-emerald-100/80 hover:bg-emerald-900/70 hover:text-white"}`}>
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-200" : "text-emerald-300/70"}`} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function AdminProfile({ name, onLogout }: { name: string; onLogout: () => void }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="flex items-center justify-between gap-2 border-t border-emerald-900 bg-[#053b2d] p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold">{initials}</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{name}</p>
          <p className="text-[10px] text-emerald-300">System administrator</p>
        </div>
      </div>
      <button type="button" onClick={onLogout} aria-label="Sign out" className="rounded-lg p-2 text-emerald-200 hover:bg-emerald-900 hover:text-white"><LogOut className="h-4 w-4" /></button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" />Loading secured data...</div>
    </div>
  );
}

function SectionContent({
  section,
  payload,
  search,
  filteredUsers,
  onCreateUser,
  onCreateFacility,
  onCreateVillage,
  onAction,
}: {
  section: SectionKey;
  payload: SectionPayload;
  search: string;
  filteredUsers: UserRecord[];
  onCreateUser: () => void;
  onCreateFacility: () => void;
  onCreateVillage: () => void;
  onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
}) {
  if (section === "overview") return <OverviewSection data={payload as AdminOverview | null} />;
  if (section === "users" || section === "workers") {
    return <UsersSection users={filteredUsers} workersOnly={section === "workers"} onCreateUser={onCreateUser} onAction={onAction} />;
  }
  if (section === "patients") return <PatientsSection records={filterRows(payload as PatientRecord[] | null, search, (row) => [row.name, row.internal_id, row.village_name])} />;
  if (section === "facilities") return <FacilitiesSection records={filterRows(payload as FacilityRecord[] | null, search, (row) => [row.name, row.type, row.district, row.block])} onCreate={onCreateFacility} onAction={onAction} />;
  if (section === "villages") return <VillagesSection data={payload as VillageDirectory | null} search={search} onCreate={onCreateVillage} onAction={onAction} />;
  if (section === "doctors") return <DoctorsSection records={filterRows(payload as DoctorRecord[] | null, search, (row) => [row.full_name, row.department_name, row.facility_name, row.specialization])} />;
  if (section === "appointments") return <AppointmentsSection records={filterRows(payload as AppointmentRecord[] | null, search, (row) => [row.patient_name, row.doctor_name, row.booking_ref, row.facility_name])} />;
  if (section === "referrals") return <ReferralsSection records={filterRows(payload as ReferralRecord[] | null, search, (row) => [row.patient_name, row.referral_code, row.receiving_facility_name, row.reason])} />;
  if (section === "surveillance") return <SurveillanceSection records={filterRows(payload as AlertRecord[] | null, search, (row) => [row.alert_code, row.title, row.disease_category, row.village_name, row.status])} onAction={onAction} />;
  if (section === "tasks") return <TasksSection records={filterRows(payload as TaskRecord[] | null, search, (row) => [row.patient_name, row.assigned_user_name, row.task_type, row.status])} />;
  if (section === "devices") return <DevicesSection records={filterRows(payload as DeviceRecord[] | null, search, (row) => [row.device_id, row.user_name, row.role, row.device_model])} onAction={onAction} />;
  if (section === "audit") return <AuditSection records={filterRows(payload as AuditRecord[] | null, search, (row) => [row.action, row.entity_type, row.entity_id, row.details])} />;
  if (section === "settings") return <SettingsSection data={payload as AdminSettings | null} onAction={onAction} />;
  return <ProtocolSection data={payload as ProtocolRecord | null} />;
}

function filterRows<T>(records: T[] | null, search: string, values: (record: T) => Array<string | null | undefined>): T[] {
  const rows = records ?? [];
  const term = search.trim().toLowerCase();
  return term ? rows.filter((record) => values(record).some((value) => value?.toLowerCase().includes(term))) : rows;
}

function MetricCard({ label, value, detail, icon: Icon, tone = "emerald" }: { label: string; value: number; detail: string; icon: LucideIcon; tone?: "emerald" | "blue" | "amber" | "rose" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-800",
    blue: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold leading-5 text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </article>
  );
}

function OverviewSection({ data }: { data: AdminOverview | null }) {
  if (!data) return <Panel title="Overview"><EmptyState label="Overview data is unavailable." /></Panel>;
  const kpi = data.kpis;
  const system = data.system_health;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#062e23] to-[#0b6e4f] p-5 text-white sm:flex sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">District operations</p>
          <h2 className="mt-2 text-xl font-bold">Healthcare network snapshot</h2>
          <p className="mt-1 text-xs text-emerald-100">{data.reporting_period}</p>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold sm:mt-0">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />Live database summary
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registered patients" value={kpi.total_registered_patients} detail="Active patient profiles" icon={HeartPulse} />
        <MetricCard label="Active frontline workers" value={kpi.active_asha_workers + kpi.active_anms} detail={`${kpi.active_asha_workers} ASHA · ${kpi.active_anms} ANM`} icon={Users} tone="blue" />
        <MetricCard label="Facilities" value={kpi.total_facilities} detail="Active healthcare facilities" icon={Building2} />
        <MetricCard label="Registered doctors" value={kpi.registered_doctors} detail="Active doctor profiles" icon={Stethoscope} tone="blue" />
        <MetricCard label="Pending referrals" value={kpi.pending_referrals} detail={`${kpi.urgent_referrals} urgent`} icon={ArrowUpRight} tone={kpi.urgent_referrals ? "rose" : "emerald"} />
        <MetricCard label="Appointments today" value={kpi.today_appointments} detail={`${kpi.upcoming_appointments} confirmed upcoming`} icon={CalendarDays} tone="blue" />
        <MetricCard label="Health radar alerts" value={kpi.health_radar_active_alerts} detail="Candidate alerts awaiting review" icon={Radar} tone={kpi.health_radar_active_alerts ? "amber" : "emerald"} />
        <MetricCard label="Overdue follow-ups" value={kpi.overdue_followups} detail={`${kpi.completed_referrals} referrals completed`} icon={ClipboardList} tone={kpi.overdue_followups ? "amber" : "emerald"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent administrative activity" subtitle="Latest events from the tamper-evident audit log">
          {data.recent_activity.length ? (
            <div className="divide-y divide-slate-100">
              {data.recent_activity.map((event) => (
                <div key={event.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{event.action.replace(/_/g, " ")}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{event.details || `${event.entity_type} ${event.entity_id || ""}`}</p>
                  </div>
                  <time className="shrink-0 text-[10px] text-slate-400">{formatDate(event.timestamp)}</time>
                </div>
              ))}
            </div>
          ) : <EmptyState label="Audit activity will appear here when recorded." />}
        </Panel>
        <Panel title="System health" subtitle="Current backend-reported service status">
          <div className="divide-y divide-slate-100">
            {Object.entries(system).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-xs capitalize text-slate-600">{name.replace(/_/g, " ")}</span>
                <StatusBadge value={value} />
              </div>
            ))}
          </div>
          <div className="m-4 flex gap-2 rounded-xl bg-sky-50 p-3 text-[11px] leading-5 text-sky-900">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            Clinical urgency remains governed by the versioned deterministic protocol and clinician oversight.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function UsersSection({ users, workersOnly, onCreateUser, onAction }: { users: UserRecord[]; workersOnly: boolean; onCreateUser: () => void; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  return (
    <Panel title={workersOnly ? "ASHA and ANM accounts" : "User accounts & access scopes"} subtitle="Role and account status are managed through the secured admin API" actions={<button type="button" onClick={onCreateUser} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0a4333] px-3.5 text-xs font-bold text-white hover:bg-[#0f5b47]"><Plus className="h-4 w-4" />Create account</button>}>
      {!users.length ? <EmptyState label={workersOnly ? "No frontline worker accounts match this search." : "No user accounts match this search."} /> : (
        <TableFrame>
          <TableHeader labels={["Name", "Role", "Mobile", "Scope", "First sign-in", "Status", "Action"]} />
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3"><p className="font-bold text-slate-900">{user.full_name}</p><p className="mt-0.5 text-[10px] text-slate-500">{user.employee_id || user.id.slice(0, 8)}</p></td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={user.role} /></td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{user.mobile}</td>
                <td className="min-w-44 px-4 py-3 text-slate-600">{scopeLabel(user.scope)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.first_login_done ? "Completed" : "Pending"}</td>
                <td className="px-4 py-3"><StatusBadge value={user.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button type="button" onClick={() => void onAction(
                    () => adminFetch(`/admin/users/${encodeURIComponent(user.id)}/status?is_active=${!user.is_active}`, { method: "PATCH" }),
                    `Account ${user.is_active ? "deactivated" : "activated"}.`,
                  )} className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function PatientsSection({ records }: { records: PatientRecord[] }) {
  return (
    <Panel title="Patient registry & consent" subtitle="Administrative roster view; sensitive contact and clinical details are not shown">
      {!records.length ? <EmptyState label="No patient records match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Patient", "Age / gender", "Village", "Consent", "Profile", "Registered"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3"><p className="font-bold text-slate-900">{patient.name}</p><p className="mt-0.5 font-mono text-[10px] text-slate-500">{patient.internal_id}</p></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{patient.age} · {patient.gender}</td>
                <td className="px-4 py-3 text-slate-600">{patient.village_name || "Not assigned"}</td>
                <td className="px-4 py-3"><StatusBadge value={patient.consent_status} /></td>
                <td className="px-4 py-3"><StatusBadge value={patient.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(patient.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function FacilitiesSection({ records, onCreate, onAction }: { records: FacilityRecord[]; onCreate: () => void; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  return (
    <Panel title="Facility network" subtitle="Facilities and their assigned workforce footprint" actions={<button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0a4333] px-3.5 text-xs font-bold text-white hover:bg-[#0f5b47]"><Plus className="h-4 w-4" />Add facility</button>}>
      {!records.length ? <EmptyState label="No facilities match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Facility", "Type", "District / block", "Villages", "Doctors", "Status", "Action"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((facility) => (
              <tr key={facility.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3"><p className="font-bold text-slate-900">{facility.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{facility.address || facility.phone || "No contact details"}</p></td>
                <td className="px-4 py-3"><StatusBadge value={facility.type} /></td>
                <td className="px-4 py-3 text-slate-600">{facility.district} · {facility.block}</td>
                <td className="px-4 py-3 text-slate-700">{facility.village_count}</td>
                <td className="px-4 py-3 text-slate-700">{facility.doctor_count}</td>
                <td className="px-4 py-3"><StatusBadge value={facility.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right"><button type="button" onClick={() => void onAction(
                  () => adminFetch(`/admin/facilities/${encodeURIComponent(facility.id)}/status?is_active=${!facility.is_active}`, { method: "PATCH" }),
                  `Facility ${facility.is_active ? "deactivated" : "activated"}.`,
                )} className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">{facility.is_active ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function VillagesSection({ data, search, onCreate, onAction }: { data: VillageDirectory | null; search: string; onCreate: () => void; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  const villages = filterRows(data?.villages ?? [], search, (row) => [row.name, row.block, row.district, row.assigned_facility_name]);
  return (
    <Panel title="Village coverage & facility assignment" subtitle="Administrative geography from the existing village registry" actions={<button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0a4333] px-3.5 text-xs font-bold text-white hover:bg-[#0f5b47]"><Plus className="h-4 w-4" />Add village</button>}>
      {!villages.length ? <EmptyState label="No villages match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Village", "Block / district", "Population", "Assigned facility", "Action"]} />
          <tbody className="divide-y divide-slate-100">
            {villages.map((village) => (
              <VillageRow key={village.id} village={village} facilities={data?.facilities ?? []} onAction={onAction} />
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function VillageRow({ village, facilities, onAction }: { village: VillageRecord; facilities: FacilityOption[]; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  const [facilityId, setFacilityId] = useState(village.assigned_facility_id ?? "");
  const changed = facilityId !== (village.assigned_facility_id ?? "");
  return (
    <tr className="hover:bg-slate-50">
      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">{village.name}</td>
      <td className="px-4 py-3 text-slate-600">{village.block} · {village.district}</td>
      <td className="px-4 py-3 text-slate-700">{village.population.toLocaleString("en-IN")}</td>
      <td className="min-w-52 px-4 py-3">
        <select aria-label={`Facility assigned to ${village.name}`} value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700">
          <option value="">Unassigned</option>
          {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
        </select>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button type="button" disabled={!changed} onClick={() => void onAction(
          () => adminFetch(`/admin/villages/${encodeURIComponent(village.id)}/facility`, {
            method: "PATCH",
            body: JSON.stringify({ facility_id: facilityId || null }),
          }),
          `Facility assignment updated for ${village.name}.`,
        )} className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Save</button>
      </td>
    </tr>
  );
}

function DoctorsSection({ records }: { records: DoctorRecord[] }) {
  return (
    <Panel title="Doctor directory & OPD coverage" subtitle="Clinical directory, facility assignment and availability">
      {!records.length ? <EmptyState label="No doctor profiles match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Doctor", "Specialty", "Facility", "OPD schedule", "Registration", "Status"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3"><p className="font-bold text-slate-900">{doctor.full_name}</p><p className="mt-0.5 text-[10px] text-slate-500">{doctor.qualification} · {doctor.experience_years} yrs</p></td>
                <td className="px-4 py-3 text-slate-700">{doctor.specialization}<p className="mt-0.5 text-[10px] text-slate-500">{doctor.department_name || "Department not set"}</p></td>
                <td className="px-4 py-3 text-slate-600">{doctor.facility_name || "Not assigned"}</td>
                <td className="min-w-40 px-4 py-3 text-slate-600">{doctor.opd_days}<p className="mt-0.5 text-[10px] text-slate-500">{doctor.opd_timings}</p></td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-600">{doctor.registration_number || "—"}</td>
                <td className="px-4 py-3"><StatusBadge value={doctor.is_active ? "ACTIVE" : "INACTIVE"} /></td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function AppointmentsSection({ records }: { records: AppointmentRecord[] }) {
  return (
    <Panel title="MediSlot appointments" subtitle="Booking status, clinician assignment and scheduled slot">
      {!records.length ? <EmptyState label="No appointments match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Booking", "Patient", "Doctor / facility", "Scheduled slot", "Reason", "Status"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-800">{appointment.booking_ref}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{appointment.patient_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{appointment.doctor_name || "—"}<p className="mt-0.5 text-[10px] text-slate-500">{appointment.facility_name || "Facility not set"}</p></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.slot_date || "—"}<p className="mt-0.5 text-[10px] text-slate-500">{appointment.slot_time || ""}</p></td>
                <td className="px-4 py-3 text-slate-600">{appointment.reason_code}</td>
                <td className="px-4 py-3"><StatusBadge value={appointment.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function ReferralsSection({ records }: { records: ReferralRecord[] }) {
  return (
    <Panel title="Closed-loop referrals" subtitle="Referral handoff and receiving facility acknowledgement">
      {!records.length ? <EmptyState label="No referrals match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Referral", "Patient", "Destination", "Reason", "Urgency", "Status", "Created"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((referral) => (
              <tr key={referral.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-800">{referral.referral_code}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{referral.patient_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{referral.receiving_facility_name || "—"}</td>
                <td className="min-w-48 px-4 py-3 text-slate-600">{referral.reason}</td>
                <td className="px-4 py-3"><StatusBadge value={referral.urgency} /></td>
                <td className="px-4 py-3"><StatusBadge value={referral.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(referral.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
      <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">Referral state transitions are performed by the responsible facility and clinical roles; this admin view is read-only.</p>
    </Panel>
  );
}

function SurveillanceSection({ records, onAction }: { records: AlertRecord[]; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  return (
    <Panel title="Health radar candidate alerts" subtitle="Alerts are signals for human investigation, not automated outbreak declarations">
      {!records.length ? <EmptyState label="No candidate alerts match this search." /> : (
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((alert) => (
            <article key={alert.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-bold text-slate-500">{alert.alert_code}</span><StatusBadge value={alert.severity} /></div>
              <h3 className="mt-3 text-sm font-bold leading-5 text-slate-900">{alert.title}</h3>
              <p className="mt-2 text-xs text-slate-600">{alert.case_count} candidate cases · {alert.disease_category}</p>
              <p className="mt-1 text-xs text-slate-500">{[alert.village_name, alert.block, alert.district].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div><StatusBadge value={alert.status} /><p className="mt-1 text-[10px] text-slate-400">Quality: {alert.data_quality}</p></div>
                {["NEW", "UNDER_REVIEW"].includes(alert.status) && (
                  <button type="button" onClick={() => void onAction(
                    () => adminFetch(`/surveillance/alerts/${encodeURIComponent(alert.id)}/review`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "UNDER_REVIEW", review_notes: "Review initiated by administrator." }),
                    }),
                    `Alert ${alert.alert_code} moved to review.`,
                  )} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0a4333] px-2.5 text-[10px] font-bold text-white hover:bg-[#0f5b47]"><ChevronDown className="h-3.5 w-3.5" />Review</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">Review does not confirm an outbreak. Clinical and public-health decisions remain with authorized officers.</p>
    </Panel>
  );
}

function TasksSection({ records }: { records: TaskRecord[] }) {
  return (
    <Panel title="Follow-up operations" subtitle="Assigned care coordination tasks and due-date monitoring">
      {!records.length ? <EmptyState label="No follow-up tasks match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Patient", "Task", "Assigned worker", "Due date", "Priority", "Status"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{task.patient_name || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{task.task_type.replace(/_/g, " ")}{task.notes && <p className="mt-1 max-w-xs truncate text-[10px] text-slate-500">{task.notes}</p>}</td>
                <td className="px-4 py-3 text-slate-600">{task.assigned_user_name || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(task.due_date)}</td>
                <td className="px-4 py-3"><StatusBadge value={task.priority} /></td>
                <td className="px-4 py-3"><StatusBadge value={task.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function DevicesSection({ records, onAction }: { records: DeviceRecord[]; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  return (
    <Panel title="Registered devices" subtitle="Device bindings for field-worker accounts; revoked devices cannot sync">
      {!records.length ? <EmptyState label="No registered devices match this search." /> : (
        <TableFrame>
          <TableHeader labels={["Device ID", "Assigned account", "Model", "Registered", "Last seen", "Status", "Action"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((device) => (
              <tr key={device.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-800">{device.device_id}</td>
                <td className="whitespace-nowrap px-4 py-3"><p className="font-semibold text-slate-800">{device.user_name}</p><p className="mt-0.5 text-[10px] text-slate-500">{device.role}</p></td>
                <td className="px-4 py-3 text-slate-600">{device.device_model || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(device.registered_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(device.last_seen_at)}</td>
                <td className="px-4 py-3"><StatusBadge value={device.is_revoked ? "REVOKED" : "BOUND"} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{!device.is_revoked && <button type="button" onClick={() => void onAction(
                  () => adminFetch(`/admin/devices/${encodeURIComponent(device.device_id)}/revoke`, { method: "POST" }),
                  "Device access revoked.",
                )} className="min-h-9 rounded-lg border border-rose-200 px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function AuditSection({ records }: { records: AuditRecord[] }) {
  return (
    <Panel title="Tamper-evident audit log" subtitle="Administrative and clinical system events in newest-first order">
      {!records.length ? <EmptyState label="No audit events have been recorded yet." /> : (
        <TableFrame>
          <TableHeader labels={["Time", "Action", "Entity", "Details", "SHA-256 signature"]} />
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(record.timestamp)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{record.action}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{record.entity_type}<p className="mt-0.5 font-mono text-[10px] text-slate-400">{record.entity_id || "—"}</p></td>
                <td className="min-w-56 px-4 py-3 text-slate-600">{record.details || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-emerald-800">{record.hash_signature ? `${record.hash_signature.slice(0, 20)}…` : "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
    </Panel>
  );
}

function ProtocolSection({ data }: { data: ProtocolRecord | null }) {
  if (!data) return <Panel title="Safety protocol"><EmptyState label="Protocol details could not be loaded." /></Panel>;
  return (
    <div className="space-y-5">
      <Panel title="Clinical safety protocol" subtitle="Version and sign-off information reported by the backend">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active protocol</p><p className="mt-2 text-base font-bold text-slate-900">{data.protocol_version}</p><p className="mt-1 text-xs text-slate-600">{data.title}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Protocol status</p><div className="mt-2"><StatusBadge value={data.status} /></div><p className="mt-2 text-xs text-slate-600">Effective {formatDate(data.effective_date)}</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clinical sign-off</p><p className="mt-2 text-sm font-semibold text-slate-800">{data.clinician_signoff}</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Golden-vector cases</p><p className="mt-2 text-2xl font-black text-slate-900">{data.golden_vectors.length}</p><p className="mt-1 text-xs text-slate-500">Reference vectors bundled with the active protocol</p></div>
        </div>
      </Panel>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><Shield className="mt-0.5 h-4 w-4 shrink-0" />The admin console does not change clinical thresholds or make diagnoses. Safety decisions are governed by the approved deterministic protocol and authorized clinicians.</div>
    </div>
  );
}

function CreateUserModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (body: Record<string, string | null>) => void | Promise<void> }) {
  const [form, setForm] = useState({ full_name: "", mobile: "", employee_id: "", role: "ASHA", password: "", district: "", block: "", village: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title="Create user account" onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...form, employee_id: form.employee_id || null });
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required value={form.full_name} onChange={(value) => update("full_name", value)} />
          <Field label="Mobile number" required type="tel" value={form.mobile} onChange={(value) => update("mobile", value)} />
          <Field label="Employee ID" value={form.employee_id} onChange={(value) => update("employee_id", value)} />
          <label className="block text-xs font-semibold text-slate-700">Role<select required value={form.role} onChange={(event) => update("role", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"><option value="ASHA">ASHA worker</option><option value="ANM">ANM / nurse</option><option value="DOCTOR">Doctor</option><option value="PHC_STAFF">PHC staff</option><option value="PUBLIC_HEALTH_OFFICER">Public health officer</option><option value="ADMIN">Administrator</option></select></label>
          <Field label="Temporary password" required type="password" value={form.password} onChange={(value) => update("password", value)} />
          <Field label="District" value={form.district} onChange={(value) => update("district", value)} />
          <Field label="Block" value={form.block} onChange={(value) => update("block", value)} />
          <Field label="Village" value={form.village} onChange={(value) => update("village", value)} />
        </div>
        <p className="text-[11px] leading-5 text-slate-500">A temporary password is required by the current API. Share it through an approved secure channel; it is not shown again after account creation.</p>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700">Cancel</button><button type="submit" className="min-h-10 rounded-xl bg-[#0a4333] px-4 text-xs font-bold text-white hover:bg-[#0f5b47]">Create account</button></div>
      </form>
    </Modal>
  );
}

function CreateFacilityModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (body: Record<string, string | null>) => void | Promise<void> }) {
  const [form, setForm] = useState({ name: "", type: "PHC", district: "", block: "", address: "", phone: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title="Add healthcare facility" onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility name" required value={form.name} onChange={(value) => update("name", value)} />
          <label className="block text-xs font-semibold text-slate-700">Facility type<select value={form.type} onChange={(event) => update("type", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"><option value="PHC">Primary Health Centre</option><option value="CHC">Community Health Centre</option><option value="DH">District Hospital</option><option value="SUB_CENTRE">Sub-centre</option></select></label>
          <Field label="District" required value={form.district} onChange={(value) => update("district", value)} />
          <Field label="Block" required value={form.block} onChange={(value) => update("block", value)} />
          <Field label="Address" value={form.address} onChange={(value) => update("address", value)} />
          <Field label="Phone" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700">Cancel</button><button type="submit" className="min-h-10 rounded-xl bg-[#0a4333] px-4 text-xs font-bold text-white hover:bg-[#0f5b47]">Save facility</button></div>
      </form>
    </Modal>
  );
}

function Field({ label, required, type = "text", value, onChange }: { label: string; required?: boolean; type?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" /></label>
  );
}

function CreateVillageModal({ facilities, onClose, onSubmit }: { facilities: FacilityOption[]; onClose: () => void; onSubmit: (body: Record<string, string | number | null>) => void | Promise<void> }) {
  const [form, setForm] = useState({ name: "", district: "", block: "", population: "1500", assigned_facility_id: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title="Add village coverage" onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name: form.name,
          district: form.district,
          block: form.block,
          population: Number(form.population),
          assigned_facility_id: form.assigned_facility_id || null,
        });
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Village name" required value={form.name} onChange={(value) => update("name", value)} />
          <Field label="Population" required type="number" value={form.population} onChange={(value) => update("population", value)} />
          <Field label="District" required value={form.district} onChange={(value) => update("district", value)} />
          <Field label="Block" required value={form.block} onChange={(value) => update("block", value)} />
          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">Assigned facility<select value={form.assigned_facility_id} onChange={(event) => update("assigned_facility_id", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10"><option value="">Unassigned</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700">Cancel</button><button type="submit" className="min-h-10 rounded-xl bg-[#0a4333] px-4 text-xs font-bold text-white hover:bg-[#0f5b47]">Save village</button></div>
      </form>
    </Modal>
  );
}

function SettingsSection({ data, onAction }: { data: AdminSettings | null; onAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean> }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (data) setEmail(data.email ?? "");
  }, [data]);

  if (!data) return <Panel title="Account settings"><EmptyState label="Administrator settings are unavailable." /></Panel>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changedEmail = email.trim() !== (data.email ?? "");
    if (!changedEmail && !newPassword) return;
    const saved = await onAction(
      () => adminFetch("/auth/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          email: changedEmail ? email.trim() : null,
          new_password: newPassword || null,
        }),
      }),
      "Administrator settings updated.",
    );
    if (saved) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Panel title="Administrator account" subtitle={`Signed in as ${data.full_name}`}>
        <form onSubmit={submit} className="max-w-xl space-y-4 p-5">
          <label className="block text-xs font-semibold text-slate-700">Account email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" /></label>
          <label className="block text-xs font-semibold text-slate-700">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" /><span className="mt-1 block font-normal text-slate-500">Leave blank to keep your current password.</span></label>
          <label className="block text-xs font-semibold text-slate-700">Current password (required to save)<input type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" /></label>
          <button type="submit" disabled={!currentPassword || (email.trim() === (data.email ?? "") && !newPassword)} className="min-h-10 rounded-xl bg-[#0a4333] px-4 text-xs font-bold text-white hover:bg-[#0f5b47] disabled:cursor-not-allowed disabled:opacity-50">Save account settings</button>
        </form>
      </Panel>
      <div className="h-fit rounded-2xl border border-sky-200 bg-sky-50 p-5 text-xs leading-5 text-sky-950">
        <div className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4" />Account security</div>
        <p className="mt-2">Email and password changes require your current password. If your password is changed, sign in again with the new credentials.</p>
        <p className="mt-2">Your administrator role and access scope are controlled by the backend and cannot be changed from this screen.</p>
      </div>
    </div>
  );
}
