-- ArogyaSaathi Initial Database Seeds: Facilities and Villages
-- Sitapur District Healthcare Network

INSERT INTO facilities (id, name, facility_code, facility_type, district, block, address, contact_phone, created_at)
VALUES 
('FAC-PHC-001', 'Primary Health Centre Sitapur', 'PHC-STP-01', 'PHC', 'Sitapur', 'Sitapur', 'Main Road, Sitapur Rural', '+91-5862-234567', CURRENT_TIMESTAMP),
('FAC-CHC-001', 'Community Health Centre Naugawan', 'CHC-NGW-01', 'CHC', 'Sitapur', 'Naugawan', 'Naugawan Block HQ', '+91-5862-245678', CURRENT_TIMESTAMP),
('FAC-DH-001', 'District Hospital Sitapur', 'DH-STP-01', 'DH', 'Sitapur', 'Sitapur', 'Civil Lines, Sitapur', '+91-5862-256789', CURRENT_TIMESTAMP);

INSERT INTO villages (id, name, census_code, block, district, population, assigned_facility_id, created_at)
VALUES
('VIL-001', 'Rampur', 'CEN-21401', 'Sitapur', 'Sitapur', 3450, 'FAC-PHC-001', CURRENT_TIMESTAMP),
('VIL-002', 'Madhopur', 'CEN-21402', 'Sitapur', 'Sitapur', 2100, 'FAC-PHC-001', CURRENT_TIMESTAMP),
('VIL-003', 'Kalyanpur', 'CEN-21403', 'Sitapur', 'Sitapur', 4200, 'FAC-PHC-001', CURRENT_TIMESTAMP),
('VIL-004', 'Fatehpur', 'CEN-21404', 'Naugawan', 'Sitapur', 1850, 'FAC-CHC-001', CURRENT_TIMESTAMP);

