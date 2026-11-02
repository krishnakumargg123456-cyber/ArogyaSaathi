import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '../../design-system';

interface Patient {
  id: string;
  internal_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone?: string;
  village_name: string;
  is_high_risk?: boolean;
}

interface PatientSearchScreenProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onNewRegistration: () => void;
}

export const PatientSearchScreen: React.FC<PatientSearchScreenProps> = ({
  patients,
  onSelectPatient,
  onNewRegistration
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('ALL');

  const villages = ['ALL', 'Rampur', 'Madhopur', 'Kalyanpur', 'Fatehpur'];

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.internal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm));
    const matchesVillage = selectedVillage === 'ALL' || p.village_name === selectedVillage;
    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Patient Registry</h2>
          <p className="text-xs text-gray-500">Offline-available village database</p>
        </div>
        <Button size="sm" onClick={onNewRegistration} leftIcon={<span>+</span>}>
          Register New
        </Button>
      </div>

      {/* Search Bar */}
      <Input
        placeholder="Search by Name, ID, or Phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftIcon={<span>🔍</span>}
      />

      {/* Village Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {villages.map((v) => (
          <button
            key={v}
            onClick={() => setSelectedVillage(v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedVillage === v
                ? 'bg-[#0B6E4F] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {v === 'ALL' ? 'All Villages' : v}
          </button>
        ))}
      </div>

      {/* Patient Count */}
      <div className="text-xs text-gray-500 font-medium">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>

      {/* Patient Cards List */}
      <div className="space-y-2.5">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            variant="elevated"
            padding="md"
            onClick={() => onSelectPatient(patient)}
            className="cursor-pointer active:scale-[0.99] hover:border-[#0B6E4F]/40 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{patient.full_name}</h3>
                  <Badge variant="neutral" size="sm">{patient.internal_id}</Badge>
                  {patient.is_high_risk && (
                    <Badge variant="danger" size="sm" dot>High Risk</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{patient.gender}, {patient.age} yrs</span>
                  <span>•</span>
                  <span>📍 {patient.village_name}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#0B6E4F]">View Profile →</span>
                {patient.phone && (
                  <div className="text-[11px] text-gray-400 mt-0.5">📞 {patient.phone}</div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredPatients.length === 0 && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-medium">No matching patients found</p>
            <p className="text-xs text-gray-400 mt-1">Try another search or register a new patient</p>
          </div>
        )}
      </div>
    </div>
  );
};

