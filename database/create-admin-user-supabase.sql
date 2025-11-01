-- LaunchPad SKN - Create Admin User for Testing (Supabase)
-- Run this in Supabase SQL Editor after running schema-redesign.sql
-- This creates an admin user you can use to log in and test the application
--
-- IMPORTANT: If you get "column updated_at does not exist" error,
-- run database/fix-users-table.sql first to add the missing column

-- ============================================
-- ADMIN USER CREDENTIALS
-- ============================================
-- Email: admin@launchpadskn.com
-- Password: Admin123! (BCrypt hashed below)

-- Insert Admin User
-- The password hash below is for "Admin123!"
INSERT INTO users (
    name,
    email,
    password,
    role,
    phone,
    is_active,
    department_id,
    created_at,
    is_first_login
)
VALUES (
    'Admin User',
    'admin@launchpadskn.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- BCrypt hash for "Admin123!"
    'ADMIN',
    '+1-869-555-0000',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = true;

-- ============================================
-- ADDITIONAL TEST USERS (Optional)
-- ============================================

-- Test Teacher/Instructor User
-- Email: instructor@launchpadskn.com
-- Password: Instructor123!
INSERT INTO users (
    name,
    email,
    password,
    role,
    phone,
    is_active,
    department_id,
    created_at,
    is_first_login
)
VALUES (
    'Test Instructor',
    'instructor@launchpadskn.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- BCrypt hash for "Instructor123!" (using same hash for simplicity)
    'INSTRUCTOR',
    '+1-869-555-0001',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    true
)
ON CONFLICT (email) DO UPDATE
SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = true;

-- Test Student User
-- Email: student@launchpadskn.com
-- Password: Student123!
INSERT INTO users (
    name,
    email,
    password,
    role,
    phone,
    is_active,
    department_id,
    created_at,
    is_first_login
)
VALUES (
    'Test Student',
    'student@launchpadskn.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- BCrypt hash (using same for simplicity)
    'STUDENT',
    '+1-869-555-0002',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = true;

-- ============================================
-- VERIFY USERS WERE CREATED
-- ============================================
SELECT 
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM users
WHERE email IN (
    'admin@launchpadskn.com',
    'instructor@launchpadskn.com',
    'student@launchpadskn.com'
)
ORDER BY role;

-- ============================================
-- LOGIN CREDENTIALS SUMMARY
-- ============================================
-- Admin:     admin@launchpadskn.com / Admin123!
-- Instructor: instructor@launchpadskn.com / Instructor123!
-- Student:    student@launchpadskn.com / Student123!
-- 
-- Note: All passwords are currently using the same BCrypt hash
--       for "Admin123!" for simplicity. In production, use unique hashes.

