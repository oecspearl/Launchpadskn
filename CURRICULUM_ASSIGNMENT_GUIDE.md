# How to Assign Curriculum to a Subject

## Overview

In LaunchPad SKN, curriculum is assigned to a **Subject-Form Offering** (e.g., "Mathematics for Form 1"). Each subject offered to each form can have its own detailed curriculum content.

## Two Types of Curriculum Content

1. **Basic Curriculum** (Text Fields)
   - Curriculum Framework (link to standards)
   - Learning Outcomes (text description)

2. **Structured Curriculum** (Enhanced - JSONB format)
   - Detailed multi-level structure with:
     - Topics
     - Units
     - Specific Curriculum Outcomes (SCOs)
     - Assessment strategies
     - Learning activities
     - Resources (links, videos, games, worksheets)

## Step-by-Step: Assigning Curriculum to a Subject

### Step 1: Navigate to Subject Management

1. **Log in as Admin**
2. Go to **Admin Dashboard** → **Subject Management**
   - Or navigate directly to `/admin/subjects`

### Step 2: Find or Create the Subject-Form Offering

The curriculum is assigned to a **Subject-Form Offering**, which links:
- A **Subject** (e.g., Mathematics)
- A **Form** (e.g., Form 1)

**If the offering doesn't exist:**

1. Click the **"Form Offerings"** tab in Subject Management
2. Click **"Add Subject to Form"**
3. Fill in:
   - **Subject**: Select the subject (e.g., Mathematics)
   - **Form**: Select the form (e.g., Form 1)
   - **Weekly Periods**: Number of periods per week
   - **Is Compulsory**: Check if required
   - **Curriculum Framework**: (Optional) Basic text description
   - **Learning Outcomes**: (Optional) Basic text description
4. Click **"Create Offering"**

**If the offering already exists:**

- Scroll to the "Form Offerings" table
- Find the subject-form combination you need

### Step 3: Assign Basic Curriculum (Optional Quick Method)

1. In the **"Form Offerings"** tab, find the subject-form offering
2. Click the **Edit** button (pencil icon) for that offering
3. Fill in:
   - **Curriculum Framework**: Link to standards or general framework
   - **Learning Outcomes**: Learning objectives
4. Click **"Update Curriculum"**

### Step 4: Assign Structured Curriculum (Recommended - Detailed)

The structured curriculum editor allows you to create comprehensive, multi-level curriculum content.

1. In the **"Form Offerings"** tab, find the subject-form offering
2. Click the **"Structured Editor"** button (or icon) for that offering
3. The **Structured Curriculum Editor** modal will open

#### Inside the Structured Curriculum Editor:

**Front Matter Section:**
- Cover Page: Title, Academic Year, Subject Name
- Table of Contents (auto-generated)
- Introduction: Overview of the curriculum

**Topics Section:**
- Add topics using the **"Add Topic"** button
- For each topic:
  - **Topic Number & Title**
  - **Strand Identification**
  - **Essential Learning Outcomes**
  - **Grade Level Guidelines**
  - **Instructional Units** (click "Add Unit" for each topic)
  
**For Each Unit:**
- **Unit Number & SCO Number**
- **Specific Curriculum Outcomes (SCOs)**
- **Inclusive Assessment Strategies**
- **Inclusive Learning Strategies**
- **Activities** (add multiple activities per unit)
  - Activity description
  - Materials needed
  - Duration
  - Learning objectives
- **Resources**
  - Web Links
  - Videos (YouTube links)
  - Games
  - Worksheets

**Closing Framework:**
- Essential Education Competencies
- Cross-Curricular Connections (with Social Studies, Science, English)
- Local Culture Integration
- Technology Integration
- Items of Inspiration

4. Fill in all the details as needed
5. Click **"Save Curriculum"** at the bottom

### Step 5: Verify Curriculum Assignment

1. **As Admin**: Go back to Subject Management → Form Offerings tab
   - The offering should show the curriculum is assigned
   - You can click "Structured Editor" again to edit

2. **As Teacher**: Navigate to `/teacher/curriculum`
   - Filter by subject and form
   - You'll see:
     - A green alert: "Enhanced Structured Curriculum Available"
     - A preview of the introduction and topics
     - A **"View Full Structured Curriculum"** button to see all details

## Understanding Subject-Form Offerings

### The Hierarchy

