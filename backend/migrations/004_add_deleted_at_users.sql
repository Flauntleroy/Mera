-- ============================================
-- Migration: Add deleted_at column to users table
-- Required for soft delete functionality in user management
-- ============================================

-- Add deleted_at column to users table for soft delete support
ALTER TABLE mera_users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for faster queries on non-deleted users
CREATE INDEX idx_mera_users_deleted_at ON mera_users (deleted_at);
