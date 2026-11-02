import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button } from '../../design-system';
import { MobileApiError, mobileApiFetch } from '../../core/api/client';

interface DoctorSlot {
  id: string;
  doctor_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface SlotBookingModalProps {
  doctor: {
    id: string;
    name: string;
    facility_id: string;
    facility_name: string;
  };
  patient?: { id: string; full_name?: string; name?: string; internal_id?: string } | null;
  patients: { id: string; full_name?: string; name?: string; internal_id?: string }[];
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

function localDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  doctor,
  patient,
  patients,
  onClose,
  onSuccess
}) => {
  const [selectedDate, setSelectedDate] = useState(localDateOffset(0));
  const [selectedPatientId, setSelectedPatientId] = useState(patient?.id ?? '');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patient ?? patients.find((item) => item.id === selectedPatientId) ?? null,
    [patient, patients, selectedPatientId]
  );
  const availableSlots = slots.filter((slot) => slot.status === 'AVAILABLE');

  useEffect(() => {
    let active = true;
    setIsLoadingSlots(true);
    setSelectedSlotId(null);
    setError(null);
    mobileApiFetch<DoctorSlot[]>(
      `/doctors/${encodeURIComponent(doctor.id)}/slots?slot_date=${encodeURIComponent(selectedDate)}`
    )
      .then((records) => {
        if (active) setSlots(records);
      })
      .catch((requestError) => {
        if (active) {
          setSlots([]);
          setError(requestError instanceof Error ? requestError.message : 'Could not load appointment slots.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [doctor.id, selectedDate]);

  const handleConfirmBooking = async () => {
    const slot = availableSlots.find((item) => item.id === selectedSlotId);
    if (!selectedPatient?.id || !slot) {
      setError(!selectedPatient?.id ? 'Choose a patient before booking.' : 'Choose an available appointment slot.');
      return;
    }

    setIsBooking(true);
    setError(null);
    try {
      const booking = await mobileApiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          client_uuid: crypto.randomUUID(),
          patient_id: selectedPatient.id,
          doctor_id: doctor.id,
          facility_id: doctor.facility_id,
          slot_id: slot.id,
          reason_code: 'General OPD'
        })
      });
      onSuccess(booking);
    } catch (requestError) {
      if (requestError instanceof MobileApiError && requestError.status === 409) {
        setError(`${requestError.message} The slot list is being refreshed.`);
        try {
          const updatedSlots = await mobileApiFetch<DoctorSlot[]>(
            `/doctors/${encodeURIComponent(doctor.id)}/slots?slot_date=${encodeURIComponent(selectedDate)}`
          );
          setSlots(updatedSlots);
          setSelectedSlotId(null);
        } catch (refreshError) {
          setError(refreshError instanceof Error
            ? `${requestError.message} Could not refresh available slots: ${refreshError.message}`
            : requestError.message);
        }
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Appointment booking failed.');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const dateOptions = [
    { label: 'Today', value: localDateOffset(0) },
    { label: 'Tomorrow', value: localDateOffset(1) },
    { label: 'Next Day', value: localDateOffset(2) }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full space-y-4 bg-white">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Book Appointment</h3>
            <p className="text-xs text-gray-500">{doctor.name} · {doctor.facility_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>

        {patient ? (
          <div className="p-2.5 bg-[#E6F4EF] rounded-xl text-xs text-[#064E3B] flex justify-between items-center">
            <span>Booking for: <strong>{patient.full_name ?? patient.name}</strong></span>
            <span className="font-mono">{patient.internal_id}</span>
          </div>
        ) : (
          <label className="block text-xs font-bold text-gray-700">
            Select patient
            <select
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm"
            >
              <option value="">Choose a registered patient</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name ?? item.name} · {item.internal_id}</option>
              ))}
            </select>
          </label>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Date</label>
          <div className="grid grid-cols-3 gap-2">
            {dateOptions.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedDate(value)}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  selectedDate === value
                    ? 'bg-[#0B6E4F] text-white border-[#0B6E4F]'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingSlots ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading live slots…</p>
        ) : availableSlots.length ? (
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available Slots</span>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    selectedSlotId === slot.id
                      ? 'bg-[#0B6E4F] text-white border-[#0B6E4F]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {displayTime(slot.start_time)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">No live appointment slots are available for this date.</p>
        )}

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="primary"
            onClick={handleConfirmBooking}
            isLoading={isBooking}
            disabled={!selectedSlotId || !selectedPatient?.id || isLoadingSlots}
            className="flex-1"
          >
            Confirm Slot
          </Button>
        </div>
      </Card>
    </div>
  );
};
