/**
 * MediSlot Appointment Concurrency & Directory Types
 */

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface DoctorSlotInfo {
  id: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  facility_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
}

export interface BookingResponse {
  appointment_id: string;
  booking_ref: string;
  status: AppointmentStatus;
  slot_time: string;
  doctor_name: string;
}

export interface ConflictResponse {
  detail: string;
  conflicting_slot_id: string;
  alternative_slots: string[];
}

