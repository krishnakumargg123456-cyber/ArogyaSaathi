import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface ConsentPatient {
  id: string;
  internal_id: string;
  name: string;
  has_active_consent: boolean;
}

export const ConsentManagerScreen: React.FC = () => {
  const [patients, setPatients] = useState<ConsentPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mobileApiFetch<ConsentPatient[]>('/patients?limit=100')
      .then((records) => {
        if (active) setPatients(records);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load patient consent status.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const revokeConsent = async (patient: ConsentPatient) => {
    if (!window.confirm(`Withdraw active consent for ${patient.name}? This action is recorded by the backend.`)) return;
    setRevokingId(patient.id);
    setError(null);
    try {
      await mobileApiFetch(`/patients/${encodeURIComponent(patient.id)}/consent/revoke`, { method: 'POST' });
      setPatients((records) => records.map((record) => (
        record.id === patient.id ? { ...record, has_active_consent: false } : record
      )));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not withdraw patient consent.');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Patient Consent Management</h2>
        <p className="text-xs text-gray-500">Consent status from the patient registry; withdrawal is audited by the backend</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {loading && <p className="py-6 text-center text-sm text-gray-500">Loading consent status…</p>}
      {!loading && !error && patients.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No patients found in your assigned scope.</p>
      )}

      <div className="space-y-3">
        {patients.map((patient) => (
          <Card key={patient.id} variant="elevated" padding="md" className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{patient.name}</h3>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{patient.internal_id}</div>
              </div>
              <Badge variant={patient.has_active_consent ? 'success' : 'warning'} size="sm">
                {patient.has_active_consent ? 'ACTIVE' : 'NO ACTIVE CONSENT'}
              </Badge>
            </div>
            {patient.has_active_consent && (
              <div className="pt-1 flex justify-end">
                <Button size="sm" variant="outline" isLoading={revokingId === patient.id} onClick={() => void revokeConsent(patient)}>
                  Withdraw Consent
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
