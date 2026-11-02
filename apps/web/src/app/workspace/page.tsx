"use client";

import React, { useEffect, useState } from "react";
import { 
  Smartphone, Monitor, UserCheck, Bell, Shield, 
  Wifi, CloudOff, RefreshCw, Layers, PhoneCall, ChevronDown
} from "lucide-react";
import { AndroidStatusBar, SyncBadge } from "@/components/mobile/MobileHeader";
import { MobileBottomNav, MobileTab } from "@/components/mobile/MobileBottomNav";
import { RoleDashboard } from "@/components/mobile/RoleDashboards";
import { VoiceTriageScreen } from "@/components/mobile/VoiceTriageScreen";
import { PatientRegistryScreen } from "@/components/mobile/PatientRegistryScreen";
import { ReferralsScreen } from "@/components/mobile/ReferralsScreen";
import { AppointmentBookingScreen } from "@/components/mobile/AppointmentBookingScreen";
import { SyncCenterScreen } from "@/components/mobile/SyncCenterScreen";
import { TasksCenterScreen } from "@/components/mobile/TasksCenterScreen";
import { ChronicCareScreen } from "@/components/mobile/ChronicCareScreen";
import { WebAdminConsole } from "@/components/admin/WebAdminConsole";
import { PatientFamilyDashboard } from "@/components/patient/PatientFamilyDashboard";
import { FEATURE_MODULES } from "@/config/siteData";
import { apiRequest } from "@/lib/api";
import { SafetyDecisionResult } from "@/lib/safetyEngine";

const MODULE_DESTINATIONS: Record<string, { surface: "mobile" | "admin"; tab?: MobileTab; adminSection?: "overview" | "users" | "radar" }> = {
  "patient-management": { surface: "mobile", tab: "patients" },
  "voice-triage": { surface: "mobile", tab: "voice" },
  "chronic-care": { surface: "mobile", tab: "chronic" },
  "referral-management": { surface: "mobile", tab: "referrals" },
  "health-radar": { surface: "admin", adminSection: "radar" },
  "reports-analytics": { surface: "admin", adminSection: "overview" },
  "notifications-tasks": { surface: "mobile", tab: "home" },
  "administration-governance": { surface: "admin", adminSection: "users" },
  "multi-language-support": { surface: "mobile", tab: "voice" },
};

const API_BACKED_MODULES = new Set([
  "patient-management",
  "voice-triage",
  "chronic-care",
  "referral-management",
  "notifications-tasks",
  "health-radar",
  "reports-analytics",
  "administration-governance",
]);

