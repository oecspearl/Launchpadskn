-- LaunchPad SKN - Database Setup Verification Script
-- Run this after executing schema-redesign.sql to verify everything was created correctly

-- ============================================
-- 1. Check All Tables Exist
-- ============================================
SELECT 
    'Tables Check' AS check_type,
    COUNT(*) AS count,
    CASE 
        WHEN COUNT(*) >= 16 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 16 tables'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. Check All Views Exist
-- ============================================
SELECT 
    'Views Check' AS check_type,
    COUNT(*) AS count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 2 views'
    END AS status
FROM information_schema.views 
WHERE table_schema = 'public';

-- List all views
SELECT table_name AS view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 3. Check Foreign Key Constraints
-- ============================================
SELECT 
    'Foreign Keys Check' AS check_type,
    COUNT(*) AS count,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ PASS'
        ELSE '⚠️ WARNING - Some foreign keys may be missing'
    END AS status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- ============================================
-- 4. Check Indexes
-- ============================================
SELECT 
    'Indexes Check' AS check_type,
    COUNT(*) AS count,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ PASS'
        ELSE '⚠️ WARNING - Some indexes may be missing'
    END AS status
FROM pg_indexes 
WHERE schemaname = 'public';

-- ============================================
-- 5. Verify Core Tables Have Required Columns
-- ============================================

-- Forms table
SELECT 
    'Forms Table Columns' AS check_type,
    COUNT(*) AS column_count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'forms';

-- Classes table
SELECT 
    'Classes Table Columns' AS check_type,
    COUNT(*) AS column_count,
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'classes';

-- Subjects table
SELECT 
    'Subjects Table Columns' AS check_type,
    COUNT(*) AS column_count,
    CASE 
        WHEN COUNT(*) >= 9 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subjects';

-- Lessons table
SELECT 
    'Lessons Table Columns' AS check_type,
    COUNT(*) AS column_count,
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lessons';

-- ============================================
-- 6. Summary Report
-- ============================================
SELECT 
    '=== SETUP VERIFICATION SUMMARY ===' AS report;

SELECT 
    'Total Tables' AS metric,
    COUNT(*)::text AS value
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT 
    'Total Views' AS metric,
    COUNT(*)::text AS value
FROM information_schema.views 
WHERE table_schema = 'public';

SELECT 
    'Total Foreign Keys' AS metric,
    COUNT(*)::text AS value
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

SELECT 
    'Total Indexes' AS metric,
    COUNT(*)::text AS value
FROM pg_indexes 
WHERE schemaname = 'public';

-- ============================================
-- Expected Results:
-- ============================================
-- Tables: 16
-- Views: 2  
-- Foreign Keys: ~20+
-- Indexes: ~30+
-- ============================================


