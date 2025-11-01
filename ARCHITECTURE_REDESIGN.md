# LaunchPad SKN - Caribbean Secondary School Architecture Redesign

## Overview

This document outlines the complete redesign of LaunchPad SKN from a generic course-based LMS to a hierarchical Caribbean secondary school structure: **School → Form → Class → Subject → Lesson**.

---

## Hierarchical Structure

```
School (Institution)
  └── Form (Year Group: Forms 1-7)
      └── Class (Homeroom/Stream: e.g., 3A, 3B, 3C)
          ├── Class Roster (25-35 students)
          ├── Form Tutor (Class Teacher)
          └── Subjects (Academic Disciplines)
              ├── Subject Teacher
              └── Lessons (Individual Sessions)
                  ├── Timetable Slot (date, time, location)
                  ├── Lesson Content
                  ├── Attendance
                  └── Homework/Assignments
```

---

## Database Schema Design

### Core Entities

#### 1. Form (Year Group)
```sql
CREATE TABLE forms (
    form_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT REFERENCES institutions(institution_id),
    form_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6, 7
    form_name VARCHAR(50) NOT NULL, -- "Form 3", "Form 4A"
    academic_year VARCHAR(20) NOT NULL, -- "2024-2025"
    coordinator_id BIGINT REFERENCES users(user_id), -- Form Coordinator/Year Head
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, form_number, academic_year)
);
```

#### 2. Class (Homeroom/Stream)
```sql
CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT REFERENCES forms(form_id),
    class_name VARCHAR(50) NOT NULL, -- "3A", "3B", "4Science", "5Arts"
    class_code VARCHAR(20) UNIQUE NOT NULL, -- "F3A", "F4SCI"
    capacity INTEGER DEFAULT 35,
    form_tutor_id BIGINT REFERENCES users(user_id), -- Class Teacher/Form Tutor
    room_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, class_name)
);
```

#### 3. Subject (Academic Discipline)
```sql
CREATE TABLE subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT REFERENCES institutions(institution_id),
    subject_name VARCHAR(100) NOT NULL, -- "Mathematics", "English Language"
    subject_code VARCHAR(20) UNIQUE NOT NULL, -- "MATH", "ENG"
    description TEXT,
    cxc_code VARCHAR(20), -- CSEC/CAPE subject code
    department_id BIGINT REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject offerings per Form (e.g., Form 3 Math, Form 5 Math are different)
CREATE TABLE subject_form_offerings (
    offering_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subjects(subject_id),
    form_id BIGINT REFERENCES forms(form_id),
    curriculum_framework TEXT, -- Link to CXC/CSEC/CAPE standards
    learning_outcomes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, form_id)
);

-- Class-Subject assignment (which classes take which subjects)
CREATE TABLE class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES classes(class_id),
    subject_offering_id BIGINT REFERENCES subject_form_offerings(offering_id),
    teacher_id BIGINT REFERENCES users(user_id), -- Subject teacher for this class
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_offering_id)
);
```

