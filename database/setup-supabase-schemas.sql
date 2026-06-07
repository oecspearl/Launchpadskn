-- LaunchPad SKN - Supabase Schema Setup Script
-- Run this in Supabase SQL Editor
-- This creates three schemas (instead of three separate databases)

-- Step 1: Create the three schemas
CREATE SCHEMA IF NOT EXISTS scholarspace_users;
CREATE SCHEMA IF NOT EXISTS scholarspace_institutions;
CREATE SCHEMA IF NOT EXISTS scholarspace_courses;

-- Step 2: Grant full permissions to postgres user
GRANT ALL ON SCHEMA scholarspace_users TO postgres;
GRANT ALL ON SCHEMA scholarspace_institutions TO postgres;
GRANT ALL ON SCHEMA scholarspace_courses TO postgres;

-- Step 3: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_users GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_institutions GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_courses GRANT ALL ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_users GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_institutions GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA scholarspace_courses GRANT ALL ON SEQUENCES TO postgres;

-- Step 4: Verify schemas were created
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('scholarspace_users', 'scholarspace_institutions', 'scholarspace_courses');

-- Expected output should show all three schemas
-- scholarspace_users
-- scholarspace_institutions
-- scholarspace_courses


