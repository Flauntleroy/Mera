-- Add auditlog and usermanagement permissions
-- Run this SQL in your MySQL client

-- Add auditlog permissions
INSERT IGNORE INTO permissions (id, code, domain, action, description) VALUES
    (UUID(), 'auditlog.read', 'auditlog', 'read', 'View audit logs'),
    (UUID(), 'auditlog.read.sensitive', 'auditlog', 'read.sensitive', 'View sensitive audit log data (IP addresses)');

-- Add usermanagement permissions
INSERT IGNORE INTO permissions (id, code, domain, action, description) VALUES
    (UUID(), 'usermanagement.read', 'usermanagement', 'read', 'View users, roles, and permissions'),
    (UUID(), 'usermanagement.write', 'usermanagement', 'write', 'Create, update, delete users and roles');

-- Assign new permissions to admin role
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);

-- Assign auditlog permissions to admin
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT @admin_role_id, p.id, NOW() 
FROM permissions p 
WHERE p.code IN ('auditlog.read', 'auditlog.read.sensitive', 'usermanagement.read', 'usermanagement.write');

SELECT 'Auditlog and usermanagement permissions added!' AS status;
