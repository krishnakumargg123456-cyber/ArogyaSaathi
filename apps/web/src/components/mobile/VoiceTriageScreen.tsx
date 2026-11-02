import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { SafetyDecisionResult, SymptomInput } from "@/lib/safetyEngine";

interface VoiceTriageScreenProps {
  onReferralCreate?: (patientId: string, facilityId: string, symptoms: string, decision: SafetyDecisionResult) => void;
  initialPatientId?: string;
}

interface TriagePatient {
  id: string;
  internal_id: string;
  name: string;
  age: number;
  gender: string;
  has_active_consent: boolean;
}

interface TriageFacility {
  id: string;
  name: string;
  district: string;
  block: string;
}

export function VoiceTriageScreen({
  onReferralCreate,
  initialPatientId
}: VoiceTriageScreenProps) {
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [transcript, setTranscript] = useState("");
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [facilities, setFacilities] = useState<TriageFacility[]>([]);
  const [facilityId, setFacilityId] = useState("");
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [evaluationError, setEvaluationError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [systolicBp, setSystolicBp] = useState<number | undefined>(undefined);
  const [diastolicBp, setDiastolicBp] = useState<number | undefined>(undefined);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [bloodGlucose, setBloodGlucose] = useState<number | undefined>(undefined);
  const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
  const [decision, setDecision] = useState<SafetyDecisionResult | null>(null);

  useEffect(() => {
    const savedSession = sessionStorage.getItem("arogyasaathi_session");
    if (!savedSession) {
      setEvaluationError("Sign in with an authorized health-worker account to run a clinical safety evaluation.");
      setLoadingPatients(false);
      return;
    }

    try {
      const session = JSON.parse(savedSession) as { access_token?: string; role?: string };
      if (!session.access_token || !["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"].includes(session.role ?? "")) {
        setEvaluationError("An authorized health-worker account is required to run triage.");
        setLoadingPatients(false);
        return;
      }
      setAccessToken(session.access_token);
      setEvaluationError("");
    } catch {
      setEvaluationError("Your saved sign-in session is invalid. Sign in again to continue.");
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    Promise.all([
      apiRequest<Array<TriagePatient & { village_id: string | null }>>("/patients?limit=100", {}, accessToken),
      apiRequest<TriageFacility[]>("/facilities"),
    ])
      .then(([records, facilities]) => {
        if (!active) return;
        const consentedPatients = records.filter(record => record.has_active_consent);
        setPatients(consentedPatients);
        const preferredPatient = consentedPatients.find(patient => patient.id === initialPatientId)
          ?? consentedPatients.find(patient => patient.id === patientId)
          ?? consentedPatients[0];
        setPatientId(preferredPatient?.id ?? "");
        setFacilities(facilities);
        setFacilityId(facilities[0]?.id ?? "");
      })
      .catch(error => {
        if (active) setEvaluationError(error instanceof Error ? error.message : "Could not load eligible patients and receiving facilities.");
      })
      .finally(() => {
        if (active) setLoadingPatients(false);
      });
    return () => { active = false; };
  }, [accessToken, initialPatientId]);

  const selectedPatient = patients.find(patient => patient.id === patientId);

  const handleEvaluate = async () => {
    if (!accessToken || !selectedPatient) {
      setEvaluationError("Select a patient with active consent before evaluation.");
      return;
    }
    if (symptoms.length === 0 && systolicBp === undefined && diastolicBp === undefined && temperature === undefined && bloodGlucose === undefined) {
      setEvaluationError("Enter at least one symptom or vital sign before evaluation.");
      return;
    }
    setIsEvaluating(true);
    setEvaluationError("");
    try {
      const vitals = {
        ...(systolicBp !== undefined ? { systolic_bp: systolicBp } : {}),
        ...(diastolicBp !== undefined ? { diastolic_bp: diastolicBp } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(bloodGlucose !== undefined ? { blood_glucose: bloodGlucose } : {}),
      };
      const result = await apiRequest<SafetyDecisionResult>("/triage/evaluate", {
        method: "POST",
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          symptoms,
          ...(Object.keys(vitals).length ? { vitals } : {}),
        }),
      }, accessToken);
      setDecision(result);
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : "Clinical safety evaluation failed.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7FAF9] overflow-y-auto pb-20">
      {/* Top Header Card */}
      <div className="bg-[#0B6E4F] text-white p-4 rounded-b-2xl shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2">Clinical Triage & Safety Check</h2>
          {/* Language Switcher */}
          <div className="flex bg-[#064E3B] p-0.5 rounded-full text-xs font-semibold">
            <button
              onClick={() => setLanguage("hi")}
              className={`px-3 py-1 rounded-full transition-colors ${language === "hi" ? "bg-white text-[#0B6E4F]" : "text-emerald-100"}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-full transition-colors ${language === "en" ? "bg-white text-[#0B6E4F]" : "text-emerald-100"}`}
            >
              English
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-emerald-700/50 bg-emerald-800/60 p-2.5 text-xs">
          <label htmlFor="triage-patient" className="text-emerald-100">Patient with active consent</label>
          <select
            id="triage-patient"
            value={patientId}
            onChange={event => {
              setPatientId(event.target.value);
              setDecision(null);
            }}
            disabled={loadingPatients || patients.length === 0}
            className="w-full rounded-lg bg-white px-3 py-2 font-semibold text-slate-900"
          >
            <option value="">{loadingPatients ? "Loading patients…" : "Select patient"}</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} · {patient.internal_id} · {patient.age} yrs
              </option>
            ))}
          </select>
          {selectedPatient && <span className="block text-emerald-100">Consent: Active · {selectedPatient.gender}</span>}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          Voice transcription is not configured in this deployment. No audio is recorded or sent. Enter symptoms manually; the safety decision is evaluated by the server.
        </div>

        {/* Extracted Symptoms & Vitals Check */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span>Symptoms and measurements</span>
            <span className="text-[10px] text-gray-500 font-normal">Manual entry</span>
          </h3>

          <label className="block text-xs font-medium text-gray-600">
            Symptoms (one per line, English clinical terms)
            <textarea
              value={transcript}
              onChange={event => {
                const text = event.target.value;
                setTranscript(text);
                setSymptoms(text.split(/\r?\n/).map(name => name.trim()).filter(Boolean).map(name => ({
                  name: name.toLowerCase().replace(/\s+/g, "_"),
                  duration_days: 1,
                  severity: "MODERATE",
                })));
                setDecision(null);
              }}
              rows={3}
              placeholder="fever&#10;difficulty breathing"
              className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs"
            />
          </label>
          {symptoms.map((symptom, index) => (
            <label key={`${symptom.name}-${index}`} className="grid grid-cols-3 items-center gap-2 text-xs">
              <span className="col-span-3 font-semibold capitalize text-gray-800">{symptom.name.replace(/_/g, " ")}</span>
              <span>Duration (days)</span>
              <input
                type="number"
                min="0"
                value={symptom.duration_days ?? 1}
                onChange={event => setSymptoms(current => current.map((item, itemIndex) => itemIndex === index
                  ? { ...item, duration_days: Number(event.target.value) }
                  : item))}
                className="rounded-lg border border-gray-200 p-2"
              />
              <select
                value={symptom.severity ?? "MODERATE"}
                onChange={event => setSymptoms(current => current.map((item, itemIndex) => itemIndex === index
                  ? { ...item, severity: event.target.value as SymptomInput["severity"] }
                  : item))}
                className="rounded-lg border border-gray-200 bg-white p-2"
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </label>
          ))}

          {/* Vitals quick entry */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-700 block mb-2">Vitals for Safety Evaluation</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-light p-2 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Blood Pressure (mmHg)</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={systolicBp ?? ""}
                    onChange={e => setSystolicBp(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-14 text-sm font-bold bg-white px-1.5 py-0.5 rounded border border-gray-300 text-center"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    value={diastolicBp ?? ""}
                    onChange={e => setDiastolicBp(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-14 text-sm font-bold bg-white px-1.5 py-0.5 rounded border border-gray-300 text-center"
                  />
                </div>
              </div>

              <div className="bg-surface-light p-2 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block">Temperature (°F)</span>
                <input
                  type="number"
                  step="0.1"
                  value={temperature ?? ""}
                  onChange={e => setTemperature(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-sm font-bold bg-white px-2 py-0.5 rounded border border-gray-300 mt-1"
                />
              </div>
              <div className="bg-surface-light p-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Blood Glucose (mg/dL)</span>
              <input
                type="number"
                min="0"
                value={bloodGlucose ?? ""}
                onChange={event => setBloodGlucose(event.target.value ? Number(event.target.value) : undefined)}
                className="w-full text-sm font-bold bg-white px-2 py-0.5 rounded border border-gray-300 mt-1"
              />
              </div>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !selectedPatient || loadingPatients}
              className="mt-3 w-full py-2 bg-[#0B6E4F] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              {isEvaluating ? "Evaluating on server…" : "Run server clinical safety check"}
            </button>
            {evaluationError && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">{evaluationError}</p>}
          </div>
        </div>

        {/* CLINICAL SAFETY RESULT CARD (Deterministic Outcome) */}
        {decision && (
          <div className={`rounded-2xl p-4 shadow-md border ${
            decision.is_urgent
              ? "bg-red-50/90 border-red-200 text-red-950"
              : decision.escalation_level === "PRIORITY"
              ? "bg-amber-50/90 border-amber-200 text-amber-950"
              : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
          }`}>
            <div className="flex items-start gap-2.5">
              {decision.is_urgent ? (
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    {decision.is_urgent ? "! URGENT — Refer Now" : decision.escalation_level === "PRIORITY" ? "Priority Review Required" : "Routine Care"}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 border border-current">
                    {decision.protocol_version}
                  </span>
                </div>

                <p className="text-xs mt-1.5 font-medium leading-relaxed">
                  {decision.clinical_explanation}
                </p>

                {decision.triggered_rules.length > 0 && (
                  <div className="mt-2 text-[11px] bg-white/80 p-2 rounded-lg border border-red-100">
                    <span className="font-semibold block text-red-800">Triggered Rules:</span>
                    <ul className="list-disc list-inside text-red-700 mt-0.5">
                      {decision.triggered_rules.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 p-2.5 bg-white rounded-xl border text-xs">
                  <span className="font-bold text-gray-800 block mb-1">Recommended Action:</span>
                  <p className="text-gray-700">{decision.recommended_action}</p>
                </div>

                {/* Primary Action Button */}
                {decision.is_urgent && (
                  <div className="mt-3 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Receiving facility
                      <select
                        value={facilityId}
                        onChange={event => setFacilityId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2"
                      >
                        <option value="">Select a facility</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name} · {facility.block}, {facility.district}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!facilityId}
                      onClick={() => selectedPatient && onReferralCreate?.(selectedPatient.id, facilityId, transcript, decision)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <span>Create Urgent Referral</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
