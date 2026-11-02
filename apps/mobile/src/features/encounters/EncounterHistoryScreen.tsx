import React from 'react';
import { Card, Badge } from '../../design-system';

export const EncounterHistoryScreen: React.FC = () => {
  const encounters = [
    {
      id: 'ENC-001',
      date: '14 Oct 2026, 10:15 AM',
      patient_name: 'Rekha Devi',
      encounter_type: 'ANC_CHECKUP',
      recorded_by: 'ANM Priya Sharma',
      vitals: 'BP: 120/80 | Weight: 58kg | Fundal Ht: 30cm',
      notes: 'Routine 3rd trimester visit. Fetal heart rate regular.'
    },
    {
      id: 'ENC-002',
      date: '12 Oct 2026, 09:45 AM',
      patient_name: 'Ramesh Kumar',
      encounter_type: 'NCD_FOLLOWUP',
      recorded_by: 'ASHA Sunita Devi',
      vitals: 'BP: 154/96 | Sugar: 182 mg/dL',
      notes: 'Complaining of mild dizziness. Medication adherence counseling provided.'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Encounter & Vitals History</h2>
        <p className="text-xs text-gray-500">Chronological clinical log of all field and facility visits</p>
      </div>

      <div className="space-y-3">
        {encounters.map((enc) => (
          <Card key={enc.id} variant="elevated" padding="md" className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{enc.patient_name}</span>
              <Badge variant="neutral" size="sm">{enc.encounter_type}</Badge>
            </div>
            <div className="text-xs text-gray-500">
              Recorded by: <strong>{enc.recorded_by}</strong> • {enc.date}
            </div>
            <div className="p-2 bg-gray-50 rounded-xl text-xs space-y-1">
              <div><strong className="text-gray-700">Observations: </strong>{enc.vitals}</div>
              <div><strong className="text-gray-700">Clinical Note: </strong>{enc.notes}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

