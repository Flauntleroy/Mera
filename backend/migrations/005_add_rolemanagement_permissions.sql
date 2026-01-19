-- ============================================
-- Migration: Add rolemanagement permissions
-- Required for Role & Permission Management UI
-- ============================================

-- Add rolemanagement permissions
INSERT INTO mera_permissions (id, code, domain, action, description, created_at) VALUES
    (UUID(), 'rolemanagement.read', 'rolemanagement', 'read', 'Melihat daftar role dan permission', NOW()),
    (UUID(), 'rolemanagement.write', 'rolemanagement', 'write', 'Mengelola role dan permission', NOW());

-- Assign to admin role
INSERT INTO mera_role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM mera_roles r, mera_permissions p
WHERE r.name = 'admin' AND p.code IN ('rolemanagement.read', 'rolemanagement.write');
