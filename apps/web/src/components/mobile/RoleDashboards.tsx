"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Calendar, Clock, RefreshCw, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface DashboardTask {
  id: string;
  task_type: string;
  patient_name: string | null;
  due_date: string;
  status: string;
  priority: string;
}

interface DashboardReferral {
  id: string;
  referral_code: string;
  patient_name: string | null;
  urgency: string;
  status: string;
}

interface DashboardAppointment {
  id: string;
  patient_name: string | null;
  doctor_name: string | null;
  slot_date: string | null;
  slot_time: string | null;
  status: string;
  reason_code: string;
}

interface DoctorQueue {
  total_scheduled_today: number;
  urgent_count: number;
  queue: Array<{
    appointment_id: string;
    patient_name: string;
    slot_time: string | null;
    status: string;
    reason_code: string;
    is_urgent: boolean;
  }>;
}

interface DashboardData {
  patientCount: number;
  tasks: DashboardTask[];
  referrals: DashboardReferral[];
  appointments: DashboardAppointment[];
  doctorQueue: DoctorQueue | null;
}

type Role = "ASHA" | "ANM" | "DOCTOR" | "PHC_STAFF" | "PUBLIC_HEALTH_OFFICER";

const roleTitles: Record<Role, string> = {
  ASHA: "ASHA Worker",
  ANM: "ANM / Nurse",
  DOCTOR: "Doctor / Medical Officer",
  PHC_STAFF: "PHC Facility Staff",
  PUBLIC_HEALTH_OFFICER: "Public Health Officer",
};

export function RoleDashboard({
  role,
  onQuickAction,
  onSelectPatient,
  onSelectReferral,
}: {
  role: Role;
  onQuickAction: (action: "register" | "voice" | "book" | "referrals" | "tasks" | "sync") => void;
  onSelectPatient?: (patientName: string) => void;
  onSelectReferral?: (refId: string) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as {
          access_token?: string;
          role?: string;
        } | null;
        if (!session?.access_token || session.role !== role) {
          setError(`Sign in as ${roleTitles[role]} to load your live dashboard.`);
          return;
        }

        const [patients, tasks, referrals, appointments] = await Promise.all([
          apiRequest<Array<{ id: string }>>("/patients?limit=100", {}, session.access_token),
          apiRequest<DashboardTask[]>("/tasks", {}, session.access_token),
          apiRequest<DashboardReferral[]>("/referrals?limit=100", {}, session.access_token),
          role === "DOCTOR"
            ? apiRequest<DoctorQueue>("/doctor/queue", {}, session.access_token)
            : ["ASHA", "ANM", "PHC_STAFF"].includes(role)
              ? apiRequest<DashboardAppointment[]>("/appointments", {}, session.access_token)
              : Promise.resolve(null),
        ]);
        if (!active) return;
        setData({
          patientCount: patients.length,
          tasks,
          referrals,
          appointments: Array.isArray(appointments) ? appointments : [],
          doctorQueue: appointments && !Array.isArray(appointments) ? appointments as DoctorQueue : null,
        });
        setError("");
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load live dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => { active = false; };
  }, [role]);

  const pendingTasks = data?.tasks.filter((task) => task.status !== "COMPLETED") ?? [];
  const pendingReferrals = data?.referrals.filter((referral) => !["COMPLETED", "REJECTED"].includes(referral.status)) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = data?.appointments.filter((appointment) => appointment.slot_date === today && !["CANCELLED", "COMPLETED"].includes(appointment.status)) ?? [];
  const appointmentCount = data?.doctorQueue?.total_scheduled_today ?? todayAppointments.length;

  const quickActions: Array<{ label: string; caption: string; action: "register" | "voice" | "book" | "referrals" | "tasks" | "sync"; icon: typeof Users }> = [
    { label: "Patient registry", caption: "Find or register a patient", action: "register", icon: Users },
    { label: "Voice triage", caption: "Run the clinical safety check", action: "voice", icon: Activity },
    { label: "Appointments", caption: "View doctors and available slots", action: "book", icon: Calendar },
    { label: "Referrals", caption: "Track the referral lifecycle", action: "referrals", icon: ArrowUpRight },
    { label: "Follow-up tasks", caption: "Review work assigned to you", action: "tasks", icon: Clock },
  ];

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#0B6E4F] p-4 text-white shadow-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">{roleTitles[role]} · Live workspace</p>
        <h2 className="mt-1 text-base font-extrabold">Today&apos;s care coordination</h2>
        <p className="mt-1 text-xs text-emerald-100">Counts and records below are loaded from your authorized backend scope.</p>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          {error}
          {!data && <Link href="/worker-login" className="ml-1 font-bold underline">Sign in</Link>}
        </div>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Patients in scope", data?.patientCount],
          ["Open follow-ups", pendingTasks.length],
          ["Open referrals", pendingReferrals.length],
          ["Today appointments", appointmentCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
            <span className="block text-xl font-black text-emerald-900">
              {loading ? "…" : value ?? "—"}
            </span>
            <span className="text-[10px] font-medium text-slate-500">{label}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        {quickActions.map(({ label, caption, action, icon: Icon }) => (
          <button key={action} type="button" onClick={() => onQuickAction(action)} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-xs hover:border-emerald-200">
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800"><Icon className="h-4 w-4" /></span>
            <span><span className="block text-xs font-bold text-slate-900">{label}</span><span className="block text-[10px] text-slate-500">{caption}</span></span>
          </button>
        ))}
      </section>

      {role === "DOCTOR" && data?.doctorQueue && (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Today&apos;s OPD queue · {data.doctorQueue.total_scheduled_today}</h3>
          {data.doctorQueue.queue.length === 0 && <p className="text-xs text-slate-500">No appointments in today&apos;s server queue.</p>}
          <ul className="space-y-2">
            {data.doctorQueue.queue.slice(0, 8).map((appointment) => (
              <li key={appointment.appointment_id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                <span><strong>{appointment.patient_name}</strong><span className="ml-1 text-slate-500">· {appointment.slot_time ?? "Time unavailable"} · {appointment.reason_code}</span></span>
                <button type="button" onClick={() => onQuickAction("book")} className="font-bold text-emerald-800">{appointment.status}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Open follow-ups</h3>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-800" />}
        </div>
        {pendingTasks.length === 0 && !loading && <p className="text-xs text-slate-500">No assigned follow-ups from the server.</p>}
        <ul className="space-y-2">
          {pendingTasks.slice(0, 5).map((task) => (
            <li key={task.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
              <span><strong>{task.task_type.replaceAll("_", " ")}</strong><span className="ml-1 text-slate-500">· {task.patient_name ?? "Patient"} · Due {new Date(task.due_date).toLocaleDateString()}</span></span>
              <span className="font-bold text-amber-800">{task.priority}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => onQuickAction("tasks")} className="mt-3 text-xs font-bold text-emerald-800 underline">Open task center</button>
      </section>

      {role !== "DOCTOR" && (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Recent referrals</h3>
          {pendingReferrals.length === 0 && !loading && <p className="text-xs text-slate-500">No open referrals from the server.</p>}
          <ul className="space-y-2">
            {pendingReferrals.slice(0, 5).map((referral) => (
              <li key={referral.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                <span><strong>{referral.patient_name ?? referral.referral_code}</strong><span className="ml-1 text-slate-500">· {referral.referral_code} · {referral.status}</span></span>
                <button type="button" onClick={() => onSelectReferral?.(referral.id)} className="font-bold text-emerald-800 underline">{referral.urgency}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
