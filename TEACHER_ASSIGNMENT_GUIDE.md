# Teacher Assignment to Subjects Guide

## Overview

In LaunchPad SKN, teachers are assigned to subjects at the **class-subject level**. This means a teacher is assigned to teach a specific subject to a specific class, not just a subject in general.

## System Architecture

### Database Structure

The assignment uses the `class_subjects` table, which is a junction table that connects:
- **Classes** (e.g., "Form 1A", "Form 2B")
- **Subject Offerings** (a subject offered to a specific form, e.g., "Mathematics for Form 1")
- **Teachers** (via `teacher_id` field)

```
School
  └── Form (e.g., Form 1)
      └── Class (e.g., Form 1A)
          └── Class-Subject (e.g., Form 1A takes Mathematics)
              └── Teacher assigned (e.g., Mr. Smith teaches Math to Form 1A)
```

### Key Database Tables

1. **`class_subjects`** - The junction table where teacher assignments are stored
   - `class_subject_id` - Primary key
   - `class_id` - Which class (e.g., Form 1A)
   - `subject_offering_id` - Which subject offering (e.g., Mathematics for Form 1)
   - `teacher_id` - The assigned teacher (NULL if not assigned yet)

2. **`subject_form_offerings`** - Defines which subjects are offered to which forms
   - Links: `subject_id` → `form_id`
   - Contains curriculum information

3. **`classes`** - Individual class instances
   - Belongs to a `form_id`
   - Example: "Form 1A", "Form 1B"

## How to Assign Teachers to Subjects

### Method 1: During Initial Class-Subject Assignment (Recommended)

**Step-by-step process:**

1. **Navigate to Class-Subject Assignment**
   - Go to Admin Dashboard
   - Click "Class-Subject Assignment" or navigate to `/admin/class-subject-assignment`

2. **Assign Subject to Class**
   - Click "Assign Subject to Class" button
   - Fill in the form:
     - **Class**: Select the class (e.g., "Form 1 - Form 1A")
     - **Subject Offering**: Select the subject (e.g., "Mathematics (MATH) - Form 1")
     - **Teacher**: Select a teacher from the dropdown (or leave as "Not assigned")
   - Click "Assign Subject"

3. **Result**
   - The subject is now assigned to the class
   - If a teacher was selected, they are assigned to teach that subject to that class

### Method 2: Update Existing Assignment

Currently, to change a teacher assignment:
1. Go to Class-Subject Assignment page
2. Remove the existing assignment (trash icon)
3. Re-add the assignment with the new teacher

**Note**: A future enhancement would allow editing the teacher directly in the table.

## Understanding the Hierarchy

Before assigning teachers, ensure this hierarchy exists:

1. **School/Institution** must exist
2. **Forms** must be created (Form 1, Form 2, etc.)
3. **Subjects** must be created (Mathematics, English, etc.)
4. **Subject-Form Offerings** must exist (Mathematics for Form 1, English for Form 1, etc.)
5. **Classes** must be created (Form 1A, Form 1B, etc.)
6. **Class-Subject Assignments** can then be created with teacher assignments

## Important Notes

### One Teacher Per Class-Subject
- Each class-subject combination can have **one assigned teacher**
- A teacher can be assigned to **multiple class-subject combinations**
- Example: Mr. Smith can teach:
  - Mathematics to Form 1A
  - Mathematics to Form 1B
  - Mathematics to Form 2A

### Teacher Role Requirements
- Teachers must have `role = 'INSTRUCTOR'` or `role = 'ADMIN'` in the `users` table
- Only active teachers (`is_active = true`) appear in the assignment dropdown

### Optional Teacher Assignment
- Teachers can be assigned later - you can create class-subject assignments without a teacher
- The assignment will show "Not assigned" until a teacher is added

### Subject Offerings Are Form-Specific
- When assigning a subject to a class, only subject offerings that match the class's form are shown
- Example: Form 1A can only be assigned subjects offered to Form 1 (not Form 2 subjects)

## SQL Example

If you need to assign a teacher directly via SQL:

```sql
-- Find the class_subject_id
SELECT class_subject_id, class_id, subject_offering_id, teacher_id
FROM class_subjects
WHERE class_id = {CLASS_ID}
  AND subject_offering_id = {SUBJECT_OFFERING_ID};

-- Update teacher assignment
UPDATE class_subjects
SET teacher_id = {TEACHER_USER_ID}
WHERE class_subject_id = {CLASS_SUBJECT_ID};
```

## What Teachers See

Once assigned, teachers can:
1. See their assigned classes and subjects in their dashboard
2. Access curriculum content for their assigned subjects (via `/teacher/curriculum`)
3. Create lessons for their class-subjects (via `/teacher/class-subjects/{classSubjectId}/lessons`)
4. Mark attendance for their lessons
5. Enter grades for assessments in their subjects

## Troubleshooting

### Teacher Not Appearing in Dropdown
- Check that the user has `role = 'INSTRUCTOR'` or `role = 'ADMIN'`
- Verify `is_active = true` in the users table
- Ensure the user profile exists in the database

### Subject Not Showing in Assignment Form
- Verify that a `subject_form_offering` exists for that subject and form
- Check that the offering's form matches the selected class's form

### Can't Assign Same Subject to Multiple Classes
- This is intentional - each class-subject combination must be created separately
- Example: Form 1A Mathematics and Form 1B Mathematics are separate assignments

## Related Components

- **Admin Interface**: `frontend/src/components/Admin/ClassSubjectAssignment.js`
- **Service Layer**: `frontend/src/services/supabaseService.js` - `assignSubjectToClass()` method
- **Database Table**: `class_subjects` in `database/schema-redesign.sql`

## Future Enhancements

Potential improvements:
1. **Inline editing** - Edit teacher assignments directly in the table
2. **Bulk assignment** - Assign one teacher to multiple class-subject combinations at once
3. **Timetable integration** - Visual view of teacher assignments by time/period
4. **Conflicts detection** - Warn if a teacher is scheduled for multiple classes at the same time
5. **Teacher workload view** - See total teaching load per teacher

