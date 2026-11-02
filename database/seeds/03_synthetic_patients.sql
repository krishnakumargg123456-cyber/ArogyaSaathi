-- ArogyaSaathi Initial Database Seeds: Synthetic Patients (PRD Compliant)
-- Explicit synthetic rural profiles for testing and clinical validation

INSERT INTO patients (id, internal_id, full_name, age, gender, phone, village_id, address_line, landmark, abha_number, is_high_risk, created_by, created_at)
VALUES
('PAT-001', 'P-912545', 'Ramesh Kumar', 54, 'MALE', '9876543210', 'VIL-001', 'House 14, Main Gali', 'Near Panchayat Ghar', '91-8842-1029-4412', 1, 'USR-ASHA-001', CURRENT_TIMESTAMP),
('PAT-002', 'P-304192', 'Rekha Devi', 26, 'FEMALE', '9876543211', 'VIL-001', 'House 28, East Hamlet', 'Opposite Primary School', '91-4412-9981-2201', 1, 'USR-ASHA-001', CURRENT_TIMESTAMP),
('PAT-003', 'P-119284', 'Savitri Singh', 62, 'FEMALE', '9876543212', 'VIL-002', 'House 5, West Basti', 'Near Tube Well', NULL, 0, 'USR-ASHA-001', CURRENT_TIMESTAMP),
('PAT-004', 'P-554192', 'Mohan Lal', 48, 'MALE', '9876543213', 'VIL-003', 'House 81, North Gali', 'Near Shiva Mandir', NULL, 0, 'USR-ASHA-001', CURRENT_TIMESTAMP);

INSERT INTO consents (id, patient_id, consent_type, status, signature_type, captured_by, valid_from, valid_to, created_at)
VALUES
('CNS-001', 'PAT-001', 'GENERAL_CARE', 'ACTIVE', 'VERBAL_CONFIRMED', 'USR-ASHA-001', CURRENT_TIMESTAMP, DATE(CURRENT_TIMESTAMP, '+1 year'), CURRENT_TIMESTAMP),
('CNS-002', 'PAT-002', 'MATERNAL_CARE_TELE', 'ACTIVE', 'DIGITAL_THUMBPRINT', 'USR-ASHA-001', CURRENT_TIMESTAMP, DATE(CURRENT_TIMESTAMP, '+1 year'), CURRENT_TIMESTAMP);

