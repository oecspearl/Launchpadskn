# LaunchPad SKN - Detailed LMS Structure Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Frontend Structure](#frontend-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Flow](#data-flow)
7. [Key Features by Role](#key-features-by-role)
8. [Caribbean Education Adaptations](#caribbean-education-adaptations)
9. [Deployment Architecture](#deployment-architecture)
10. [Technology Stack](#technology-stack)

---

## System Overview

**LaunchPad SKN** is a Learning Management System (LMS) specifically designed for Caribbean secondary schools. Unlike generic LMS platforms that use a flat "course" model, LaunchPad SKN implements a hierarchical structure that reflects how Caribbean secondary schools actually organize teaching and learning: **School → Form → Class → Subject → Lesson**.

### Key Differentiators

1. **Hierarchical Organization**: Reflects the actual structure of Caribbean secondary schools (Forms 1-7, Classes, Subjects)
2. **Subject-Based Learning**: Students see all subjects in their class/form, not scattered across separate "courses"
3. **CXC Integration**: Built-in support for CSEC/CAPE examination structures, School-Based Assessments (SBAs), and Caribbean grading systems
4. **Class Management**: Fixed class rosters (25-35 students) with form tutors and class-specific communications
5. **Timetable Integration**: Lessons are linked to specific dates, times, and locations

### Current Status

- **Backend**: Fully migrated from Java microservices to Supabase (Backend-as-a-Service)
- **Frontend**: React.js Single Page Application (SPA)
- **Database**: PostgreSQL (hosted on Supabase)
- **Deployment**: Heroku (production), localhost (development)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend (SPA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Components  │  │  Services    │  │  Contexts    │      │
│  │  (UI/Views)  │→ │ (API Calls)  │→ │ (State Mgmt) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Database   │  │   Storage   │      │
│  │ (JWT/Session)│  │  (PostgreSQL)│  │   (Files)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Supabase)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Hierarchical Tables: Forms, Classes, Subjects,      │   │
│  │  Lessons, Assessments, Grades, Attendance, etc.        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The system follows a **component-based architecture** with clear separation of concerns:

1. **Presentation Layer**: React components (UI)
2. **Business Logic Layer**: Service classes (`supabaseService.js`, `authServiceSupabase.js`)
3. **State Management Layer**: React Context API (`AuthContextSupabase.js`)
4. **Data Layer**: Supabase client (`supabase.js`)
5. **Database Layer**: PostgreSQL with Row-Level Security

---

## Database Schema

### Hierarchical Structure

The database implements a **strictly hierarchical structure** that mirrors Caribbean secondary school organization:

```
School (Institution)
  │
  ├── Forms (Year Groups: Forms 1-7)
  │     │
  │     ├── Classes (Homerooms/Streams: e.g., 3A, 3B, 3C)
  │     │     │
  │     │     ├── Student Class Assignments
  │     │     │     └── Students (25-35 per class)
  │     │     │
  │     │     └── Class-Subject Assignments
  │     │           │
  │     │           ├── Subjects (Academic Disciplines)
  │     │           │     │
  │     │           │     ├── Subject Form Offerings
  │     │           │     │     └── Curriculum Framework (CXC/CSEC/CAPE)
  │     │           │     │
  │     │           │     └── Subject Teacher Assignment
  │     │           │
  │     │           └── Lessons (Individual Sessions)
  │     │                 │
  │     │                 ├── Lesson Content (Files, Links, Videos)
  │     │                 ├── Lesson Attendance
  │     │                 └── Homework/Assignments
  │     │
  │     └── Subject Form Offerings
  │           └── Which subjects are taught in which forms
  │
  └── Subjects (Catalog)
        └── Subject metadata (name, code, CXC code, description)
```

### Core Tables

#### 1. **Institutions** (Schools)
- `institution_id` (Primary Key)
- `name`, `location`, `contact`, `phone`, `website`
- `established_year`, `institution_type`
- Stores school-level information

#### 2. **Forms** (Year Groups)
- `form_id` (Primary Key)
- `school_id` (Foreign Key → Institutions)
- `form_number` (1, 2, 3, 4, 5, 6, 7)
- `form_name` ("Form 3", "Form 4", "Lower Sixth")
- `academic_year` ("2024-2025")
- `coordinator_id` (Foreign Key → Users) - Form Coordinator/Year Head
- Unique constraint: `(school_id, form_number, academic_year)`

**Purpose**: Represents year groups (Forms 1-7) within a school.

#### 3. **Classes** (Homerooms/Streams)
- `class_id` (Primary Key)
- `form_id` (Foreign Key → Forms)
- `class_name` ("3A", "3B", "4Science", "5Arts")
- `class_code` ("F3A", "F4SCI", "F5ART") - Unique identifier
- `academic_year` (matches form's academic year)
- `capacity` (default: 35 students)
- `current_enrollment` (tracked count)
- `form_tutor_id` (Foreign Key → Users) - Class Teacher/Form Tutor
- `room_number`, `description`
- Unique constraint: `(form_id, class_name, academic_year)`

**Purpose**: Represents individual homeroom classes within a form (e.g., Form 3 has classes 3A, 3B, 3C).

#### 4. **Subjects** (Academic Disciplines)
- `subject_id` (Primary Key)
- `school_id` (Foreign Key → Institutions)
- `subject_name` ("Mathematics", "English Language")
- `subject_code` ("MATH", "ENG") - Unique identifier
- `cxc_code` ("0502" for CSEC Math) - CXC examination code
- `description`, `department_id`
- `is_active`

**Purpose**: Catalog of all subjects taught at the school (independent of forms/classes).

#### 5. **Subject Form Offerings**
- `offering_id` (Primary Key)
- `subject_id` (Foreign Key → Subjects)
- `form_id` (Foreign Key → Forms)
- `curriculum_framework` (Link to CXC/CSEC/CAPE standards)
- `learning_outcomes`
- `weekly_periods` (Number of lessons per week, default: 5)
- `is_compulsory` (Boolean)
- Unique constraint: `(subject_id, form_id)`

**Purpose**: Defines which subjects are offered in which forms (e.g., Form 3 Math, Form 5 Math are different offerings).

#### 6. **Class Subjects** (Junction Table)
- `class_subject_id` (Primary Key)
- `class_id` (Foreign Key → Classes)
- `subject_offering_id` (Foreign Key → Subject Form Offerings)
- `teacher_id` (Foreign Key → Users) - Subject teacher for this specific class
- `room_preference`
- Unique constraint: `(class_id, subject_offering_id)`

**Purpose**: Links classes to subjects and assigns teachers (e.g., Form 3A takes Math, taught by Teacher X).

#### 7. **Lessons** (Individual Sessions)
- `lesson_id` (Primary Key)
- `class_subject_id` (Foreign Key → Class Subjects)
- `lesson_title`
- `lesson_date` (DATE)
- `start_time`, `end_time` (TIME)
- `location` (Room number)
- `lesson_number` (Sequence within topic/unit)
- `topic`, `learning_objectives`
- `lesson_plan` (TEXT)
- `homework_description`, `homework_due_date`
- `status` ("SCHEDULED", "COMPLETED", "CANCELLED", "ABSENT")
- `attendance_taken` (Boolean)
- `created_by` (Foreign Key → Users)

**Purpose**: Individual instructional sessions (35-45 minute periods) with timetable information.

#### 8. **Lesson Content**
- `content_id` (Primary Key)
- `lesson_id` (Foreign Key → Lessons)
- `content_type` ("FILE", "LINK", "VIDEO", "DOCUMENT", "IMAGE")
- `title`, `url`, `file_path`, `file_name`, `file_size`, `mime_type`
- `upload_date`, `uploaded_by`

**Purpose**: Files, links, and materials attached to lessons (stored in Supabase Storage).

#### 9. **Student Class Assignments**
- `assignment_id` (Primary Key)
- `student_id` (Foreign Key → Users)
- `class_id` (Foreign Key → Classes)
- `academic_year`
- `assignment_date`, `is_active`
- `notes`
- Unique constraint: `(student_id, class_id, academic_year)`

**Purpose**: Enrolls students in classes (replaces old "course enrollment" model). A student is assigned to ONE class per academic year.

#### 10. **Lesson Attendance**
- `attendance_id` (Primary Key)
- `lesson_id` (Foreign Key → Lessons)
- `student_id` (Foreign Key → Users)
- `status` ("PRESENT", "ABSENT", "LATE", "EXCUSED", "SICK")
- `marked_by` (Foreign Key → Users)
- `marked_at` (TIMESTAMP)
- `notes`
- Unique constraint: `(lesson_id, student_id)`

**Purpose**: Tracks attendance for each lesson (not just per day, but per lesson).

#### 11. **Subject Assessments**
- `assessment_id` (Primary Key)
- `class_subject_id` (Foreign Key → Class Subjects)
- `assessment_type` ("TEST", "QUIZ", "SBA", "PROJECT", "MOCK_EXAM", "EXAM")
- `assessment_name`, `description`
- `total_marks`, `weight` (Percentage of final grade)
- `due_date`, `assessment_date`
- `term` (1, 2, or 3)
- `academic_year`
- `is_sba_component` (Boolean) - For CXC School-Based Assessment
- `sba_component_number` - For multi-component SBAs
- `created_by` (Foreign Key → Users)

**Purpose**: Tests, quizzes, SBAs, projects, and examinations for subjects (supports Caribbean assessment structure).

#### 12. **Student Grades**
- `grade_id` (Primary Key)
- `assessment_id` (Foreign Key → Subject Assessments)
- `student_id` (Foreign Key → Users)
- `marks_obtained`, `percentage`
- `grade_letter` ("A", "B", "C", "D", "F" or "1", "2", "3", "4", "5" for CXC)
- `is_excused`
- `graded_by` (Foreign Key → Users)
- `graded_at`, `comments`
- Unique constraint: `(assessment_id, student_id)`

**Purpose**: Grades for assessments (supports both letter grades and CXC numeric grades).

#### 13. **Form Announcements**
- `announcement_id` (Primary Key)
- `form_id` (Foreign Key → Forms)
- `title`, `content`
- `posted_by` (Foreign Key → Users)
- `priority` ("HIGH", "NORMAL", "LOW")
- `expiry_date`, `created_at`

**Purpose**: Form-level announcements (visible to all students in a form).

#### 14. **Class Announcements**
- `announcement_id` (Primary Key)
- `class_id` (Foreign Key → Classes)
- `title`, `content`
- `posted_by` (Foreign Key → Users)
- `priority`, `expiry_date`, `created_at`

**Purpose**: Class-specific announcements (visible only to students in that class).

### Database Views

Two database views simplify common queries:

#### 1. **student_class_subjects_view**
Combines student class assignments with their subjects and teachers:
```sql
SELECT 
    student_id, class_id, class_name, class_code,
    form_number, form_name,
    subject_id, subject_name, subject_code,
    class_subject_id, teacher_id, teacher_name
FROM student_class_assignments
JOIN classes, forms, class_subjects, subject_form_offerings, subjects, users
WHERE is_active = true
```

#### 2. **teacher_class_subjects_view**
Shows all classes and subjects a teacher is assigned to:
```sql
SELECT 
    teacher_id, teacher_name,
    class_id, class_name, class_code,
    form_id, form_number, form_name,
    subject_id, subject_name, subject_code,
    class_subject_id
FROM class_subjects
JOIN classes, forms, subject_form_offerings, subjects, users
WHERE teacher_id IS NOT NULL
```

### Key Database Relationships

| Relationship | Type | Notes |
|-------------|------|-------|
| Institution → Forms | 1:M | One school has many forms |
| Institution → Subjects | 1:M | One school has many subjects (catalog) |
| Form → Classes | 1:M | One form has many classes |
| Form → Subject Offerings | 1:M | One form offers many subjects |
| Class → Student Assignments | 1:M | One class has many students |
| Subject → Subject Offerings | 1:M | One subject can be offered in multiple forms |
| Subject Offering → Class Subjects | 1:M | One offering can be assigned to multiple classes |
| Class Subject → Lessons | 1:M | One class-subject has many lessons |
| Lesson → Attendance | 1:M | One lesson has many attendance records |
| Class Subject → Assessments | 1:M | One class-subject has many assessments |
| Assessment → Grades | 1:M | One assessment has many student grades |

---

## Frontend Structure

### Directory Structure

```
frontend/src/
├── components/           # React components
│   ├── Admin/           # Admin-only components
│   │   ├── AdminDashboard.js
│   │   ├── FormManagement.js
│   │   ├── ClassManagement.js
│   │   ├── SubjectManagement.js
│   │   ├── StudentAssignment.js
│   │   ├── ClassSubjectAssignment.js
│   │   └── ... (legacy components with deprecation warnings)
│   ├── Teacher/         # Teacher/Instructor components
│   │   ├── TeacherDashboard.js
│   │   ├── LessonPlanning.js
│   │   ├── AttendanceMarking.js
│   │   ├── GradeEntry.js
│   │   └── TeacherLessonView.js
│   ├── Student/         # Student components
│   │   ├── StudentDashboard.js
│   │   ├── SubjectView.js
│   │   ├── LessonView.js
│   │   └── ... (legacy components)
│   ├── Auth/           # Authentication components
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── PrivateRoute.js
│   │   └── ChangePassword.js
│   └── common/         # Shared components
│       ├── Navbar.js
│       ├── Timetable.js
│       ├── Profile.js
│       ├── ErrorBoundary.js
│       └── FlagLogo.js (Saint Kitts and Nevis flag)
├── services/           # API service layer
│   ├── supabaseService.js      # Main Supabase service (CRUD operations)
│   ├── authServiceSupabase.js  # Authentication service
│   └── ... (legacy services - deprecated)
├── contexts/          # React Context API
│   ├── AuthContextSupabase.js  # Authentication state management
│   └── NotificationContext.js
├── config/           # Configuration
│   └── supabase.js   # Supabase client initialization
├── styles/           # Global styles
│   └── colors.css    # Saint Kitts and Nevis color scheme
└── App.js            # Main application component (routing)
```

### Component Organization

#### **Admin Components** (`components/Admin/`)

1. **AdminDashboard.js**
   - Main admin dashboard with statistics
   - Quick access cards to management pages
   - Recent activity feed
   - Navigation tabs (Overview, Institutions, Students, Instructors, Courses, Reports)

2. **FormManagement.js**
   - CRUD operations for Forms (year groups)
   - Assign form coordinators
   - View form statistics

3. **ClassManagement.js**
   - CRUD operations for Classes within Forms
   - Assign form tutors
   - Track enrollment

4. **SubjectManagement.js**
   - Manage subject catalog
   - Create subject form offerings
   - CXC code management

5. **StudentAssignment.js**
   - Assign students to classes
   - Bulk assignment operations
   - View class rosters

6. **ClassSubjectAssignment.js**
   - Assign subjects to classes
   - Assign teachers to class-subject combinations
   - View subject assignments

#### **Teacher Components** (`components/Teacher/`)

1. **TeacherDashboard.js**
   - List of classes the teacher teaches
   - Today's lessons (timetable)
   - Weekly timetable view
   - Upcoming assessments
   - Quick actions

2. **LessonPlanning.js**
   - Create, edit, delete lessons
   - Lesson objectives, plans, homework
   - Schedule lessons (date, time, location)

3. **AttendanceMarking.js**
   - Mark attendance for a lesson (Present/Absent/Late/Excused)
   - Add notes
   - View attendance statistics

4. **GradeEntry.js**
   - Enter individual and bulk grades
   - Auto-calculate percentages
   - Support Caribbean grading systems

5. **TeacherLessonView.js**
   - View lesson details
   - Quick actions (mark attendance, view students)

#### **Student Components** (`components/Student/`)

1. **StudentDashboard.js**
   - Today's timetable (lessons for today)
   - Weekly timetable view
   - My subjects list
   - Upcoming assignments
   - Recent grades
   - Announcements

2. **SubjectView.js**
   - Subject details
   - Lessons for the subject
   - Assignments/assessments
   - Grades for the subject

3. **LessonView.js**
   - Lesson details
   - Lesson content (files, links)
   - Homework
   - Attendance status

#### **Common Components** (`components/common/`)

1. **Timetable.js**
   - Reusable weekly timetable component
   - Grid layout (time slots × days of week)
   - Displays lessons with subject, time, location

2. **Navbar.js**
   - Navigation bar with role-specific links
   - User profile dropdown
   - Logout functionality

3. **ErrorBoundary.js**
   - Catches React rendering errors
   - Displays fallback UI
   - Prevents blank page crashes

4. **FlagLogo.js**
   - CSS-based Saint Kitts and Nevis flag logo
   - Used in navbar and branding

### Routing Structure

The application uses **React Router** for client-side routing:

#### **Public Routes**
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password recovery
- `/reset-password` - Password reset

#### **Protected Routes (Admin)**
- `/admin/dashboard` - Admin dashboard
- `/admin/forms` - Form management
- `/admin/classes` - Class management
- `/admin/subjects` - Subject management
- `/admin/student-assignment` - Student assignment to classes
- `/admin/class-subject-assignment` - Subject assignment to classes
- `/admin/courses` - Legacy course management (deprecated)
- `/admin/instructors` - Instructor management
- `/admin/institutions` - Institution management

#### **Protected Routes (Teacher/Instructor)**
- `/teacher/dashboard` - Teacher dashboard
- `/teacher/classes/:classId` - Class details
- `/teacher/lessons/:lessonId` - Lesson details
- `/teacher/class-subjects/:classSubjectId/lessons` - Lessons for a class-subject
- `/teacher/lessons/:lessonId/attendance` - Mark attendance
- `/teacher/assessments/:assessmentId/grades` - Enter grades

#### **Protected Routes (Student)**
- `/student/dashboard` - Student dashboard
- `/student/subjects` - List of subjects
- `/student/subjects/:classSubjectId` - Subject details
- `/student/lessons/:lessonId` - Lesson details

#### **Legacy Routes (Deprecated)**
- `/courses/:courseId` - Course details (shows deprecation warning)
- `/student/courses/register` - Course registration (shows deprecation warning)

### State Management

The application uses **React Context API** for global state management:

#### **AuthContextSupabase.js**
Manages authentication state:
- `user` - Current authenticated user object
- `isAuthenticated` - Boolean authentication status
- `isLoading` - Loading state during auth checks
- Functions: `login()`, `logout()`, `register()`, `loadUserProfile()`

**State Flow**:
1. Component calls `login(email, password)`
2. `AuthContext` calls `authServiceSupabase.login()`
3. Supabase Auth authenticates and returns session
4. `AuthContext` loads user profile from `users` table
5. State updated: `isAuthenticated = true`, `user = profile`
6. Components re-render with authenticated state

---

## Authentication & Authorization

### Authentication Flow

1. **User Login**
   ```
   User enters email/password
     ↓
   Login.js calls AuthContext.login()
     ↓
   AuthContext calls authServiceSupabase.login()
     ↓
   Supabase Auth signs in → returns session
     ↓
   AuthContext.loadUserProfile() fetches user from users table
     ↓
   User state set → isAuthenticated = true
     ↓
   Redirect to role-specific dashboard
   ```

2. **Session Management**
   - Sessions stored in Supabase Auth (JWT tokens)
   - Tokens automatically refreshed by Supabase client
   - Session persisted in browser (localStorage/sessionStorage)
   - Auth state listener (`onAuthStateChange`) updates on sign-in/sign-out

3. **User Profile Loading**
   - Profile fetched from `users` table using UUID from Supabase Auth
   - If profile not found, creates minimal profile from auth session
   - Role normalized to uppercase (`ADMIN`, `INSTRUCTOR`, `STUDENT`)
   - Special handling: Emails containing "admin" default to `ADMIN` role

### Authorization

#### **Role-Based Access Control (RBAC)**

Three roles with distinct permissions:

1. **ADMIN**
   - Full system access
   - Manage forms, classes, subjects, students
   - Assign students to classes
   - Assign teachers to class-subjects
   - View all reports and analytics

2. **INSTRUCTOR** (Teacher)
   - View assigned classes
   - Create/edit/delete lessons
   - Mark attendance
   - Enter grades
   - Upload lesson materials

3. **STUDENT**
   - View own class and subjects
   - View timetable
   - Access lesson content
   - View grades and assessments
   - Submit assignments (future feature)

#### **Route Protection**

Routes are protected using `PrivateRoute` component:

```javascript
<PrivateRoute allowedRoles={['admin']}>
  <AdminDashboard />
</PrivateRoute>
```

**Protection Logic**:
1. Check if user is authenticated
2. Check if user's role is in `allowedRoles`
3. If not authenticated → redirect to `/login`
4. If wrong role → redirect to appropriate dashboard
5. If authorized → render component

#### **Database-Level Security**

Supabase **Row-Level Security (RLS)** policies ensure:
- Users can only access their own data
- Teachers can only access their assigned classes
- Students can only access their own grades and attendance

---

## Data Flow

### Example: Student Views Timetable

1. **User Action**: Student navigates to `/student/dashboard`

2. **Component Load**: `StudentDashboard.js` mounts

3. **Data Fetching**:
   ```javascript
   useEffect(() => {
     fetchStudentData();
   }, [user]);
   
   const fetchStudentData = async () => {
     // 1. Get student's class assignment
     const classAssignment = await supabaseService.getStudentClassAssignment(userId);
     
     // 2. Get subjects for that class
     const subjects = await supabaseService.getSubjectsByClass(classId);
     
     // 3. Get lessons for current week
     const lessons = await supabaseService.getLessonsByStudent(userId, week);
     
     // 4. Get upcoming assignments
     const assignments = await supabaseService.getUpcomingAssignments(classId);
   };
   ```

4. **Service Layer**: `supabaseService.js` builds SQL queries:
   ```javascript
   async getStudentClassAssignment(studentId) {
     const { data, error } = await supabase
       .from('student_class_assignments')
       .select('*, classes(*, forms(*))')
       .eq('student_id', studentId)
       .eq('is_active', true)
       .single();
     return data;
   }
   ```

5. **Supabase Client**: Sends query to Supabase API

6. **Database**: PostgreSQL executes query with RLS checks

7. **Response**: Data returned to service → component → UI renders

### Example: Teacher Creates Lesson

1. **User Action**: Teacher navigates to `/teacher/class-subjects/:classSubjectId/lessons` and clicks "Create Lesson"

2. **Component**: `LessonPlanning.js` opens create modal

3. **Form Submission**: Teacher fills form (title, date, time, objectives, homework)

4. **Data Sending**:
   ```javascript
   const handleSubmit = async (formData) => {
     const lessonData = {
       class_subject_id: classSubjectId,
       lesson_title: formData.title,
       lesson_date: formData.date,
       start_time: formData.startTime,
       end_time: formData.endTime,
       learning_objectives: formData.objectives,
       homework_description: formData.homework,
       created_by: user.userId
     };
     
     await supabaseService.createLesson(lessonData);
   };
   ```

5. **Service Layer**: `supabaseService.js` inserts into database:
   ```javascript
   async createLesson(lessonData) {
     const { data, error } = await supabase
       .from('lessons')
       .insert(lessonData)
       .select()
       .single();
     return data;
   }
   ```

6. **Database**: Insert into `lessons` table

7. **Response**: Lesson created → component refreshes list → UI updates

---

## Key Features by Role

### Admin Features

1. **Form Management**
   - Create/update/delete forms (Forms 1-7)
   - Assign form coordinators
   - Set academic year

2. **Class Management**
   - Create classes within forms (3A, 3B, etc.)
   - Assign form tutors
   - Set capacity and track enrollment

3. **Subject Management**
   - Manage subject catalog
   - Create subject form offerings
   - Add CXC codes

4. **Student Assignment**
   - Assign students to classes
   - Bulk assignment operations
   - View class rosters

5. **Class-Subject Assignment**
   - Assign subjects to classes
   - Assign teachers to class-subject combinations

6. **Dashboard**
   - System statistics (users, subjects, classes, forms)
   - Recent activity feed
   - Quick access to management pages

### Teacher Features

1. **Dashboard**
   - View all assigned classes
   - Today's lessons (timetable)
   - Weekly timetable
   - Upcoming assessments

2. **Lesson Planning**
   - Create/edit/delete lessons
   - Set learning objectives
   - Add homework
   - Schedule lessons (date, time, location)

3. **Attendance Marking**
   - Mark attendance per lesson (Present/Absent/Late/Excused)
   - Add notes
   - View attendance statistics

4. **Grade Entry**
   - Enter individual grades
   - Bulk grade entry
   - Auto-calculate percentages
   - Support Caribbean grading (A-F or 1-5 for CXC)

5. **Content Management**
   - Upload files to lessons
   - Link external resources
   - Organize by class-subject

### Student Features

1. **Dashboard**
   - Today's timetable (lessons for today)
   - Weekly timetable view
   - List of subjects
   - Upcoming assignments
   - Recent grades

2. **Subject View**
   - View all subjects in their class
   - Access subject details
   - View lessons for each subject

3. **Lesson View**
   - Lesson details (objectives, plan)
   - Download lesson content (files)
   - View homework assignments
   - Check attendance status

4. **Grades & Assessments**
   - View grades across all subjects
   - See upcoming assessments
   - Track progress

---

## Caribbean Education Adaptations

### 1. **Form Structure (Forms 1-7)**
- Reflects Caribbean secondary school year groups
- Supports forms 1-7 (some schools use different numbering)
- Form coordinators/year heads with oversight

### 2. **Class System (Homerooms)**
- Fixed class rosters (25-35 students)
- Class names: "3A", "3B", "4Science", "5Arts"
- Form tutors for pastoral care
- Class-specific announcements

### 3. **CXC Integration**
- **CXC Codes**: Subject codes for CSEC/CAPE (e.g., "0502" for Mathematics)
- **SBA Support**: School-Based Assessment components tracked separately
- **Grading**: Supports both letter grades (A-F) and CXC numeric grades (1-5)
- **Term-Based**: Assessments organized by terms (1, 2, 3)

### 4. **Subject Offerings by Form**
- Same subject can be taught in multiple forms (Form 3 Math ≠ Form 5 Math)
- Different curriculum frameworks per form
- Weekly periods tracked per form-subject

### 5. **Assessment Structure**
- Supports: Tests, Quizzes, SBAs, Projects, Mock Exams, Final Exams
- SBA components tracked separately (for Forms 4-5 preparing for CSEC)
- Term-based reporting (3 terms per academic year)

### 6. **Timetable Integration**
- Lessons linked to specific dates, times, and locations
- Weekly timetable view
- Support for split sessions (morning/afternoon shifts)

### 7. **Cultural Branding**
- Saint Kitts and Nevis flag logo (CSS-based)
- Color scheme matching the flag
- Application name: "LaunchPad SKN"

---

## Deployment Architecture

### Production Deployment (Heroku)

```
┌─────────────────────────────────────────────────────────┐
│                    Heroku Platform                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Node.js Buildpack                         │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  React Build Process                        │  │   │
│  │  │  - npm install                              │  │   │
│  │  │  - npm run build (creates /build directory) │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  Static File Server (serve package)        │  │   │
│  │  │  - Serves /build directory                 │  │   │
│  │  │  - Port: $PORT (dynamically assigned)     │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase (Cloud)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Auth      │  │   Database   │  │   Storage   │ │
│  │              │  │  (PostgreSQL)│  │   (S3-like)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables

**Heroku Config Vars**:
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_DB_PASSWORD` - Database password (not used by frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

**Build Process**:
1. Heroku detects `package.json` in root → uses Node.js buildpack
2. Runs `heroku-postbuild` script: `cd frontend && npm install && npm run build`
3. Creates optimized production build in `frontend/build/`
4. Serves static files using `serve` package on dynamic port

### Development Deployment (Localhost)

```
┌─────────────────────────────────────────────────────────┐
│              Local Development                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Development Server                        │   │
│  │  - Port: 3000 (or configured)                   │   │
│  │  - Hot reload enabled                           │   │
│  │  - Source maps for debugging                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase (Cloud)                         │
│  (Same as production)                                    │
└─────────────────────────────────────────────────────────┘
```

**Development Setup**:
1. Install dependencies: `cd frontend && npm install`
2. Start dev server: `npm start`
3. Application runs on `http://localhost:3000`
4. Environment variables in `.env` file (not committed to git)

---

## Technology Stack

### Frontend
- **React 19.0.0** - UI library
- **React Router 7.3.0** - Client-side routing
- **React Bootstrap 2.10.9** - UI components
- **Bootstrap 5.3.3** - CSS framework
- **React Icons 5.5.0** - Icon library
- **Axios 1.8.2** - HTTP client (legacy, mostly replaced)
- **date-fns 4.1.0** - Date formatting

### Backend Services
- **Supabase** - Backend-as-a-Service (BaaS)
  - **Supabase Auth** - Authentication (JWT, sessions)
  - **Supabase Database** - PostgreSQL database
  - **Supabase Storage** - File storage (S3-like)
  - **Supabase Realtime** - Real-time subscriptions (future use)

### Database
- **PostgreSQL** (hosted on Supabase)
  - Row-Level Security (RLS)
  - Foreign key constraints
  - Indexes for performance
  - Database views for common queries

### Deployment
- **Heroku** - Production hosting
  - Node.js buildpack
  - Static file serving
  - Environment variable management
- **Supabase Cloud** - Database and auth hosting

### Development Tools
- **npm** - Package manager
- **React Scripts** - Build tooling (Create React App)
- **ESLint** - Code linting
- **Git** - Version control

### Legacy (Deprecated)
- **Java Spring Boot** - Old microservices backend (removed)
- **Eureka** - Service discovery (removed)
- **API Gateway** - Old routing (replaced by Supabase)

---

## Summary

LaunchPad SKN is a **hierarchical, subject-based LMS** specifically designed for Caribbean secondary schools. It replaces the generic "course" model with a structure that reflects how schools actually operate: students progress through Forms, belong to Classes, study multiple Subjects simultaneously, and attend individual Lessons.

The system is **fully cloud-hosted** (React frontend on Heroku, PostgreSQL database on Supabase), making it easy to deploy and scale. All components have been migrated from the old Java microservices architecture to a modern React + Supabase stack, providing better performance, easier maintenance, and lower operational costs.

Key strengths:
- ✅ Reflects Caribbean school organization
- ✅ Supports CXC/CSEC/CAPE standards
- ✅ Subject-based (not course-based) navigation
- ✅ Timetable integration
- ✅ Mobile-responsive design
- ✅ Cloud-hosted (no server management)
- ✅ Secure (Row-Level Security)
- ✅ Scalable (Supabase infrastructure)

This architecture provides a solid foundation for Caribbean secondary schools to manage teaching, learning, and administrative tasks efficiently.

