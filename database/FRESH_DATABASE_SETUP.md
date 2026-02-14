# Fresh Database Setup Guide - LaunchPad SKN

This guide explains how to set up the database schema on a **fresh Supabase or PostgreSQL database**.

## 📋 Prerequisites

- A fresh Supabase project OR a clean PostgreSQL database
- Admin access to run SQL scripts
- The schema file: `database/schema-redesign.sql`

## 🚀 Quick Setup Steps

### Step 1: Access Your Database

**For Supabase:**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

**For PostgreSQL:**
```bash
psql -U postgres -d your_database_name
```

### Step 2: Run the Schema Script

**In Supabase SQL Editor:**
1. Open `database/schema-redesign.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**In PostgreSQL:**
```bash
psql -U postgres -d your_database_name -f database/schema-redesign.sql
```

### Step 3: Verify Tables Were Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Tables (16 total):**
- `institutions` (prerequisite)
- `users` (prerequisite)
- `departments` (prerequisite)
- `forms`
- `classes`
- `subjects`
- `subject_form_offerings`
- `class_subjects`
- `lessons`
- `lesson_content`
- `student_class_assignments`
- `lesson_attendance`
- `subject_assessments`
- `student_grades`
- `form_announcements`
- `class_announcements`

### Step 4: Verify Views Were Created

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

**Expected Views:**
- `student_class_subjects_view`
- `teacher_class_subjects_view`

## ✅ What This Script Creates

### Prerequisite Tables (Created First)
- ✅ `institutions` - Schools/educational institutions
- ✅ `users` - All users (students, teachers, admins)
- ✅ `departments` - Academic departments

### Core Hierarchy Tables
- ✅ `forms` - Year groups (Forms 1-7)
- ✅ `classes` - Homeroom classes within forms
- ✅ `subjects` - Academic disciplines
- ✅ `subject_form_offerings` - Subjects per form
- ✅ `class_subjects` - Junction (which classes take which subjects)

### Lesson & Content Tables
- ✅ `lessons` - Individual instructional sessions
- ✅ `lesson_content` - Files and materials for lessons

### Student Management
- ✅ `student_class_assignments` - Student enrollment in classes
- ✅ `lesson_attendance` - Attendance per lesson

### Assessment & Grading
- ✅ `subject_assessments` - Tests, SBAs, projects
- ✅ `student_grades` - Grade records

### Communication
- ✅ `form_announcements` - Form-level announcements
- ✅ `class_announcements` - Class-specific announcements

### Views
- ✅ `student_class_subjects_view` - Quick access to student's classes and subjects
- ✅ `teacher_class_subjects_view` - Quick access to teacher's classes and subjects

## 🔍 Testing the Setup

### Test 1: Check All Tables Exist
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
-- Should return 16
```

### Test 2: Check Foreign Key Constraints
```sql
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### Test 3: Insert Sample Data (Optional)
```sql
-- Insert a test institution
INSERT INTO institutions (name, location, institution_type) 
VALUES ('Test Secondary School', 'Basseterre, St. Kitts', 'SCHOOL')
RETURNING institution_id;

-- Insert a test form (replace 1 with institution_id from above)
INSERT INTO forms (school_id, form_number, form_name, academic_year)
VALUES (1, 3, 'Form 3', '2024-2025')
RETURNING form_id;
```

## 📝 Important Notes

1. **IF NOT EXISTS**: All tables use `CREATE TABLE IF NOT EXISTS`, so running the script multiple times is safe.

2. **Foreign Keys**: All foreign key relationships are properly defined with `REFERENCES`.

3. **Indexes**: All important columns are indexed for performance.

4. **Constraints**: Unique constraints prevent duplicate data where appropriate.

5. **Cascade Deletes**: Most relationships use `ON DELETE CASCADE` to maintain referential integrity.

## 🔄 If Tables Already Exist

If you've run this script before and want to start fresh:

**Option 1: Drop All Tables (WARNING: Deletes all data!)**
```sql
-- This will delete all data!
DROP TABLE IF EXISTS class_announcements CASCADE;
DROP TABLE IF EXISTS form_announcements CASCADE;
DROP TABLE IF EXISTS student_grades CASCADE;
DROP TABLE IF EXISTS subject_assessments CASCADE;
DROP TABLE IF EXISTS lesson_attendance CASCADE;
DROP TABLE IF EXISTS student_class_assignments CASCADE;
DROP TABLE IF EXISTS lesson_content CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS subject_form_offerings CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;

-- Then re-run schema-redesign.sql
```

**Option 2: Use Fresh Database**
- Create a new Supabase project, OR
- Create a new PostgreSQL database

## 🎯 Next Steps

After successfully running the schema:

1. **Update Application Configuration**
   - Configure your Spring Boot services to use this database
   - Update `application.yml` files with connection strings

2. **Insert Initial Data**
   - Create your first school/institution
   - Create users (admin, teachers, students)
   - Create forms and classes
   - Assign students to classes

3. **Test Application**
   - Start your backend services
   - Verify connections work
   - Test CRUD operations

## ❓ Troubleshooting

### Error: "relation does not exist"
- Make sure prerequisite tables (institutions, users, departments) are created first
- Check table creation order in the script

### Error: "foreign key constraint violation"
- Ensure referenced tables exist
- Check that foreign key values exist before inserting

### Error: "unique constraint violation"
- The constraint prevents duplicates - check if data already exists
- Use `INSERT ... ON CONFLICT DO NOTHING` if needed

### Error: "column does not exist"
- Verify all columns are defined in table creation
- Check for typos in column names

---

**Schema Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: ✅ Ready for Fresh Database