#### 4. Lesson (Individual Session)
```sql
CREATE TABLE lessons (
    lesson_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    lesson_title VARCHAR(200) NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100), -- Room number or location
    lesson_number INTEGER, -- Sequence within term/topic
    topic VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    content_url TEXT, -- Link to materials
    homework_description TEXT,
    homework_due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson-specific content (files, links, etc.)
CREATE TABLE lesson_content (
    content_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT REFERENCES lessons(lesson_id),
    content_type VARCHAR(50), -- FILE, LINK, VIDEO, DOCUMENT
    title VARCHAR(200),
    url TEXT,
    file_path TEXT,
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Student-Class Assignment
```sql
-- Students assigned to classes (replaces course enrollment)
CREATE TABLE student_class_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES users(user_id),
    class_id BIGINT REFERENCES classes(class_id),
    academic_year VARCHAR(20) NOT NULL,
    assignment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, academic_year)
);
```

#### 6. Lesson Attendance
```sql
CREATE TABLE lesson_attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT REFERENCES lessons(lesson_id),
    student_id BIGINT REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, LATE, EXCUSED
    marked_by BIGINT REFERENCES users(user_id), -- Teacher who marked
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(lesson_id, student_id)
);
```

#### 7. Assessment & Grades
```sql
-- Subject-based assessments (replaces course-based)
CREATE TABLE subject_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    assessment_type VARCHAR(50), -- TEST, QUIZ, SBA, PROJECT, MOCK_EXAM
    assessment_name VARCHAR(200) NOT NULL,
    total_marks DECIMAL(10,2),
    weight DECIMAL(5,2), -- Percentage of final grade
    due_date TIMESTAMP,
    term INTEGER, -- 1, 2, or 3
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_grades (
    grade_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT REFERENCES subject_assessments(assessment_id),
    student_id BIGINT REFERENCES users(user_id),
    marks_obtained DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(5), -- A, B, C, etc.
    graded_by BIGINT REFERENCES users(user_id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    UNIQUE(assessment_id, student_id)
);
```

---

## Entity Relationships

```
Institution (School)
  ├── 1:M → Forms
  └── 1:M → Subjects

Form
  ├── 1:M → Classes
  ├── 1:M → Subject Offerings (via subject_form_offerings)
  └── M:1 → Form Coordinator

Class
  ├── 1:M → Student Assignments
  ├── M:M → Subjects (via class_subjects)
  └── 1:1 → Form Tutor

Subject
  ├── 1:M → Subject Offerings (per Form)
  └── M:1 → Department

Subject Offering (Subject + Form)
  ├── M:M → Classes (via class_subjects)
  └── 1:M → Lessons

Class-Subject (junction)
  ├── 1:M → Lessons
  ├── 1:M → Assessments
  └── M:1 → Subject Teacher

Lesson
  ├── 1:M → Attendance Records
  └── 1:M → Content Files

Student
  ├── 1:1 → Class Assignment (per academic year)
  └── M:M → Lessons (via attendance)
```

---

## API Endpoints Structure

### Form Management
- `GET /api/forms` - List all forms
- `GET /api/forms/{id}` - Get form details
- `POST /api/forms` - Create form
- `PUT /api/forms/{id}` - Update form
- `GET /api/forms/{id}/classes` - Get classes in form
- `GET /api/schools/{id}/forms` - Get forms by school

### Class Management
- `GET /api/classes` - List all classes
- `GET /api/classes/{id}` - Get class details
- `POST /api/classes` - Create class
- `PUT /api/classes/{id}` - Update class
- `GET /api/classes/{id}/students` - Get class roster
- `POST /api/classes/{id}/students` - Add student to class
- `DELETE /api/classes/{id}/students/{studentId}` - Remove student
- `GET /api/classes/{id}/subjects` - Get subjects for class
- `GET /api/forms/{id}/classes` - Get classes in form

### Subject Management
- `GET /api/subjects` - List all subjects
- `GET /api/subjects/{id}` - Get subject details
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/{id}` - Update subject
- `GET /api/subjects/{id}/offerings` - Get form offerings for subject
- `POST /api/subjects/{id}/offerings` - Create subject offering for form
- `GET /api/forms/{id}/subjects` - Get subjects offered in form

### Class-Subject Assignment
- `POST /api/classes/{id}/subjects/{subjectId}` - Assign subject to class
- `DELETE /api/classes/{id}/subjects/{subjectId}` - Remove subject from class
- `PUT /api/class-subjects/{id}/teacher` - Assign teacher to class-subject

### Lesson Management
- `GET /api/lessons` - List lessons (with filters)
- `GET /api/lessons/{id}` - Get lesson details
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/{id}` - Update lesson
- `DELETE /api/lessons/{id}` - Delete lesson
- `GET /api/class-subjects/{id}/lessons` - Get lessons for class-subject
- `GET /api/students/{id}/lessons` - Get student's lessons (today, upcoming)
- `GET /api/teachers/{id}/lessons` - Get teacher's lessons

### Attendance
- `GET /api/lessons/{id}/attendance` - Get attendance for lesson
- `POST /api/lessons/{id}/attendance` - Mark attendance
- `PUT /api/attendance/{id}` - Update attendance record
- `GET /api/students/{id}/attendance` - Get student attendance history

### Assessment & Grades
- `GET /api/class-subjects/{id}/assessments` - Get assessments for class-subject
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/{id}/grades` - Enter grades
- `GET /api/students/{id}/grades` - Get student grades across all subjects

### Student Dashboard
- `GET /api/students/{id}/dashboard` - Get dashboard data (timetable, upcoming lessons, assignments)
- `GET /api/students/{id}/timetable` - Get weekly timetable
- `GET /api/students/{id}/subjects` - Get all subjects for student

### Teacher Dashboard
- `GET /api/teachers/{id}/dashboard` - Get teacher dashboard
- `GET /api/teachers/{id}/classes` - Get all classes teacher teaches
- `GET /api/teachers/{id}/timetable` - Get teacher's timetable

---

## Frontend Navigation Structure

### Primary Navigation (Subject-Based)
- **Dashboard** (role-specific)
- **My Subjects** (for students/teachers)
- **Timetable** (weekly view)
- **Classes** (for teachers/admin)
- **Lessons** (upcoming, past)
- **Assessments** (tests, SBAs)
- **Grades** (progress tracking)
- **Announcements** (Form/Class/Subject level)

### Student Dashboard
```
Today's Timetable
├── Period 1: Math (Room 101) - 8:00 AM
├── Period 2: English (Room 205) - 9:00 AM
└── Period 3: Science (Lab 1) - 10:30 AM

Upcoming Lessons
├── Tomorrow: History, Geography
└── This Week: 12 lessons across 6 subjects

Assignments Due
├── Math Homework (Due: Tomorrow)
├── Science Project (Due: Next Week)
└── English Essay (Due: Friday)

My Subjects (Current Form)
├── Mathematics
├── English Language
├── Integrated Science
├── History
├── Geography
└── Religious Education
```

### Teacher Dashboard
```
My Classes
├── Form 3A - Mathematics (28 students)
├── Form 3B - Mathematics (30 students)
├── Form 4Science - Mathematics (25 students)
└── Form 5 - Additional Mathematics (20 students)

Today's Lessons
├── 8:00 AM - Form 3A Math (Room 101)
├── 10:30 AM - Form 4Science Math (Lab 2)
└── 2:00 PM - Form 3B Math (Room 101)

Upcoming Assessments
├── Form 3A - Test 1 (Due: Friday)
└── Form 4Science - SBA Component 1 (Due: Next Month)
```

---

## Implementation Phases

### Phase 1: Core Database & Models ✅ (Current)
- [x] Design schema
- [ ] Create entity models (Java)
- [ ] Create repositories
- [ ] Database migration scripts

### Phase 2: Backend Services
- [ ] Form service
- [ ] Class service
- [ ] Subject service
- [ ] Lesson service
- [ ] Attendance service
- [ ] Assessment service

### Phase 3: REST API
- [ ] Form controllers
- [ ] Class controllers
- [ ] Subject controllers
- [ ] Lesson controllers
- [ ] Dashboard controllers

### Phase 4: Frontend Redesign
- [ ] New navigation structure
- [ ] Student dashboard (timetable view)
- [ ] Teacher dashboard (class view)
- [ ] Subject pages
- [ ] Lesson pages
- [ ] Timetable component

### Phase 5: Migration
- [ ] Data migration scripts (Course → Subject/Lesson)
- [ ] Enrollment migration (Course → Class assignment)
- [ ] Content migration

### Phase 6: Advanced Features
- [ ] Timetable integration
- [ ] Bulk promotion (Form progression)
- [ ] CXC/SBA management
- [ ] Parent portal
- [ ] Reporting system

---

## Migration Strategy

### From Course to Subject
1. Map each Course to a Subject
2. Extract Course Content → Lesson Content
3. Map Course Enrollments → Class Assignments
4. Preserve historical data

### Step-by-Step Migration
```sql
-- 1. Create subjects from existing courses
INSERT INTO subjects (subject_name, subject_code, school_id)
SELECT DISTINCT title, code, institution_id FROM courses;

-- 2. Map courses to subject offerings
-- 3. Create classes and assign students
-- 4. Migrate content to lessons
-- 5. Update assessment records
```

---

## Next Steps

1. **Review this architecture** - Confirm structure aligns with requirements
2. **Implement database schema** - Create migration scripts
3. **Build entity models** - Java JPA entities
4. **Create services layer** - Business logic
5. **Develop API endpoints** - REST controllers
6. **Redesign frontend** - New navigation and views
7. **Migration tools** - Convert existing data

---

## Success Metrics

- ✅ Students see all subjects in their Form/Class
- ✅ Teachers manage multiple classes per subject efficiently
- ✅ Lessons align with timetable
- ✅ Assessment tracking supports CXC structure
- ✅ Administrative tasks simplified (bulk operations)
- ✅ Mobile-responsive design
- ✅ Low-bandwidth optimization


