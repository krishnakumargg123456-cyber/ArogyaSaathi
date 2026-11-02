"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface PatientOption {
  id: string;
  name: string;
  internal_id: string;
  age: number;
  gender: string;
  chronic_conditions: string | null;
  has_active_consent: boolean;
}

interface VitalRecord {
  id: string;
  type: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  blood_glucose: number | null;
  glucose_context: string | null;
  temperature: number | null;
  spo2: number | null;
  recorded_at: string;
}

interface PatientProfile {
  vitals: VitalRecord[];
}

export function ChronicCareScreen({ initialPatientId = "" }: { initialPatientId?: string }) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState(initialPatientId);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [glucose, setGlucose] = useState("");
  const [glucoseContext, setGlucoseContext] = useState("RANDOM");

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as {
        access_token?: string;
        role?: string;
      } | null;
      if (!session?.access_token || !session.role) {
        setError("Sign in with a health-worker account to view or record patient vitals.");
        setLoading(false);
        return;
      }
      setToken(session.access_token);
    } catch {
      setError("Your saved session is invalid. Sign in again to continue.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<PatientOption[]>("/patients?limit=100", {}, token)
      .then((records) => {
        if (!active) return;
        const consented = records.filter((patient) => patient.has_active_consent);
        setPatients(consented);
        setPatientId((current) => (
          consented.some((patient) => patient.id === initialPatientId)
            ? initialPatientId
            : consented.some((patient) => patient.id === current)
              ? current
              : consented[0]?.id ?? ""
        ));
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load patient records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token, initialPatientId]);

  useEffect(() => {
    if (!token || !patientId) {
      setVitals([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<PatientProfile>(`/patients/${patientId}`, {}, token)
      .then((profile) => {
        if (active) setVitals(profile.vitals ?? []);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load the patient's vital history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token, patientId]);

  async function saveVitals(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId) {
      setError("Select a patient before recording measurements.");
      return;
    }
    if (!systolic && !diastolic && !glucose) {
      setError("Enter blood pressure or glucose before saving.");
      return;
    }
    if (Boolean(systolic) !== Boolean(diastolic)) {
      setError("Enter both systolic and diastolic blood pressure.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiRequest<VitalRecord>(`/patients/${patientId}/observations`, {
        method: "POST",
        body: JSON.stringify({
          systolic_bp: systolic ? Number(systolic) : null,
          diastolic_bp: diastolic ? Number(diastolic) : null,
          blood_glucose: glucose ? Number(glucose) : null,
          glucose_context: glucose ? glucoseContext : null,
        }),
      }, token);
      const profile = await apiRequest<PatientProfile>(`/patients/${patientId}`, {}, token);
      setVitals(profile.vitals ?? []);
      setSystolic("");
      setDiastolic("");
      setGlucose("");
      setNotice("Measurements saved to the patient record.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save measurements.");
    } finally {
      setSaving(false);
    }
  }

  const selectedPatient = patients.find((patient) => patient.id === patientId);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F7FAF9] pb-20">
      <header className="rounded-b-2xl bg-[#0B6E4F] p-4 text-white shadow-md">
        <h2 className="text-lg font-bold">Chronic Care & Vitals</h2>
        <p className="text-xs text-emerald-100">Patient measurements and history from the care database</p>
      </header>
      <div className="space-y-4 p-4">
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
            {!token && <Link href="/worker-login" className="ml-1 font-bold underline">Sign in</Link>}
          </p>
        )}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{notice}</p>}
        <label className="block text-xs font-bold text-slate-800">
          Patient
          <select
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            disabled={loading || patients.length === 0}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">{loading ? "Loading assigned patients…" : "Select patient"}</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} · {patient.internal_id}{patient.chronic_conditions ? ` · ${patient.chronic_conditions}` : ""}
              </option>
            ))}
          </select>
        </label>
        {selectedPatient && (
          <p className="rounded-xl bg-white p-3 text-xs text-slate-600">
            {selectedPatient.age} years · {selectedPatient.gender} · {selectedPatient.chronic_conditions || "No chronic condition noted"}
          </p>
        )}

        <form onSubmit={(event) => void saveVitals(event)} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Record measurements</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700">Systolic BP
              <input type="number" min="40" max="300" value={systolic} onChange={(event) => setSystolic(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Diastolic BP
              <input type="number" min="20" max="200" value={diastolic} onChange={(event) => setDiastolic(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Blood glucose (mmol/L)
              <input type="number" min="0.1" max="100" step="0.1" value={glucose} onChange={(event) => setGlucose(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Glucose context
              <select value={glucoseContext} onChange={(event) => setGlucoseContext(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2">
                <option value="FASTING">Fasting</option>
                <option value="RANDOM">Random</option>
                <option value="POSTPRANDIAL">Postprandial</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving || !patientId} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-xs font-bold text-white disabled:opacity-50">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save to patient record"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900">Recorded measurements</h3>
          </div>
          {loading && <p className="text-xs text-slate-500">Loading vital history…</p>}
          {!loading && patientId && vitals.length === 0 && <p className="text-xs text-slate-500">No measurements recorded for this patient.</p>}
          <ul className="space-y-2">
            {vitals.map((record) => (
              <li key={record.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-800">{new Date(record.recorded_at).toLocaleString()}</p>
                <p className="mt-1 text-slate-600">
                  {record.systolic_bp != null && record.diastolic_bp != null && `BP ${record.systolic_bp}/${record.diastolic_bp} mmHg`}
                  {record.blood_glucose != null && ` · Glucose ${record.blood_glucose} mmol/L${record.glucose_context ? ` (${record.glucose_context.toLowerCase()})` : ""}`}
                  {record.temperature != null && ` · ${record.temperature}°C`}
                  {record.spo2 != null && ` · SpO₂ ${record.spo2}%`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
