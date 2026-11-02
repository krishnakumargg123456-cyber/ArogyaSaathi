import React, { useEffect, useState } from "react";
import { Search, Plus, User, MapPin, AlertTriangle, ShieldCheck, Calendar, Activity, X } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface PatientItem {
  id: string;
  internal_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  village_id: string | null;
  chronic_conditions: string[];
  consent_active: boolean;
}

interface PatientApiRecord {
  id: string;
  internal_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  village_id: string | null;
  village_name: string | null;
  chronic_conditions: string | null;
  has_active_consent: boolean;
}

interface VillageOption {
  id: string;
  name: string;
  block: string;
  district: string;
}

function mapPatient(record: PatientApiRecord): PatientItem {
  return {
    id: record.id,
    internal_id: record.internal_id,
    name: record.name,
    age: record.age,
    gender: record.gender,
    phone: record.phone ?? "",
    village: record.village_name ?? "Unassigned",
    village_id: record.village_id,
    chronic_conditions: record.chronic_conditions?.split(",").map(value => value.trim()).filter(Boolean) ?? [],
    consent_active: record.has_active_consent,
  };
}

export function PatientRegistryScreen({
  onSelectPatient,
  onStartTriageForPatient,
  onBookForPatient
}: {
  onSelectPatient?: (patient: PatientItem) => void;
  onStartTriageForPatient?: (patient: PatientItem) => void;
  onBookForPatient?: (patient: PatientItem) => void;
}) {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);

  // Registration wizard state
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Female",
    phone: "",
    villageId: "",
    address: "",
    emergency_contact: "",
    chronic_conditions: "",
    consentAgreed: false
  });
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = sessionStorage.getItem("arogyasaathi_session");
    if (!savedSession) {
      setApiError("Sign in with an authorized health-worker account to view patient records.");
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(savedSession) as { access_token?: string; role?: string };
      if (!session.access_token || !["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"].includes(session.role ?? "")) {
        setApiError("An authorized health-worker account is required to view patient records.");
        setLoading(false);
        return;
      }
      setAccessToken(session.access_token);
      setApiError("");
    } catch {
      setApiError("Your saved sign-in session is invalid. Sign in again to continue.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    apiRequest<VillageOption[]>("/patients/villages", {}, accessToken)
      .then(records => {
        if (active) setVillages(records);
      })
      .catch(error => {
        if (active) setApiError(error instanceof Error ? error.message : "Could not load the assigned village directory.");
      });
    return () => { active = false; };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setApiError("");
      const params = new URLSearchParams({ limit: "100" });
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      if (selectedVillage !== "ALL") params.set("village_id", selectedVillage);
      try {
        const records = await apiRequest<PatientApiRecord[]>(`/patients?${params.toString()}`, {}, accessToken);
        if (active) setPatients(records.map(mapPatient));
      } catch (error) {
        if (active) setApiError(error instanceof Error ? error.message : "Could not load patient records.");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accessToken, searchQuery, selectedVillage]);

  const filtered = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesVillage = selectedVillage === "ALL" || p.village_id === selectedVillage;
    return matchesSearch && matchesVillage;
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.age) {
        alert("Please enter patient name and age.");
        return;
      }
      setDuplicateWarning(null);
    }
    if (step === 2 && !formData.villageId) {
      alert("Choose a village assigned to your health-worker account.");
      return;
    }
    setStep(s => s + 1);
  };

  const handleFinishRegistration = async () => {
    if (!formData.consentAgreed) {
      alert("Consent acknowledgment is mandatory under the DPDP Act & PRD guidelines.");
      return;
    }
    if (!accessToken) {
      setApiError("Sign in before saving a patient record.");
      return;
    }
    setSaving(true);
    setApiError("");
    try {
      const response = await apiRequest<{
        patient: { id: string; internal_id: string };
        potential_duplicates: Array<{ name: string; internal_id: string; match_reason: string }>;
      }>("/patients", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim() || null,
          village_id: formData.villageId || null,
          address: formData.address.trim() || null,
          emergency_contact: formData.emergency_contact.trim() || null,
          chronic_conditions: formData.chronic_conditions || null,
          consent_purpose: "GENERAL_HEALTHCARE_COORDINATION",
          consent_method: "TICK_ACK",
        }),
      }, accessToken);
      if (response.potential_duplicates.length > 0) {
        setDuplicateWarning(`Saved with a duplicate-review warning: ${response.potential_duplicates.map(match => `${match.name} (${match.internal_id}: ${match.match_reason})`).join("; ")}`);
      }
      const createdRecords = await apiRequest<PatientApiRecord[]>(`/patients?query=${encodeURIComponent(response.patient.internal_id)}&limit=1`, {}, accessToken);
      const createdPatient = createdRecords.find(record => record.id === response.patient.id);
      if (!createdPatient) throw new Error("Patient was saved, but could not be loaded from the patient registry.");
      const mappedPatient = mapPatient(createdPatient);
      setPatients(current => [mappedPatient, ...current.filter(patient => patient.id !== mappedPatient.id)]);
      setIsRegistering(false);
      setStep(1);
      setFormData({
        name: "",
        age: "",
        gender: "Female",
        phone: "",
        villageId: "",
        address: "",
        emergency_contact: "",
        chronic_conditions: "",
        consentAgreed: false,
      });
      setSelectedPatient(mappedPatient);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not save this patient record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7FAF9] overflow-y-auto pb-20">
      {/* Header bar */}
      <div className="bg-[#0B6E4F] text-white p-4 rounded-b-2xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">Patient Registry</h2>
            <p className="text-xs text-emerald-100">Live patient registry • server records</p>
          </div>
          <button
            onClick={() => setIsRegistering(true)}
            disabled={!accessToken || Boolean(apiError) || loading}
            className="flex items-center gap-1 bg-white text-[#0B6E4F] px-3 py-1.5 rounded-full text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Patient</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, internal ID (AS-...), phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-gray-800 bg-white rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {apiError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {apiError}
            {!accessToken && <Link href="/login" className="ml-1 font-bold underline">Sign in</Link>}
          </div>
        )}
        {loading && <p className="rounded-xl bg-white p-4 text-center text-xs text-gray-500">Loading patient records from the server…</p>}
        {duplicateWarning && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            {duplicateWarning}
          </div>
        )}
        {/* Village filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {["ALL", ...villages.map(village => village.id)].map(villageId => {
            const village = villages.find(item => item.id === villageId);
            return (
              <button
                key={villageId}
                onClick={() => setSelectedVillage(villageId)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                  selectedVillage === villageId
                    ? "bg-[#0B6E4F] text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {village?.name ?? "All Villages"}
              </button>
            );
          })}
        </div>

        {/* Patient Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>Showing {filtered.length} patients</span>
          <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Live API</span>
        </div>

        {/* Patient Cards List */}
        <div className="space-y-2.5">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 hover:border-emerald-200 cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B6E4F] font-bold flex items-center justify-center text-sm border border-emerald-200">
                    {p.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      {p.name}
                      <span className="text-xs font-normal text-gray-500">
                        ({p.age} {p.gender[0]})
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50/80 px-1.5 rounded">
                        {p.internal_id}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {p.village}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  p.consent_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  {p.consent_active ? "Consent active" : "No active consent"}
                </span>
              </div>

              {p.chronic_conditions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {p.chronic_conditions.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {!loading && accessToken && !apiError && filtered.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 p-4">
              <User className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">No matching patient records found.</p>
              <button
                onClick={() => setIsRegistering(true)}
                className="mt-3 text-xs font-bold text-[#0B6E4F] hover:underline"
              >
                + Register New Patient
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4-STEP REGISTRATION WIZARD MODAL */}
      {isRegistering && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-surface-light rounded-t-3xl">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Register New Patient</h3>
                <p className="text-[11px] text-gray-500">Step {step} of 4</p>
              </div>
              <button
                onClick={() => setIsRegistering(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1">
              <div
                className="bg-[#0B6E4F] h-1 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            {/* Wizard Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Duplicate Warning</span>
                    <span>{duplicateWarning}</span>
                  </div>
                </div>
              )}

              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">1. Personal Information</h4>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramvati Devi"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#0B6E4F]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Age (Years) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 42"
                        value={formData.age}
                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Gender *</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="10 digit mobile"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Address & Village */}
              {step === 2 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">2. Village & Address</h4>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Assigned Village</label>
                    <select
                      value={formData.villageId}
                      onChange={e => setFormData({ ...formData, villageId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                    >
                      <option value="">Select an assigned village</option>
                      {villages.map(village => (
                        <option key={village.id} value={village.id}>
                          {village.name} · {village.block}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">House / Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. House 14, Near Temple"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Emergency Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh (Husband) - 9876543210"
                      value={formData.emergency_contact}
                      onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Medical Information */}
              {step === 3 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">3. Medical Information</h4>
                  <p className="text-gray-500">Select any known chronic health conditions:</p>
                  <div className="space-y-2">
                    {["Hypertension", "Diabetes", "Antenatal Care (ANC)", "Tuberculosis", "Anaemia"].map(c => (
                      <label key={c} className="flex items-center gap-2 p-2 bg-surface-light rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.chronic_conditions.includes(c)}
                          onChange={e => {
                            const cur = formData.chronic_conditions ? formData.chronic_conditions.split(",").filter(Boolean) : [];
                            if (e.target.checked) cur.push(c);
                            else {
                              const idx = cur.indexOf(c);
                              if (idx !== -1) cur.splice(idx, 1);
                            }
                            setFormData({ ...formData, chronic_conditions: cur.join(",") });
                          }}
                          className="rounded text-[#0B6E4F]"
                        />
                        <span className="font-medium text-gray-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Consent Capture */}
              {step === 4 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">4. Informed Consent (सहमति)</h4>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
                    <p className="font-bold mb-1">डिजिटल स्वास्थ्य रिकॉर्ड सहमति (v2.1):</p>
                    <p>
                      मरीज़ ने अपनी स्वास्थ्य जाँच, रक्तचाप/शुगर रिकॉर्ड और आवश्यकता पड़ने पर प्राथमिक स्वास्थ्य केंद्र (PHC) में रेफ़रल और अपॉइंटमेंट के लिए सहमति दी है।
                    </p>
                  </div>

                  <label className="flex items-start gap-2 p-3 bg-surface-light border border-gray-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consentAgreed}
                      onChange={e => setFormData({ ...formData, consentAgreed: e.target.checked })}
                      className="mt-0.5 rounded text-[#0B6E4F]"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      मरीज़ ने सहमति पत्र की शर्तें समझीं और सहमति दी (Patient confirmed informed consent).
                    </span>
                  </label>
                </div>
              )}
              {apiError && <p role="alert" className="rounded-lg bg-red-50 p-2 text-red-800">{apiError}</p>}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-surface-light rounded-b-3xl">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-[#0B6E4F] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleFinishRegistration}
                  disabled={!formData.consentAgreed || saving || !accessToken}
                  className="px-5 py-2.5 bg-[#0B6E4F] disabled:bg-gray-300 hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold"
                >
                  {saving ? "Saving to server…" : "Save Patient Record"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PATIENT DETAIL PROFILE DRAWER */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#0B6E4F] text-white rounded-t-3xl">
              <div>
                <h3 className="font-bold text-base">{selectedPatient.name}</h3>
                <p className="text-xs text-emerald-200">
                  {selectedPatient.internal_id} • {selectedPatient.age} yrs, {selectedPatient.gender} • {selectedPatient.village}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const p = selectedPatient;
                    setSelectedPatient(null);
                    onStartTriageForPatient?.(p);
                  }}
                  className="p-3 bg-emerald-50 text-[#0B6E4F] rounded-xl font-bold border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Activity className="w-4 h-4" />
                  <span>Start Voice Triage</span>
                </button>
                <button
                  onClick={() => {
                    const p = selectedPatient;
                    setSelectedPatient(null);
                    onBookForPatient?.(p);
                  }}
                  className="p-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>

              <div className="bg-surface-light p-3 rounded-2xl border border-gray-200 text-gray-600">
                Vitals history is not available in the patient profile API yet.
              </div>

              {/* Consent info */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Consent Status: {selectedPatient.consent_active ? "Active" : "Not active"}
                  </span>
                  <span className="text-[10px] text-emerald-700">Current consent state from patient registry</span>
                </div>
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
