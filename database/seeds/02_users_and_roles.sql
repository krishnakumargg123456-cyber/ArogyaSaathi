-- ArogyaSaathi Initial Database Seeds: Users and Roles
-- Passwords hashed with standard Argon2id / Bcrypt

INSERT INTO users (id, employee_id, full_name, phone, role, password_hash, pin_hash, is_active, first_login_done, created_at)
VALUES
('USR-ASHA-001', 'ASHA-001', 'Sunita Devi', '9876543210', 'ASHA', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP),
('USR-ANM-001', 'ANM-001', 'Priya Sharma', '9876543211', 'ANM', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP),
('USR-DOC-001', 'DOC-001', 'Dr. Arjun Mehta', '9876543212', 'DOCTOR', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP),
('USR-STAFF-001', 'STAFF-001', 'Rahul Singh', '9876543213', 'PHC_STAFF', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP),
('USR-PHO-001', 'PHO-001', 'Dr. Neha Verma', '9876543214', 'PUBLIC_HEALTH_OFFICER', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP),
('USR-ADMIN-001', 'ADMIN-001', 'Vikram Malhotra', '9876543215', 'SYSTEM_ADMIN', '$2b$12$e/9UjW.4uJ6b9L9hT3Wc.O1zZ4W7s.H3Z2gL4Y9m.H1y2b3c4d5e6', '$2b$12$pin1234hashmock', 1, 1, CURRENT_TIMESTAMP);

INSERT INTO user_scopes (id, user_id, scope_type, scope_id, created_at)
VALUES
('SCP-001', 'USR-ASHA-001', 'VILLAGE', 'VIL-001', CURRENT_TIMESTAMP),
('SCP-002', 'USR-ANM-001', 'FACILITY', 'FAC-PHC-001', CURRENT_TIMESTAMP),
('SCP-003', 'USR-DOC-001', 'FACILITY', 'FAC-PHC-001', CURRENT_TIMESTAMP),
('SCP-004', 'USR-STAFF-001', 'FACILITY', 'FAC-PHC-001', CURRENT_TIMESTAMP),
('SCP-005', 'USR-PHO-001', 'DISTRICT', 'Sitapur', CURRENT_TIMESTAMP);

