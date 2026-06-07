-- Create Admin User in Database for LaunchPad SKN
-- Run this SQL script in PostgreSQL if API registration doesn't work
-- Note: This uses a pre-encoded BCrypt hash for password "admin123"
-- BCrypt hash for "admin123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- First, check if user-service database exists and connect to it
\c scholarspace_users;

-- Insert admin user with pre-encoded password (admin123)
-- The password hash is: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (name, email, password, role, is_active, created_at, is_first_login)
VALUES (
    'Admin User',
    'admin@scholarspace.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO NOTHING;

-- Verify user was created
SELECT user_id, name, email, role, is_active FROM users WHERE email = 'admin@scholarspace.com';

-- Additional test users (optional)
-- Student user: student@scholarspace.com / student123
INSERT INTO users (name, email, password, role, is_active, created_at, is_first_login)
VALUES (
    'Test Student',
    'student@scholarspace.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'STUDENT',
    true,
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (email) DO NOTHING;

-- Instructor user: instructor@scholarspace.com / instructor123
INSERT INTO users (name, email, password, role, is_active, created_at, is_first_login)
VALUES (
    'Test Instructor',
    'instructor@scholarspace.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'INSTRUCTOR',
    true,
    CURRENT_TIMESTAMP,
    true
)
ON CONFLICT (email) DO NOTHING;

echo All test users created!
echo.
echo Login Credentials:
echo   Admin: admin@scholarspace.com / admin123
echo   Student: student@scholarspace.com / admin123
echo   Instructor: instructor@scholarspace.com / admin123
echo.
echo Note: All users use the same password hash for simplicity (password: admin123)

