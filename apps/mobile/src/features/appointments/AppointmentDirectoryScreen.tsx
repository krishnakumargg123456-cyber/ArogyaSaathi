import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../design-system';

interface Doctor {
  id: string;
  name: string;
  department: string;
  facility_name: string;
  available_today: boolean;
  next_available_slot: string;
}

interface AppointmentDirectoryScreenProps {
  doctors: Doctor[];
  onBookSlot: (doctor: Doctor) => void;
}

export const AppointmentDirectoryScreen: React.FC<AppointmentDirectoryScreenProps> = ({
  doctors,
  onBookSlot
}) => {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const departments = ['ALL', 'General Medicine', 'Maternal & Child', 'Pediatrics', 'Non-Communicable (NCD)'];

  const filtered = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.facility_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">MediSlot Doctor Directory</h2>
        <p className="text-xs text-gray-500">Offline-cached OPD schedules & conflict-safe booking</p>
      </div>

      <Input
        placeholder="Search Doctor or Facility..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftIcon={<span>🩺</span>}
      />

      {/* Dept Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedDept === dept
                ? 'bg-[#0B6E4F] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Doctor Cards */}
      <div className="space-y-3">
        {filtered.map((doc) => (
          <Card key={doc.id} variant="elevated" padding="md" className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{doc.name}</h3>
                <div className="text-xs text-gray-500 mt-0.5">{doc.department}</div>
                <div className="text-xs text-gray-400 mt-0.5">📍 {doc.facility_name}</div>
              </div>
              <Badge variant={doc.available_today ? 'success' : 'neutral'} size="sm">
                {doc.available_today ? 'Slots Available' : 'Offline Cached'}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <span className="text-gray-500">
                Next slot: <strong className="text-gray-800">{doc.next_available_slot}</strong>
              </span>
              <Button size="sm" onClick={() => onBookSlot(doc)}>
                Book Slot →
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