export default function WorkspacePage() {
  // Top-level surface mode: "mobile" | "admin" | "patient"
  const [surfaceMode, setSurfaceMode] = useState<"mobile" | "admin" | "patient">("mobile");

  // Mobile App State
  const [activeTab, setActiveTab] = useState<MobileTab | "chronic">("home");
  const [currentRole, setCurrentRole] = useState<"ASHA" | "ANM" | "DOCTOR" | "PHC_STAFF" | "PUBLIC_HEALTH_OFFICER">("ASHA");
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "pending" | "offline">("synced");
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedModuleSlug, setSelectedModuleSlug] = useState("");
  const [workflowNotice, setWorkflowNotice] = useState("");
  const [workflowError, setWorkflowError] = useState("");

  useEffect(() => {
    const moduleSlug = new URLSearchParams(window.location.search).get("module") ?? "";
    const destination = MODULE_DESTINATIONS[moduleSlug];
    if (!destination) return;

    setSelectedModuleSlug(moduleSlug);
    setSurfaceMode(destination.surface);
    if (destination.tab) setActiveTab(destination.tab);
  }, []);

  const selectedModule = FEATURE_MODULES.find((module) => module.slug === selectedModuleSlug);
  const selectedDestination = MODULE_DESTINATIONS[selectedModuleSlug];
  const moduleStatusLabel = selectedModule
    ? API_BACKED_MODULES.has(selectedModule.slug)
      ? "Backend API • sign-in required for protected data"
      : selectedModule.status.startsWith("Planned")
        ? "Planned module • illustrative preview"
        : "Interactive preview • illustrative data"
    : "Interactive preview • illustrative sample records";

  // Role metadata
  const roleMetadata = {
    ASHA: {
      name: "Sunita Devi",
      badge: "ASHA Worker",
      location: "Village: Rampur | Block: Sitapur | District: Sitapur",
      avatar: "SD"
    },
    ANM: {
      name: "Priya Sharma",
      badge: "ANM / Nurse",
      location: "PHC Centre | Block: Sitapur",
      avatar: "PS"
    },
    DOCTOR: {
      name: "Dr. Arjun Mehta",
      badge: "General Physician",
      location: "PHC Sitapur | Dept: General Medicine",
      avatar: "AM"
    },
    PHC_STAFF: {
      name: "Rahul Singh",
      badge: "PHC Staff",
      location: "Sitapur PHC • Facility Staff",
      avatar: "RS"
    },
    PUBLIC_HEALTH_OFFICER: {
      name: "Dr. Neha Verma",
      badge: "Public Health Officer",
      location: "District Health Office • Sitapur",
      avatar: "NV"
    }
  };

  const currentMeta = roleMetadata[currentRole];

  const handleSyncNow = () => {
    setSyncStatus("syncing");
  };

  const handleSyncCompleted = (success: boolean) => {
    setSyncStatus(isOffline ? "offline" : success ? "synced" : "pending");
  };

  const handleCreateUrgentReferral = async (
    patientId: string,
    facilityId: string,
    symptoms: string,
    decision: SafetyDecisionResult
  ) => {
    const savedSession = sessionStorage.getItem("arogyasaathi_session");
    if (!savedSession) {
      setWorkflowError("Sign in with a health-worker account before creating a referral.");
      return;
    }
    let token: string;
    try {
      const session = JSON.parse(savedSession) as { access_token?: string };
      if (!session.access_token) throw new Error("Your session has expired. Sign in again.");
      token = session.access_token;
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Your saved sign-in session is invalid.");
      return;
    }

    setWorkflowError("");
    setWorkflowNotice("");
    try {
      const created = await apiRequest<{ referral_code: string }>("/referrals", {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          receiving_facility_id: facilityId,
          urgency: "URGENT",
          reason: [symptoms.trim(), decision.clinical_explanation, decision.recommended_action].filter(Boolean).join(" — "),
          history_packet: {
            decision_id: decision.decision_id,
            protocol_version: decision.protocol_version,
            escalation_level: decision.escalation_level,
            triggered_rules: decision.triggered_rules,
          },
        }),
      }, token);
      setWorkflowNotice(`Urgent referral ${created.referral_code} saved to the server.`);
      setActiveTab("referrals");
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Could not create an urgent referral.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Top Application Switcher Bar */}
      <header className="h-14 bg-slate-950 text-white border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0B6E4F] flex items-center justify-center font-black text-white text-sm shadow-md">
            AS
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none text-white">ArogyaSaathi</h1>
            <span className="text-[10px] text-emerald-400 font-medium">
              {selectedModuleSlug === "patient-management"
                ? "Patient Management • protected patient records"
                : selectedModule
                  ? `${selectedModule.title} • ${selectedModule.status}`
                  : "Interactive preview • illustrative sample records"}
            </span>
          </div>
        </div>

        {/* 3 Main Interfaces Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
          <button
            onClick={() => setSurfaceMode("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              surfaceMode === "mobile"
                ? "bg-[#0B6E4F] text-white shadow-sm font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Mobile App</span>
          </button>

          <button
            onClick={() => setSurfaceMode("admin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              surfaceMode === "admin"
                ? "bg-[#0B6E4F] text-white shadow-sm font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Web Admin Console</span>
          </button>

          <button
            onClick={() => setSurfaceMode("patient")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              surfaceMode === "patient"
                ? "bg-[#0B6E4F] text-white shadow-sm font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Patient Portal (P2)</span>
          </button>
        </div>

        {/* Frame Toggle & Status */}
        <div className="flex items-center gap-3 text-xs">
          <label className="sr-only" htmlFor="workspace-module">Open a feature dashboard</label>
          <select
            id="workspace-module"
            value={selectedModuleSlug}
            onChange={(event) => {
              const nextModule = event.target.value;
              window.location.assign(nextModule ? `/workspace?module=${nextModule}` : "/workspace");
            }}
            className="max-w-40 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
          >
            <option value="">All modules</option>
            {FEATURE_MODULES.map((module) => (
              <option key={module.id} value={module.slug}>{module.title}</option>
            ))}
          </select>
          {surfaceMode === "mobile" && (
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              {isPhoneFrame ? "Full Width Mode" : "Phone Frame Mode"}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{moduleStatusLabel}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedModule && (
          <section aria-labelledby="selected-module-title" className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 text-slate-900 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">{selectedModule.category}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{selectedModule.status}</span>
                </div>
                <h2 id="selected-module-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  {selectedModule.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  {selectedModule.fullDesc}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">For:</span> {selectedModule.targetRoles.join(" · ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Included in this module</p>
                <ul className="mt-2 grid gap-x-5 gap-y-1.5 text-xs leading-5 text-slate-600 sm:grid-cols-2">
                  {selectedModule.keyCapabilities.map((capability) => (
                    <li key={capability} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-l-2 border-amber-400 pl-2.5 text-[11px] leading-5 text-slate-600">
                  <span className="font-bold text-slate-800">Safety boundary:</span> {selectedModule.safetyBoundaries}
                </p>
              </div>
            </div>
          </section>
        )}
        {/* ==========================================
            INTERFACE A: ANDROID MOBILE APPLICATION
           ========================================== */}
        {surfaceMode === "mobile" && (
          <div className="flex-1 flex flex-col items-center justify-center p-0 sm:p-4 overflow-y-auto bg-slate-900/90">
            {/* Mobile Role Switcher Pill Bar */}
            <div className="w-full max-w-md mb-3 flex items-center justify-between px-2 text-xs">
              <span className="text-slate-400 font-medium">Select Field Role:</span>
              <div className="flex gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-[11px] font-bold">
                {(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentRole(r);
                      setActiveTab("home");
                    }}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      currentRole === r
                        ? "bg-[#0B6E4F] text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r === "PUBLIC_HEALTH_OFFICER" ? "PHO" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Android Device Shell Container */}
            <div
              className={`w-full bg-[#F7FAF9] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
                isPhoneFrame
                  ? "max-w-md h-[880px] rounded-3xl border-8 border-slate-800 ring-1 ring-slate-700/50"
                  : "max-w-3xl min-h-screen rounded-none"
              }`}
            >
              {/* Android Native Status Bar */}
              <AndroidStatusBar />

              {/* Mobile Header matching provided mockups */}
              <div className="bg-[#0B6E4F] text-white px-4 pt-3 pb-4 rounded-b-3xl shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white text-[#0B6E4F] font-extrabold flex items-center justify-center text-sm shadow-xs border border-emerald-200">
                      {currentMeta.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-emerald-200">Good Morning</span>
                      </div>
                      <h3 className="font-extrabold text-sm leading-tight text-white flex items-center gap-1.5">
                        {currentMeta.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100 font-semibold border border-emerald-700">
                          {currentMeta.badge}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("more")}
                      className="relative p-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                    </button>
                  </div>
                </div>

                {/* Sub-header details: Location & Weather Pill */}
                <div className="flex items-center justify-between text-[11px] text-emerald-100/90 pt-1 border-t border-emerald-700/60">
                  <span className="truncate max-w-[220px]">{currentMeta.location}</span>
                  
                  {/* Weather & Sync Pill */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-800/70 text-emerald-200 font-medium text-[10px]">
                      🌤️ 24°C Clear
                    </span>
                    <SyncBadge 
                      status={syncStatus} 
                      pendingCount={1}
                      onSyncClick={() => setActiveTab("more")}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Screen View based on Active Tab */}
              <div className="flex-1 overflow-y-auto">
                {(workflowNotice || workflowError) && (
                  <div role={workflowError ? "alert" : "status"} className={`m-3 rounded-xl border p-3 text-xs ${
                    workflowError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}>
                    {workflowError || workflowNotice}
                    <button className="ml-2 font-bold underline" onClick={() => { setWorkflowError(""); setWorkflowNotice(""); }}>Dismiss</button>
                  </div>
                )}
                {activeTab === "home" && (
                  <RoleDashboard
                    role={currentRole}
                    onQuickAction={action => {
                      if (action === "voice") setActiveTab("voice");
                      else if (action === "register") setActiveTab("patients");
                      else if (action === "referrals") setActiveTab("referrals");
                      else if (action === "book") setActiveTab("more");
                      else if (action === "sync") setActiveTab("more");
                      else setActiveTab("more");
                    }}
                    onSelectPatient={name => {
                      setSelectedPatientForBooking(name);
                      setActiveTab("patients");
                    }}
                    onSelectReferral={() => setActiveTab("referrals")}
                  />
                )}

                {activeTab === "patients" && (
                  <PatientRegistryScreen
                    onStartTriageForPatient={p => {
                      setSelectedPatientForBooking(`${p.name} (${p.age} ${p.gender[0]})`);
                      setSelectedPatientId(p.id);
                      setActiveTab("voice");
                    }}
                    onBookForPatient={p => {
                      setSelectedPatientForBooking(`${p.name} (${p.age} ${p.gender[0]})`);
                      setSelectedPatientId(p.id);
                      setActiveTab("more");
                    }}
                  />
                )}

                {activeTab === "voice" && (
                  <VoiceTriageScreen
                    initialPatientId={selectedPatientId}
                    onReferralCreate={handleCreateUrgentReferral}
                  />
                )}

                {activeTab === "referrals" && (
                  <ReferralsScreen
                    role={currentRole}
                  />
                )}

                {activeTab === "chronic" && (
                  <ChronicCareScreen initialPatientId={selectedPatientId} />
                )}

                {activeTab === "more" && (
                  <div className="flex flex-col h-full overflow-y-auto bg-[#F7FAF9]">
                    <div className="p-4 space-y-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab("chronic")}
                        className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-left text-xs font-bold text-emerald-900"
                      >
                        Open Chronic Care · view and record patient vitals
                      </button>
                      <TasksCenterScreen />
                      {/* MediSlot Appointment Booking Module */}
                      <AppointmentBookingScreen
                        initialPatientName={selectedPatientForBooking}
                        initialPatientId={selectedPatientId}
                        onBookingSuccess={ref => {
                          setWorkflowNotice(`Appointment ${ref} confirmed by the server.`);
                        }}
                      />

                      {/* Sync Centre Component */}
                      <SyncCenterScreen
                        isOfflineMode={isOffline}
                        onToggleOffline={() => {
                          const next = !isOffline;
                          setIsOffline(next);
                          setSyncStatus(next ? "offline" : "synced");
                        }}
                        onSyncTriggered={handleSyncNow}
                        onSyncCompleted={handleSyncCompleted}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Thumb-friendly Android 5-Tab Navigation Bar */}
              <MobileBottomNav
                activeTab={activeTab === "chronic" ? "more" : activeTab}
                onTabChange={setActiveTab}
                role={currentRole}
              />
            </div>
          </div>
        )}

        {/* ==========================================
            INTERFACE B: WEB ADMIN CONSOLE
           ========================================== */}
        {surfaceMode === "admin" && (
          <div className="flex-1 h-full overflow-hidden">
            <WebAdminConsole initialSection={selectedDestination?.adminSection ?? "overview"} />
          </div>
        )}

        {/* ==========================================
            INTERFACE C: PATIENT / FAMILY DASHBOARD (P2)
           ========================================== */}
        {surfaceMode === "patient" && (
          <div className="flex-1 h-full overflow-y-auto">
            <PatientFamilyDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
