import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';

interface ChronicPatient {
  id: string;
  name: string;
  condition: 'HYPERTENSION' | 'DIABETES' | 'CO-MORBID';
  last_vitals: string;
  status: 'DUE' | 'OVERDUE' | 'CONTROLLED';
  due_date: string;
  village: string;
}

export const ChronicCareScreen: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'DUE' | 'CONTROLLED'>('ALL');

  const chronicPatients: ChronicPatient[] = [
    {
      id: 'PAT-001',
      name: 'Ramesh Kumar',
      condition: 'HYPERTENSION',
      last_vitals: 'BP: 154/96 mmHg',
      status: 'OVERDUE',
      due_date: 'Overdue by 3 days',
      village: 'Rampur'
    },
    {
      id: 'PAT-002',
      name: 'Savitri Singh',
      condition: 'CO-MORBID',
      last_vitals: 'BP: 142/90 | Sugar: 210 mg/dL',
      status: 'DUE',
      due_date: 'Due today',
      village: 'Madhopur'
    },
    {
      id: 'PAT-003',
      name: 'Mohan Lal',
      condition: 'DIABETES',
      last_vitals: 'Sugar: 138 mg/dL',
      status: 'CONTROLLED',
      due_date: 'Due in 14 days',
      village: 'Rampur'
    }
  ];

  const filtered = chronicPatients.filter((p) => filter === 'ALL' || p.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Chronic Care & NCD Follow-ups</h2>
        <p className="text-xs text-gray-500">Longitudinal monitoring for Hypertension and Diabetes</p>
      </div>

      <div className="flex gap-2">
        {(['ALL', 'OVERDUE', 'DUE', 'CONTROLLED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === f
                ? 'bg-[#0B6E4F] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((patient) => (
          <Card key={patient.id} variant="elevated" padding="md" className="space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{patient.name}</h3>
                <div className="text-xs text-gray-500">
                  📍 {patient.village} • <span className="font-semibold text-gray-700">{patient.condition}</span>
                </div>
              </div>
              <Badge
                variant={
                  patient.status === 'OVERDUE'
                    ? 'danger'
                    : patient.status === 'DUE'
                    ? 'warning'
                    : 'success'
                }
                size="sm"
                dot
              >
                {patient.status}
              </Badge>
            </div>

            <div className="p-2 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
              <span className="text-gray-600">Last Vitals: <strong>{patient.last_vitals}</strong></span>
              <span className="font-semibold text-xs text-gray-800">{patient.due_date}</span>
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <Button size="sm" variant="primary" className="flex-1">
                Record New Vitals
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Reschedule
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

