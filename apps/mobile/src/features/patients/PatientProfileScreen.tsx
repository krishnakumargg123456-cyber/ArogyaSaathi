import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface PatientProfile {
  overview: {
    name: string;
    internal_id: string;
    age: number;
    gender: string;
    phone: string | null;
    village: string | null;
    chronic_conditions: string[];
  };
  visits: { id: string; encounter_date: string; source: string; status: string }[];
  vitals: {
    id: string;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    blood_glucose: number | null;
    temperature: number | null;
    spo2: number | null;
    recorded_at: string;
  }[];
  referrals: { id: string; referral_code: string; urgency: string; status: string; facility: string | null; created_at: string }[];
  appointments: { id: string; booking_ref: string; doctor_name: string; slot_date: string | null; slot_time: string | null; status: string }[];
  tasks: { id: string; task_type: string; due_date: string; status: string; priority: string }[];
  consents: { id: string; purpose: string; scope: string; status: string; granted_at: string }[];
}

interface PatientProfileScreenProps {
  patient: any;
  onBack: () => void;
  onStartTriage: (patient: any) => void;
  onBookAppointment: (patient: any) => void;
  onCreateReferral: (patient: any) => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  patient,
  onBack,
  onStartTriage,
  onBookAppointment,
  onCreateReferral
}) => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    mobileApiFetch<PatientProfile>(`/patients/${encodeURIComponent(patient.id)}`)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load patient profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [patient.id]);

  const overview = profile?.overview;
  const latestVitals = profile?.vitals[0];
  const activeConsent = profile?.consents.some((consent) => consent.status === 'ACTIVE') ?? false;
  const displayName = overview?.name ?? patient.full_name ?? patient.name;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-semibold text-[#0B6E4F] flex items-center gap-1 hover:underline">
          ← Back to Registry
        </button>
        <Badge variant={activeConsent ? 'success' : 'warning'} size="sm">
          {loading ? 'Loading…' : activeConsent ? 'Consent active' : 'Consent unavailable'}
        </Badge>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

      <Card variant="elevated" padding="lg" className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{overview?.internal_id ?? patient.internal_id}</span>
              <span className="text-xs text-gray-500">{overview?.gender ?? patient.gender}, {overview?.age ?? patient.age} yrs</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E6F4EF] text-[#064E3B] font-bold text-lg flex items-center justify-center">
            {displayName?.charAt(0) ?? 'P'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
          <div>📍 Village: <strong className="text-gray-800">{overview?.village ?? patient.village_name ?? '—'}</strong></div>
          <div>📞 Mobile: <strong className="text-gray-800">{overview?.phone ?? patient.phone ?? 'Not linked'}</strong></div>
          <div className="col-span-2">Health conditions: <strong className="text-gray-800">{overview?.chronic_conditions.join(', ') || 'Not recorded'}</strong></div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="primary" size="sm" onClick={() => onStartTriage({ ...patient, ...overview, full_name: displayName })} className="flex flex-col h-auto py-2.5 gap-1 text-[11px]">
          <span className="text-base">⚕️</span><span>Clinical Review</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onBookAppointment(patient)} className="flex flex-col h-auto py-2.5 gap-1 text-[11px]">
          <span className="text-base">📅</span><span>Book Slot</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onCreateReferral(patient)} className="flex flex-col h-auto py-2.5 gap-1 text-[11px]">
          <span className="text-base">↗️</span><span>Referral</span>
        </Button>
      </div>

      <Card variant="elevated" padding="md" className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Latest Recorded Vitals</h3>
        {latestVitals ? (
          <>
            <div className="text-[11px] text-gray-500">{formatDate(latestVitals.recorded_at)}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Blood pressure: <strong>{latestVitals.systolic_bp ?? '—'}/{latestVitals.diastolic_bp ?? '—'}</strong></div>
              <div>Glucose: <strong>{latestVitals.blood_glucose ?? '—'} mg/dL</strong></div>
              <div>Temperature: <strong>{latestVitals.temperature ?? '—'} °C</strong></div>
              <div>SpO₂: <strong>{latestVitals.spo2 ?? '—'}%</strong></div>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">{loading ? 'Loading observations…' : 'No vitals recorded.'}</p>
        )}
      </Card>

      <Card variant="elevated" padding="md" className="space-y-2">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Recent Encounters</h3>
        {profile?.visits.length ? profile.visits.map((visit) => (
          <div key={visit.id} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-xs">
            <div className="font-semibold text-gray-800">{visit.source.replace(/_/g, ' ')} · {visit.status}</div>
            <div className="mt-1 text-gray-500">{formatDate(visit.encounter_date)}</div>
          </div>
        )) : (
          <p className="text-xs text-gray-500">{loading ? 'Loading encounter history…' : 'No encounters recorded.'}</p>
        )}
      </Card>

      {profile?.appointments.length ? (
        <Card variant="elevated" padding="md" className="space-y-2">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Appointments</h3>
          {profile.appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-xl border border-gray-100 p-2.5 text-xs">
              <div className="font-semibold">{appointment.doctor_name} · {appointment.status}</div>
              <div className="mt-1 text-gray-500">{appointment.slot_date ?? '—'} · {appointment.slot_time ?? '—'} · {appointment.booking_ref}</div>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  );
};
