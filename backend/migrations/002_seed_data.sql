-- ============================================
-- Seed Data for SIMRS Authentication Domain
-- Database: rsaz_sik
-- ============================================
-- Run after 001_init_schema.sql to create test users and role assignments.
-- Default password for all test users: "password123"
-- ============================================

-- Create admin user (password: password123)
-- bcrypt hash generated with cost 12
INSERT INTO mera_users (id, username, email, password_hash, is_active, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@hospital.com', 
     '$2a$12$T5hE4ArCfmJKOfWIT8Zai.SqMoQML2owXck.ussXG2Y6iRbbMXbVy', TRUE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'doctor1', 'doctor1@hospital.com', 
     '$2a$12$T5hE4ArCfmJKOfWIT8Zai.SqMoQML2owXck.ussXG2Y6iRbbMXbVy', TRUE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'nurse1', 'nurse1@hospital.com', 
     '$2a$12$T5hE4ArCfmJKOfWIT8Zai.SqMoQML2owXck.ussXG2Y6iRbbMXbVy', TRUE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'billing1', 'billing1@hospital.com', 
     '$2a$12$T5hE4ArCfmJKOfWIT8Zai.SqMoQML2owXck.ussXG2Y6iRbbMXbVy', TRUE, NOW(), NOW());

-- Get role IDs (assuming schema seed has been run)
SET @admin_role_id = (SELECT id FROM mera_roles WHERE name = 'admin' LIMIT 1);
SET @doctor_role_id = (SELECT id FROM mera_roles WHERE name = 'doctor' LIMIT 1);
SET @nurse_role_id = (SELECT id FROM mera_roles WHERE name = 'nurse' LIMIT 1);
SET @billing_role_id = (SELECT id FROM mera_roles WHERE name = 'billing_staff' LIMIT 1);

-- Assign roles to users
INSERT INTO mera_user_roles (user_id, role_id, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', @admin_role_id, NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', @doctor_role_id, NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', @nurse_role_id, NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', @billing_role_id, NOW());

-- Get permission IDs for role assignments
SET @patient_read = (SELECT id FROM mera_permissions WHERE code = 'patient.read' LIMIT 1);
SET @patient_create = (SELECT id FROM mera_permissions WHERE code = 'patient.create' LIMIT 1);
SET @patient_update = (SELECT id FROM mera_permissions WHERE code = 'patient.update' LIMIT 1);
SET @patient_delete = (SELECT id FROM mera_permissions WHERE code = 'patient.delete' LIMIT 1);
SET @billing_read = (SELECT id FROM mera_permissions WHERE code = 'billing.read' LIMIT 1);
SET @billing_create = (SELECT id FROM mera_permissions WHERE code = 'billing.create' LIMIT 1);
SET @billing_update = (SELECT id FROM mera_permissions WHERE code = 'billing.update' LIMIT 1);
SET @pharmacy_read = (SELECT id FROM mera_permissions WHERE code = 'pharmacy.read' LIMIT 1);
SET @pharmacy_dispense = (SELECT id FROM mera_permissions WHERE code = 'pharmacy.dispense' LIMIT 1);
SET @lab_read = (SELECT id FROM mera_permissions WHERE code = 'lab.read' LIMIT 1);
SET @lab_create = (SELECT id FROM mera_permissions WHERE code = 'lab.create' LIMIT 1);
SET @session_revoke = (SELECT id FROM mera_permissions WHERE code = 'session.revoke' LIMIT 1);
SET @user_read = (SELECT id FROM mera_permissions WHERE code = 'user.read' LIMIT 1);
SET @user_manage = (SELECT id FROM mera_permissions WHERE code = 'user.manage' LIMIT 1);
SET @role_manage = (SELECT id FROM mera_permissions WHERE code = 'role.manage' LIMIT 1);

-- Assign ALL permissions to admin role
INSERT INTO mera_role_permissions (role_id, permission_id, created_at)
SELECT @admin_role_id, p.id, NOW() FROM mera_permissions p
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Doctor role permissions
INSERT INTO mera_role_permissions (role_id, permission_id, created_at) VALUES
    (@doctor_role_id, @patient_read, NOW()),
    (@doctor_role_id, @patient_create, NOW()),
    (@doctor_role_id, @patient_update, NOW()),
    (@doctor_role_id, @lab_read, NOW()),
    (@doctor_role_id, @lab_create, NOW()),
    (@doctor_role_id, @pharmacy_read, NOW())
ON DUPLICATE KEY UPDATE created_at = created_at;

-- Nurse role permissions
INSERT INTO mera_role_permissions (role_id, permission_id, created_at) VALUES
    (@nurse_role_id, @patient_read, NOW()),
    (@nurse_role_id, @patient_update, NOW()),
    (@nurse_role_id, @lab_read, NOW()),
    (@nurse_role_id, @pharmacy_read, NOW()),
    (@nurse_role_id, @pharmacy_dispense, NOW())
ON DUPLICATE KEY UPDATE created_at = created_at;

-- Billing staff role permissions
INSERT INTO mera_role_permissions (role_id, permission_id, created_at) VALUES
    (@billing_role_id, @patient_read, NOW()),
    (@billing_role_id, @billing_read, NOW()),
    (@billing_role_id, @billing_create, NOW()),
    (@billing_role_id, @billing_update, NOW())
ON DUPLICATE KEY UPDATE created_at = created_at;

-- Example user permission override: Give nurse1 special permission to create lab orders
INSERT INTO mera_user_permissions (user_id, permission_id, type, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', @lab_create, 'grant', NOW());

-- Example user permission override: Revoke billing1's ability to update billing
-- (perhaps they are in training)
-- INSERT INTO user_permissions (user_id, permission_id, type, created_at) VALUES
--     ('550e8400-e29b-41d4-a716-446655440004', @billing_update, 'revoke', NOW());

SELECT 'Seed data inserted successfully!' AS status;