```
Subject (Mathematics)
  └── Subject-Form Offering (Mathematics for Form 1)
      ├── Basic Curriculum (curriculum_framework, learning_outcomes)
      └── Structured Curriculum (curriculum_structure JSONB)
          ├── Front Matter
          └── Topics (6 topics for Form 1 Math)
              └── Units
                  └── SCOs, Activities, Resources
```

### Database Structure

Curriculum is stored in the `subject_form_offerings` table:

- **Basic Fields:**
  - `curriculum_framework` (TEXT) - Basic description
  - `learning_outcomes` (TEXT) - Learning objectives

- **Structured Fields:**
  - `curriculum_structure` (JSONB) - Complete structured data
  - `curriculum_version` (VARCHAR) - Version identifier
  - `curriculum_updated_at` (TIMESTAMP) - Last update date

## Important Notes

### One Curriculum Per Subject-Form Offering

- Each subject-form combination (e.g., Mathematics + Form 1) has **one curriculum**
- If you update it, it replaces the previous version
- The `curriculum_version` field tracks version numbers

### Curriculum vs. Subject Offering

- **Subject** = The discipline (Mathematics, English, etc.)
- **Subject-Form Offering** = Subject offered to a specific form (Mathematics for Form 1)
- **Curriculum** = The detailed content for that offering

### Updating Curriculum

1. Go to Subject Management → Form Offerings
2. Click **"Structured Editor"** for the offering
3. Make changes in the editor
4. Click **"Save Curriculum"**
5. The `curriculum_updated_at` timestamp updates automatically

### Viewing Curriculum

**Teachers can view curriculum:**
- Navigate to `/teacher/curriculum`
- Filter by subject and form
- Click "View Full Structured Curriculum" to see all topics, units, activities, and resources

**Admins can edit curriculum:**
- Subject Management → Form Offerings tab
- Click "Structured Editor" button

## Example: Assigning Form 1 Mathematics Curriculum

1. **Navigate**: Admin Dashboard → Subject Management → Form Offerings tab
2. **Find**: Mathematics + Form 1 offering (or create it if it doesn't exist)
3. **Click**: "Structured Editor" button
4. **Fill in**:
   - Front Matter: "Form 1 Mathematics - Enhanced Curriculum v2 (SKN 2023)"
   - Add Topic 1: "Number Operations"
   - Add Unit 1.1 with SCOs, activities, resources
   - Continue for all 6 topics
5. **Save**: Click "Save Curriculum"
6. **Verify**: Teachers can now see it in `/teacher/curriculum`

## Troubleshooting

### "Structured Editor" button not showing
- Ensure you're logged in as an **Admin**
- Make sure the subject-form offering exists
- Check that you're in the "Form Offerings" tab

### Can't save curriculum
- Check that all required fields are filled (at minimum: title, subject name)
- Verify the offering_id exists in the database
- Check browser console for error messages

### Teachers can't see curriculum
- Verify the curriculum was saved successfully
- Check that `curriculum_structure` is not NULL in the database
- Ensure teachers are looking at the correct subject and form combination

### Editing existing curriculum
- Click "Structured Editor" for the offering
- The editor will load existing curriculum_structure if it exists
- If not, it initializes from basic `curriculum_framework` field

## SQL Alternative

If you need to assign curriculum directly via SQL:

```sql
-- Find the offering_id
SELECT offering_id, subject_id, form_id
FROM subject_form_offerings sfo
JOIN subjects s ON sfo.subject_id = s.subject_id
JOIN forms f ON sfo.form_id = f.form_id
WHERE s.subject_name = 'Mathematics'
  AND f.form_number = 1;

-- Update with structured curriculum
UPDATE subject_form_offerings
SET 
  curriculum_structure = '{...JSON structure...}',
  curriculum_version = 'Form 1 Math Enhanced v2 (SKN 2023)',
  curriculum_updated_at = NOW()
WHERE offering_id = {OFFERING_ID};
```

## Related Components

- **Admin Interface**: `frontend/src/components/Admin/SubjectManagement.js`
- **Curriculum Editor**: `frontend/src/components/Admin/StructuredCurriculumEditor.js`
- **Teacher Viewer**: `frontend/src/components/Teacher/Curriculum.js`
- **Database Table**: `subject_form_offerings` in `database/schema-redesign.sql`

