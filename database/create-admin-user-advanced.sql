-- LaunchPad SKN - Create Admin User with Proper Password Hashing
-- This script uses PostgreSQL's crypt function (requires pgcrypto extension)
-- Run this AFTER running schema-redesign.sql

-- ============================================
-- ENABLE PASSWORD HASHING EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- ADMIN USER
-- ============================================
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
    crypt('Admin123!', gen_salt('bf')), -- BCrypt hash for "Admin123!"
    'ADMIN',
    '+1-869-555-0000',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    password = crypt('Admin123!', gen_salt('bf')),
    role = EXCLUDED.role,
    is_active = true;

-- ============================================
-- TEST INSTRUCTOR
-- ============================================
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
    crypt('Instructor123!', gen_salt('bf')),
    'INSTRUCTOR',
    '+1-869-555-0001',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    true
)
ON CONFLICT (email) DO UPDATE
SET 
    password = crypt('Instructor123!', gen_salt('bf')),
    role = EXCLUDED.role,
    is_active = true;

-- ============================================
-- TEST STUDENT
-- ============================================
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
    crypt('Student123!', gen_salt('bf')),
    'STUDENT',
    '+1-869-555-0002',
    true,
    NULL,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO UPDATE
SET 
    password = crypt('Student123!', gen_salt('bf')),
    role = EXCLUDED.role,
    is_active = true;

-- ============================================
-- VERIFY AND DISPLAY CREDENTIALS
-- ============================================
SELECT 
    '=== TEST USER CREDENTIALS ===' AS info;

SELECT 
    role,
    name,
    email,
    CASE 
        WHEN role = 'ADMIN' THEN 'Admin123!'
        WHEN role = 'INSTRUCTOR' THEN 'Instructor123!'
        WHEN role = 'STUDENT' THEN 'Student123!'
        ELSE 'Unknown'
    END AS password,
    is_active,
    created_at
FROM users
WHERE email IN (
    'admin@launchpadskn.com',
    'instructor@launchpadskn.com',
    'student@launchpadskn.com'
)
ORDER BY 
    CASE role
        WHEN 'ADMIN' THEN 1
        WHEN 'INSTRUCTOR' THEN 2
        WHEN 'STUDENT' THEN 3
    END;

