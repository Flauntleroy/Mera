-- ============================================
-- SIMRS Authentication Domain - Database Schema
-- Database: rsaz_sik (existing MySQL database)
-- ============================================
-- This migration adds authentication/RBAC tables only.
-- It does NOT modify any existing legacy SIMRS tables.
-- All primary keys use UUID (CHAR(36)) - NO AUTO_INCREMENT.
-- ============================================

-- ---------------------------------------------
-- Table: users
-- Core user accounts for authentication
-- ---------------------------------------------
-- ---------------------------------------------
-- Table: mera_users
-- Core user accounts for authentication
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_users (
    id CHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_mera_users_username (username),
    UNIQUE KEY uk_mera_users_email (email),
    INDEX idx_mera_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_roles
-- Role definitions (permission templates)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_roles (
    id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_mera_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_permissions
-- Permission definitions in domain.action format
-- Example: billing.read, patient.create
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_permissions (
    id CHAR(36) NOT NULL,
    code VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_mera_permissions_code (code),
    INDEX idx_mera_permissions_domain (domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_role_permissions
-- Maps roles to their permissions
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_mera_role_permissions_role 
        FOREIGN KEY (role_id) REFERENCES mera_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mera_role_permissions_permission 
        FOREIGN KEY (permission_id) REFERENCES mera_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_user_roles
-- Assigns roles to users (many-to-many)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_user_roles (
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_mera_user_roles_user 
        FOREIGN KEY (user_id) REFERENCES mera_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mera_user_roles_role 
        FOREIGN KEY (role_id) REFERENCES mera_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_user_permissions
-- Per-user permission overrides (grant OR revoke)
-- This allows fine-grained control beyond role-based permissions.
-- type = 'grant' => explicitly add permission
-- type = 'revoke' => explicitly remove permission
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_user_permissions (
    user_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    type ENUM('grant', 'revoke') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, permission_id),
    CONSTRAINT fk_mera_user_permissions_user 
        FOREIGN KEY (user_id) REFERENCES mera_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mera_user_permissions_permission 
        FOREIGN KEY (permission_id) REFERENCES mera_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- Table: mera_login_sessions
-- Tracks all login sessions for audit and presence.
-- Sessions are REVOKED, never deleted.
-- Supports multi-device login and admin force logout.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS mera_login_sessions (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    
    PRIMARY KEY (id),
    CONSTRAINT fk_mera_login_sessions_user 
        FOREIGN KEY (user_id) REFERENCES mera_users(id) ON DELETE CASCADE,
    INDEX idx_mera_login_sessions_user_id (user_id),
    INDEX idx_mera_login_sessions_revoked_at (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Example Data: Seed permissions for SIMRS domains
-- ============================================
INSERT INTO mera_permissions (id, code, domain, action, description) VALUES
    (UUID(), 'patient.read', 'patient', 'read', 'View patient records'),
    (UUID(), 'patient.create', 'patient', 'create', 'Create new patient records'),
    (UUID(), 'patient.update', 'patient', 'update', 'Update patient records'),
    (UUID(), 'patient.delete', 'patient', 'delete', 'Delete patient records'),
    (UUID(), 'billing.read', 'billing', 'read', 'View billing information'),
    (UUID(), 'billing.create', 'billing', 'create', 'Create billing records'),
    (UUID(), 'billing.update', 'billing', 'update', 'Update billing records'),
    (UUID(), 'pharmacy.read', 'pharmacy', 'read', 'View pharmacy inventory'),
    (UUID(), 'pharmacy.dispense', 'pharmacy', 'dispense', 'Dispense medications'),
    (UUID(), 'lab.read', 'lab', 'read', 'View lab results'),
    (UUID(), 'lab.create', 'lab', 'create', 'Create lab orders'),
    (UUID(), 'session.revoke', 'session', 'revoke', 'Revoke login sessions'),
    (UUID(), 'user.read', 'user', 'read', 'View user accounts'),
    (UUID(), 'user.manage', 'user', 'manage', 'Manage user accounts'),
    (UUID(), 'role.manage', 'role', 'manage', 'Manage roles and permissions');

-- Example role: Admin with all permissions
INSERT INTO mera_roles (id, name, description) VALUES
    (UUID(), 'admin', 'System administrator with full access');

-- Example role: Doctor
INSERT INTO mera_roles (id, name, description) VALUES
    (UUID(), 'doctor', 'Medical doctor with patient access');

-- Example role: Nurse  
INSERT INTO mera_roles (id, name, description) VALUES
    (UUID(), 'nurse', 'Nursing staff with limited patient access');

-- Example role: Billing Staff
INSERT INTO mera_roles (id, name, description) VALUES
    (UUID(), 'billing_staff', 'Billing department personnel');
