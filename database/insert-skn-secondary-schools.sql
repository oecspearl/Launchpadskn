-- LaunchPad SKN - Insert Secondary Schools of Saint Kitts and Nevis
-- This script inserts all 12 secondary schools into the institutions table
-- Run this in Supabase SQL Editor or PostgreSQL

-- ============================================
-- ST. KITTS - PUBLIC SECONDARY SCHOOLS
-- ============================================

-- 1. Basseterre High School (BHS)
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Basseterre High School (BHS)',
    'Bernard Audain''s Drive, Taylors, Basseterre, St. Kitts',
    '+1 (869) 465-2096, +1 (869) 465-2004',
    'damian.bacchus@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 2. Cayon High School (CHS)
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Cayon High School (CHS)',
    'St. Mary Cayon, St. Kitts',
    '+1 (869) 465-7204',
    'tracy.wattley@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 3. Washington Archibald High School (WAHS)
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Washington Archibald High School (WAHS)',
    'Taylor''s Range, Basseterre, St. Kitts',
    '+1 (869) 465-2834, +1 (869) 667-0870',
    'Roline.Taylor@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 4. Verchilds High School
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Verchilds High School',
    'Verchild''s Village, St. Thomas Middle Island, St. Kitts',
    '+1 (869) 465-6283',
    'meguel.thomas@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 5. Charles E. Mills Secondary School (CEMSS)
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Charles E. Mills Secondary School (CEMSS)',
    'Sandy Point, St. Kitts (Formerly Sandy Point High School)',
    '+1 (869) 465-6295',
    'eisha.jackson@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 6. Dr. Denzil L. Douglas Secondary School
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Dr. Denzil L. Douglas Secondary School',
    'Saddlers, St. Kitts (Formerly Saddlers Secondary School)',
    '+1 (869) 465-5804',
    'julia.byron-isaac@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- ============================================
-- ST. KITTS - PRIVATE SECONDARY SCHOOLS
-- ============================================

-- 7. Immaculate Conception Catholic School (ICCS)
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Immaculate Conception Catholic School (ICCS)',
    'E Independence Street, Basseterre, St. Kitts (Formerly St. Theresa''s Convent High School)',
    '+1 (869) 465-3219',
    'Contact via phone',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 8. St. Kitts International Academy (SKI Academy)
INSERT INTO institutions (name, location, phone, contact, website, institution_type) 
VALUES (
    'St. Kitts International Academy (SKI Academy)',
    'Box 1206, Morgan Heights, Basseterre, St. Kitts',
    '+1 (869) 466-1026',
    'skiacademy@caribsurf.com',
    'www.skiacademy.net',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    website = EXCLUDED.website,
    institution_type = EXCLUDED.institution_type;

-- 9. St. Christopher Preparatory School
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'St. Christopher Preparatory School',
    'St. Kitts',
    'Contact Ministry of Education',
    'Information not publicly available',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- ============================================
-- NEVIS - PUBLIC SECONDARY SCHOOLS
-- ============================================

-- 10. Charlestown Secondary School
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Charlestown Secondary School',
    'PO Box 207, Stoney Grove, Charlestown, Nevis',
    '+1 (869) 469-7316',
    'dianna.browne@moe.edu.kn',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- 11. Gingerland Secondary School
INSERT INTO institutions (name, location, phone, contact, institution_type) 
VALUES (
    'Gingerland Secondary School',
    'Stonyhill, Gingerland, Nevis',
    '+1 (869) 469-3926',
    'Contact via phone or Ministry of Education Nevis',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    institution_type = EXCLUDED.institution_type;

-- ============================================
-- NEVIS - PRIVATE SECONDARY SCHOOLS
-- ============================================

-- 12. Nevis International Secondary School (NISS)
INSERT INTO institutions (name, location, phone, contact, website, institution_type) 
VALUES (
    'Nevis International Secondary School (NISS)',
    'Brown Pasture, Charlestown, Nevis (Forms 1-5, Ages 11-17)',
    '+1 (869) 469-7006',
    'nevisinternationalsecondary@sisterisles.kn',
    'www.nevisinternational.wixsite.com',
    'SCHOOL'
)
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    phone = EXCLUDED.phone,
    contact = EXCLUDED.contact,
    website = EXCLUDED.website,
    institution_type = EXCLUDED.institution_type;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after insertion to verify all schools were added:
-- SELECT name, location, institution_type, phone, contact 
-- FROM institutions 
-- WHERE institution_type = 'SCHOOL'
-- ORDER BY name;

