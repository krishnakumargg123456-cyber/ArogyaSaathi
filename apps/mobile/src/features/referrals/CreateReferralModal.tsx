import React, { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface CreateReferralModalProps {
  patient: any;
  patients: any[];
  defaultReason?: string;
  defaultUrgency?: 'URGENT' | 'ROUTINE';
  onClose: () => void;
  onSubmit: (referralData: any) => void;
}

export const CreateReferralModal: React.FC<CreateReferralModalProps> = ({
  patient,
  patients,
  defaultReason = '',
  defaultUrgency = 'ROUTINE',
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState(defaultReason);
  const [urgency, setUrgency] = useState<'URGENT' | 'ROUTINE'>(defaultUrgency);
  const [facilityId, setFacilityId] = useState('');
  const [patientId, setPatientId] = useState(patient?.id ?? '');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilities, setFacilities] = useState<{ id: string; name: string; district: string; block: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedPatient = patient ?? patients.find((item) => item.id === patientId) ?? null;

  useEffect(() => {
    let active = true;
    mobileApiFetch<{ id: string; name: string; district: string; block: string }[]>('/facilities')
      .then((records) => {
        if (!active) return;
        setFacilities(records);
        setFacilityId(records[0]?.id ?? '');
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load facilities.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !selectedPatient?.id || !facilityId) {
      setError(!selectedPatient?.id
        ? 'Select a patient before creating a referral.'
        : !facilityId
          ? 'Choose a receiving facility.'
          : 'Please specify a referral reason.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await mobileApiFetch<any>('/referrals', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          receiving_facility_id: facilityId,
          reason: reason.trim(),
          urgency,
          history_packet: clinicalNotes.trim() ? { field_observations: clinicalNotes.trim() } : null
        })
      });
      onSubmit(created);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Referral creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full space-y-4 bg-white">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">New Patient Referral</h3>
            <p className="text-xs text-gray-500">Patient: {selectedPatient?.full_name || selectedPatient?.name || 'Select a patient'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!patient && (
            <label className="block text-xs font-bold text-gray-700">
              Select patient
              <select
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm"
              >
                <option value="">Choose a registered patient</option>
                {patients.map((item) => (
                  <option key={item.id} value={item.id}>{item.full_name ?? item.name} · {item.internal_id}</option>
                ))}
              </select>
            </label>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Urgency Level *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('URGENT')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  urgency === 'URGENT'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                🚨 Urgent Escalation
              </button>
              <button
                type="button"
                onClick={() => setUrgency('ROUTINE')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  urgency === 'ROUTINE'
                    ? 'bg-[#E6F4EF] border-[#0B6E4F] text-[#064E3B] shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                📋 Routine Referral
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Receiving Health Facility *
            </label>
            <select
              className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
            >
              <option value="">Select a facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} ({facility.block}, {facility.district})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Clinical Reason / Trigger *"
            placeholder="e.g. Chest pain with sweating / Severe Hypertension"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Field Observations & Notes
            </label>
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:border-[#0B6E4F] focus:outline-none"
              placeholder="Add symptoms duration, current vitals, transport advised..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            {error && <p role="alert" className="absolute left-4 right-4 bottom-20 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={urgency === 'URGENT' ? 'danger' : 'primary'}
              isLoading={isSubmitting}
              disabled={!facilities.length || !selectedPatient?.id}
              className="flex-1"
            >
              Submit Referral
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
