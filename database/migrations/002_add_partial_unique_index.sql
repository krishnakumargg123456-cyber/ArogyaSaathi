-- Migration 002: Add Partial Unique Index on Active Appointment Slots (PRD Section 14.5)
-- Prevents race conditions and double booking during concurrent requests

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_appointment_slot 
ON appointments(slot_id) 
WHERE status IN ('CONFIRMED', 'PENDING');

