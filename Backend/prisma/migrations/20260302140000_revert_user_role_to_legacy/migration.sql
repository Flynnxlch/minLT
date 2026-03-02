-- Revert user_role from RISK_* values back to legacy enum (ADMIN_PUSAT, ADMIN_CABANG, USER_BIASA).
-- Safe to run on DBs that never had RISK_* (0 rows updated).
-- Run this on production if users have RISK_ASSESSMENT/RISK_CHAMPION/RISK_OFFICER so Prisma (schema with only legacy enum) can read rows.

UPDATE users SET user_role = 'ADMIN_PUSAT' WHERE user_role::text = 'RISK_ASSESSMENT';
UPDATE users SET user_role = 'ADMIN_CABANG' WHERE user_role::text = 'RISK_CHAMPION';
UPDATE users SET user_role = 'USER_BIASA' WHERE user_role::text = 'RISK_OFFICER';
