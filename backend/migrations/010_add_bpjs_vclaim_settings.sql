/*
===============================================================================
 Migration : 010_add_bpjs_vclaim_settings
 Project   : SIMRS MERA
 Purpose   : Add BPJS VClaim settings structure and seed placeholder data
===============================================================================

WHAT THIS MIGRATION DOES
------------------------
1. Adds columns to mera_settings for multi-environment support (dev/prod)
2. Adds support for encrypted value flag
3. Seeds placeholder records for BPJS VClaim credentials

BPJS VClaim Settings Structure
------------------------------
- bpjs.vclaim.consumer_id  : Consumer ID dari BPJS
- bpjs.vclaim.secret_key   : Secret Key untuk signing request
- bpjs.vclaim.user_key     : User Key untuk header request

SECURITY NOTES
--------------
- This migration does NOT store actual credentials
- All values are empty placeholders (value_encrypted = 1)
- Actual values must be configured via Settings Service backend
- Never log or expose these values to frontend

===============================================================================
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Step 1: Add environment column for multi-environment support
-- ---------------------------------------------------------------------------
ALTER TABLE `mera_settings`
ADD COLUMN IF NOT EXISTS `environment` ENUM('dev', 'staging', 'prod') NOT NULL DEFAULT 'prod'
AFTER `setting_key`;

-- ---------------------------------------------------------------------------
-- Step 2: Add value_encrypted flag for sensitive data
-- ---------------------------------------------------------------------------
ALTER TABLE `mera_settings`
ADD COLUMN IF NOT EXISTS `value_encrypted` TINYINT(1) NOT NULL DEFAULT 0
AFTER `setting_value`;

-- ---------------------------------------------------------------------------
-- Step 3: Drop existing unique constraint and create new one
-- This allows same setting_key in different environments
-- ---------------------------------------------------------------------------
-- Check if old constraint exists before dropping
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mera_settings'
      AND CONSTRAINT_NAME = 'uniq_module_key'
);

-- Only drop if exists (handled by procedure to avoid error)
DROP PROCEDURE IF EXISTS drop_old_constraint;
DELIMITER //
CREATE PROCEDURE drop_old_constraint()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1091 BEGIN END;
    ALTER TABLE `mera_settings` DROP INDEX `uniq_module_key`;
END //
DELIMITER ;
CALL drop_old_constraint();
DROP PROCEDURE IF EXISTS drop_old_constraint;

-- Create new unique constraint including environment
ALTER TABLE `mera_settings`
ADD UNIQUE KEY `uniq_module_key_env` (`module`, `setting_key`, `environment`);

-- ---------------------------------------------------------------------------
-- Step 4: Seed BPJS VClaim placeholder settings
-- ---------------------------------------------------------------------------
-- Development environment placeholders
INSERT INTO mera_settings (module, setting_key, environment, setting_value, value_type, value_encrypted, scope, is_active, created_by)
VALUES
    ('bpjs.vclaim', 'consumer_id', 'dev', '""', 'string', 1, 'hospital', 1, 'migration'),
    ('bpjs.vclaim', 'secret_key', 'dev', '""', 'string', 1, 'hospital', 1, 'migration'),
    ('bpjs.vclaim', 'user_key', 'dev', '""', 'string', 1, 'hospital', 1, 'migration')
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

-- Production environment placeholders
INSERT INTO mera_settings (module, setting_key, environment, setting_value, value_type, value_encrypted, scope, is_active, created_by)
VALUES
    ('bpjs.vclaim', 'consumer_id', 'prod', '""', 'string', 1, 'hospital', 1, 'migration'),
    ('bpjs.vclaim', 'secret_key', 'prod', '""', 'string', 1, 'hospital', 1, 'migration'),
    ('bpjs.vclaim', 'user_key', 'prod', '""', 'string', 1, 'hospital', 1, 'migration')
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

SET FOREIGN_KEY_CHECKS = 1;

/*
===============================================================================
POST-MIGRATION VERIFICATION
===========================
Run these queries to verify successful migration:

1. Check new columns exist:
   DESCRIBE mera_settings;

2. Check BPJS VClaim settings created:
   SELECT module, setting_key, environment, value_encrypted, is_active
   FROM mera_settings
   WHERE module = 'bpjs.vclaim';

3. Verify unique constraint:
   SHOW INDEX FROM mera_settings WHERE Key_name = 'uniq_module_key_env';

Expected: 6 records (3 keys × 2 environments), all with value_encrypted = 1

===============================================================================
*/
