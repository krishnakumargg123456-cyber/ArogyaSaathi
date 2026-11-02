"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CheckCircle, RefreshCw, User } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface FacilityOption {
  id: string;
  name: string;
  district: string;
  block: string;
}

interface DoctorOption {
  id: string;
  facility_id: string;
  full_name: string;
  department_name: string;
  facility_name: string;
  specialization: string;
  qualification: string;
  opd_days: string;
  opd_timings: string;
  is_active: boolean;
}

interface SlotItem {
  id: string;
  doctor_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

interface PatientOption {
  id: string;
  internal_id: string;
  name: string;
  age: number;
  gender: string;
  has_active_consent: boolean;
}

interface BookingResult {
  booking_ref: string;
  status: string;
  slot_date: string | null;
  slot_time: string | null;
  doctor_name: string | null;
  facility_name: string | null;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "The server could not complete this request.";
  const data = (error as Error & { data?: { detail?: unknown } }).data;
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return error.message;
}

export function AppointmentBookingScreen({
  initialPatientName,
  initialPatientId = "",
  onBookingSuccess,
}: {
  initialPatientName?: string;
  initialPatientId?: string;
  onBookingSuccess?: (bookingRef: string) => void;
}) {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [facilityId, setFacilityId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState(initialPatientId);
  const [slotDate, setSlotDate] = useState(localDateString(new Date()));
  const [slotId, setSlotId] = useState("");
  const [reasonCode, setReasonCode] = useState("General OPD");
  const [token, setToken] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as {
        access_token?: string;
        role?: string;
      } | null;
      if (!session?.access_token || !session.role) {
        setError("Sign in with an authorized health-worker account to book an appointment.");
      } else {
        setToken(session.access_token);
      }
    } catch {
      setError("Your saved session is invalid. Sign in again to continue.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<FacilityOption[]>("/facilities"),
      apiRequest<DoctorOption[]>("/doctors"),
    ])
      .then(([facilityRecords, doctorRecords]) => {
        if (!active) return;
        setFacilities(facilityRecords);
        setDoctors(doctorRecords.filter((doctor) => doctor.is_active));
        if (!facilityId) {
          const firstDoctor = doctorRecords.find((doctor) => doctor.is_active);
          setFacilityId(firstDoctor?.facility_id ?? facilityRecords[0]?.id ?? "");
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setDirectoryLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<PatientOption[]>("/patients?limit=100", {}, token)
      .then((records) => {
        if (!active) return;
        const consented = records.filter((patient) => patient.has_active_consent);
        setPatients(consented);
        if (!consented.some((patient) => patient.id === initialPatientId)) {
          setPatientId((current) => consented.some((patient) => patient.id === current) ? current : consented[0]?.id ?? "");
        } else {
          setPatientId(initialPatientId);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      });
    return () => { active = false; };
  }, [token, initialPatientId]);

  const facilityDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.facility_id === facilityId),
    [doctors, facilityId],
  );
  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const selectedDoctor = facilityDoctors.find((doctor) => doctor.id === doctorId);
  const selectedSlot = slots.find((slot) => slot.id === slotId);

  useEffect(() => {
    if (!facilityDoctors.some((doctor) => doctor.id === doctorId)) {
      setDoctorId(facilityDoctors[0]?.id ?? "");
    }
  }, [facilityDoctors, doctorId]);

  useEffect(() => {
    if (!doctorId || !slotDate) {
      setSlots([]);
      setSlotId("");
      return;
    }
    let active = true;
    setSlotsLoading(true);
    setError("");
    setSlotId("");
    apiRequest<SlotItem[]>(`/doctors/${doctorId}/slots?slot_date=${encodeURIComponent(slotDate)}`)
      .then((records) => {
        if (active) setSlots(records);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => { active = false; };
  }, [doctorId, slotDate]);

  async function confirmBooking() {
    if (!token) {
      setError("Sign in before booking an appointment.");
      return;
    }
    if (!patientId || !selectedPatient) {
      setError("Select an eligible patient before booking.");
      return;
    }
    if (!selectedDoctor || !selectedSlot || selectedSlot.status !== "AVAILABLE") {
      setError("Choose an available appointment slot.");
      return;
    }
    setBooking(true);
    setError("");
    try {
      const result = await apiRequest<BookingResult>("/appointments", {
        method: "POST",
        body: JSON.stringify({
          client_uuid: crypto.randomUUID(),
          patient_id: patientId,
          doctor_id: selectedDoctor.id,
          facility_id: facilityId,
          slot_id: selectedSlot.id,
          reason_code: reasonCode,
        }),
      }, token);
      setBookingResult(result);
      onBookingSuccess?.(result.booking_ref);
      const refreshedSlots = await apiRequest<SlotItem[]>(
        `/doctors/${doctorId}/slots?slot_date=${encodeURIComponent(slotDate)}`,
      );
      setSlots(refreshedSlots);
      setSlotId("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      if ((requestError as Error & { status?: number }).status === 409) {
        const refreshedSlots = await apiRequest<SlotItem[]>(
          `/doctors/${doctorId}/slots?slot_date=${encodeURIComponent(slotDate)}`,
        ).catch(() => null);
        if (refreshedSlots) {
          setSlots(refreshedSlots);
          setSlotId("");
        }
      }
    } finally {
      setBooking(false);
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  const maxDate = localDateString(tomorrow);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F7FAF9] pb-20">
      <header className="rounded-b-2xl bg-[#0B6E4F] p-4 text-white shadow-md">
        <h2 className="text-lg font-bold">Book OPD Appointment</h2>
        <p className="text-xs text-emerald-100">Live facility, doctor, slot availability and booking</p>
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-800/80 p-2 text-xs">
          <User className="h-4 w-4 text-emerald-300" />
          <span className="font-semibold">{selectedPatient ? `${selectedPatient.name} (${selectedPatient.age} ${selectedPatient.gender[0]})` : initialPatientName ?? "Select patient"}</span>
          {selectedPatient && <span className="ml-auto font-mono text-[10px] text-emerald-200">{selectedPatient.internal_id}</span>}
        </div>
      </header>

      <div className="space-y-4 p-4">
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertTriangle className="mr-1 inline h-4 w-4" />{error}
            {!token && <Link href="/worker-login" className="ml-1 font-bold underline">Sign in</Link>}
          </p>
        )}
        {directoryLoading && <p className="text-xs text-slate-500">Loading live facility directory…</p>}
        {token && patients.length === 0 && !directoryLoading && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            No consented patients are available. Register or select a patient in the patient registry first.
          </p>
        )}
        <label className="block text-xs font-bold text-slate-800">
          Patient
          <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3" disabled={!token}>
            <option value="">Select a patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.internal_id}</option>)}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-800">
            Facility
            <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3">
              <option value="">Choose facility</option>
              {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name} · {facility.block}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-800">
            Doctor
            <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3" disabled={!facilityDoctors.length}>
              <option value="">Choose doctor</option>
              {facilityDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} · {doctor.specialization}</option>)}
            </select>
          </label>
        </div>
        {selectedDoctor && (
          <p className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600">
            {selectedDoctor.qualification} · {selectedDoctor.department_name} · {selectedDoctor.opd_days} · {selectedDoctor.opd_timings}
          </p>
        )}

        <label className="block text-xs font-bold text-slate-800">
          Consultation date
          <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
            <Calendar className="h-4 w-4 text-emerald-800" />
            <input type="date" min={localDateString(new Date())} max={maxDate} value={slotDate} onChange={(event) => setSlotDate(event.target.value)} className="min-h-10 flex-1 bg-transparent text-sm" />
          </span>
        </label>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Available slots</h3>
            {slotsLoading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-800" />}
          </div>
          {!slotsLoading && slots.length === 0 && (
            <p className="text-xs text-slate-500">No slots returned by the server for this doctor and date.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.id}
                disabled={slot.status !== "AVAILABLE"}
                onClick={() => setSlotId(slot.id)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                  slot.id === slotId ? "border-emerald-800 bg-emerald-800 text-white" :
                  slot.status === "AVAILABLE" ? "border-slate-200 bg-slate-50 text-slate-800" :
                  "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
                }`}
              >
                {slot.start_time}
                {slot.status !== "AVAILABLE" && <span className="block text-[9px]">{slot.status}</span>}
              </button>
            ))}
          </div>
        </section>

        <label className="block text-xs font-bold text-slate-800">
          Visit reason
          <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3">
            <option>General OPD</option>
            <option>Follow-up Visit</option>
            <option>Urgent Referral Visit</option>
            <option>Antenatal Checkup</option>
            <option>Hypertension / Diabetes Monitoring</option>
          </select>
        </label>

        {bookingResult && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
            <p className="flex items-center gap-2 font-bold"><CheckCircle className="h-5 w-5" /> Appointment confirmed · {bookingResult.booking_ref}</p>
            <p className="mt-1">{bookingResult.doctor_name} · {bookingResult.slot_date} · {bookingResult.slot_time} · {bookingResult.facility_name}</p>
          </div>
        )}

        <button type="button" disabled={booking || !selectedSlot || !token || !patientId} onClick={() => void confirmBooking()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
          {booking && <RefreshCw className="h-4 w-4 animate-spin" />}
          {booking ? "Confirming with server…" : `Confirm server booking${selectedSlot ? ` · ${selectedSlot.start_time}` : ""}`}
        </button>
      </div>
    </div>
  );
}
