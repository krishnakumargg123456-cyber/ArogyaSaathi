-- ArogyaSaathi Initial Database Seeds: Doctor Profiles & MediSlot OPD Slots

INSERT INTO departments (id, facility_id, name, code, created_at)
VALUES
('DEP-001', 'FAC-PHC-001', 'General Medicine', 'GEN-MED', CURRENT_TIMESTAMP),
('DEP-002', 'FAC-PHC-001', 'Maternal & Child Health', 'MCH', CURRENT_TIMESTAMP),
('DEP-003', 'FAC-CHC-001', 'Pediatrics', 'PED', CURRENT_TIMESTAMP);

INSERT INTO doctor_profiles (id, user_id, department_id, facility_id, qualification, consultation_fee, is_available_opd, created_at)
VALUES
('DOCPROF-001', 'USR-DOC-001', 'DEP-001', 'FAC-PHC-001', 'MBBS, MD (Internal Medicine)', 0, 1, CURRENT_TIMESTAMP);

INSERT INTO doctor_slots (id, doctor_id, slot_date, start_time, end_time, capacity, booked_count, is_active, created_at)
VALUES
('SLOT-001', 'DOCPROF-001', DATE('now'), '09:00:00', '09:30:00', 1, 1, 1, CURRENT_TIMESTAMP),
('SLOT-002', 'DOCPROF-001', DATE('now'), '09:30:00', '10:00:00', 1, 0, 1, CURRENT_TIMESTAMP),
('SLOT-003', 'DOCPROF-001', DATE('now'), '10:00:00', '10:30:00', 1, 0, 1, CURRENT_TIMESTAMP),
('SLOT-004', 'DOCPROF-001', DATE('now'), '10:30:00', '11:00:00', 1, 0, 1, CURRENT_TIMESTAMP),
('SLOT-005', 'DOCPROF-001', DATE('now'), '11:00:00', '11:30:00', 1, 0, 1, CURRENT_TIMESTAMP);

