# LaunchPad SKN - Complete Application Build Prompt for AI Agent

## 🎯 Project Overview

Build **LaunchPad SKN**, a comprehensive Learning Management System (LMS) specifically designed for Caribbean secondary schools. Unlike generic LMS platforms, this system implements a hierarchical structure that reflects how Caribbean secondary schools organize teaching and learning: **School → Form → Class → Subject → Lesson**.

### Key Differentiators
1. **Hierarchical Organization**: Reflects actual Caribbean secondary school structure (Forms 1-7, Classes, Subjects)
2. **Subject-Based Learning**: Students see all subjects in their class/form, not scattered across separate "courses"
3. **CXC Integration**: Built-in support for CSEC/CAPE examination structures, School-Based Assessments (SBAs), and Caribbean grading systems
4. **Class Management**: Fixed class rosters (25-35 students) with form tutors and class-specific communications
5. **Timetable Integration**: Lessons are linked to specific dates, times, and locations

### Current Architecture Status
- **Backend**: Fully migrated to Supabase (Backend-as-a-Service) - NO Java microservices needed
- **Frontend**: React.js Single Page Application (SPA)
- **Database**: PostgreSQL (hosted on Supabase)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)
- **Deployment**: Heroku (production), localhost (development)

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                │
│  - React 19.0.0                                             │
│  - React Router 7.3.0                                       │
│  - Bootstrap 5.3.3 / React Bootstrap 2.10.9                │
│  - Supabase JS Client 2.78.0                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Supabase Backend-as-a-Service                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Auth (Authentication & Authorization)       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with RLS policies)             │  │
│  │  - institutions, users, departments                  │  │
│  │  - forms, classes, subjects                          │  │
│  │  - lessons, assessments, grades                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Storage (File uploads)                     │  │
│  │  - Course materials, assignments, submissions        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19.0.0
- React Router DOM 7.3.0
- React Bootstrap 2.10.9
- Bootstrap 5.3.3
- Supabase JS Client 2.78.0
- Axios 1.8.2 (legacy, can be removed)
- date-fns 4.1.0
- React Icons 5.5.0
- html2pdf.js 0.10.1

**Backend:**
- Supabase (Backend-as-a-Service)
  - Supabase Auth (JWT-based authentication)
  - PostgreSQL Database
  - Supabase Storage (file uploads)
  - Row-Level Security (RLS) policies

**Development Tools:**
- Node.js 18.x
- npm 9.x
- React Scripts 5.0.1

**Deployment:**
- Heroku (for production)
- Environment variables for configuration

---

## 📊 Database Schema

### Core Hierarchy Structure

The database follows this hierarchy: **Institution → Form → Class → Subject → Lesson**

### Prerequisite Tables

#### 1. Institutions Table
```sql
CREATE TABLE institutions (
    institution_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(255),
    contact VARCHAR(255),
    phone VARCHAR(255),
    website VARCHAR(255),
    established_year INTEGER,
    institution_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Users Table
```sql
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    id UUID UNIQUE, -- Supabase Auth UUID
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Hashed (if using legacy auth)
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'INSTRUCTOR', 'STUDENT'
    phone VARCHAR(255),
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    department_id BIGINT REFERENCES departments(department_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_first_login BOOLEAN DEFAULT true
);
```

#### 3. Departments Table
```sql
CREATE TABLE departments (
    department_id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT REFERENCES institutions(institution_id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    head_of_department VARCHAR(255),
    department_email VARCHAR(255),
    office_location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Core Hierarchy Tables

#### 4. Forms Table (Year Groups: Forms 1-7)
```sql
CREATE TABLE forms (
    form_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    form_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6, 7
    form_name VARCHAR(50) NOT NULL, -- "Form 3", "Form 4", "Lower Sixth"
    academic_year VARCHAR(20) NOT NULL, -- "2024-2025"
    coordinator_id BIGINT REFERENCES users(user_id), -- Form Coordinator/Year Head
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_form_per_school_year UNIQUE(school_id, form_number, academic_year)
);
```

#### 5. Classes Table (Homeroom/Stream: e.g., 3A, 3B, 3C)
```sql
CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL, -- "3A", "3B", "4Science", "5Arts"
    class_code VARCHAR(20) UNIQUE NOT NULL, -- "F3A", "F4SCI", "F5ART"
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 35,
    current_enrollment INTEGER DEFAULT 0,
    form_tutor_id BIGINT REFERENCES users(user_id), -- Class Teacher/Form Tutor
    room_number VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_per_form UNIQUE(form_id, class_name, academic_year)
);
```

#### 6. Subjects Table (Academic Disciplines)
```sql
CREATE TABLE subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES institutions(institution_id),
    subject_name VARCHAR(100) NOT NULL, -- "Mathematics", "English Language"
    subject_code VARCHAR(20) UNIQUE NOT NULL, -- "MATH", "ENG", "PHYS"
    description TEXT,
    cxc_code VARCHAR(20), -- CSEC/CAPE subject code (e.g., "0502" for Math)
    department_id BIGINT REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Subject Form Offerings Table
```sql
CREATE TABLE subject_form_offerings (
    offering_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    curriculum_framework TEXT, -- Link to CXC/CSEC/CAPE standards
    learning_outcomes TEXT,
    weekly_periods INTEGER DEFAULT 5, -- Number of lessons per week
    is_compulsory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_subject_form_offering UNIQUE(subject_id, form_id)
);
```

#### 8. Class Subjects Table (Junction: Which classes take which subjects)
```sql
CREATE TABLE class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_offering_id BIGINT NOT NULL REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES users(user_id), -- Subject teacher for this class
    room_preference VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_subject UNIQUE(class_id, subject_offering_id)
);
```

#### 9. Lessons Table (Individual Instructional Sessions)
```sql
CREATE TABLE lessons (
    lesson_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    lesson_title VARCHAR(200) NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100), -- Room number or location
    lesson_number INTEGER, -- Sequence within topic/unit
    topic VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    homework_description TEXT,
    homework_due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, ABSENT
    attendance_taken BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. Lesson Content Table
```sql
CREATE TABLE lesson_content (
    content_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- FILE, LINK, VIDEO, DOCUMENT, IMAGE
    title VARCHAR(200) NOT NULL,
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 11. Student Class Assignments Table
```sql
CREATE TABLE student_class_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id),
    class_id BIGINT NOT NULL REFERENCES classes(class_id),
    academic_year VARCHAR(20) NOT NULL,
    assignment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, academic_year)
);
```

#### 12. Lesson Attendance Table
```sql
CREATE TABLE lesson_attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, LATE, EXCUSED
    marked_by BIGINT REFERENCES users(user_id), -- Teacher who marked
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(lesson_id, student_id)
);
```

#### 13. Subject Assessments Table
```sql
CREATE TABLE subject_assessments (
    assessment_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50), -- TEST, QUIZ, SBA, PROJECT, MOCK_EXAM
    assessment_name VARCHAR(200) NOT NULL,
    total_marks DECIMAL(10,2),
    weight DECIMAL(5,2), -- Percentage of final grade
    due_date TIMESTAMP,
    term INTEGER, -- 1, 2, or 3
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 14. Student Grades Table
```sql
CREATE TABLE student_grades (
    grade_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES subject_assessments(assessment_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id),
    marks_obtained DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(5), -- A, B, C, etc.
    graded_by BIGINT REFERENCES users(user_id),
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    UNIQUE(assessment_id, student_id)
);
```

### Additional Tables

#### 15. Form Announcements Table
```sql
CREATE TABLE form_announcements (
    announcement_id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 16. Class Announcements Table
```sql
CREATE TABLE class_announcements (
    announcement_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Views

#### Student Class Subjects View
```sql
CREATE VIEW student_class_subjects_view AS
SELECT 
    sca.student_id,
    sca.class_id,
    c.class_name,
    c.class_code,
    cs.class_subject_id,
    s.subject_id,
    s.subject_name,
    s.subject_code,
    u.user_id as teacher_id,
    u.name as teacher_name
FROM student_class_assignments sca
JOIN classes c ON sca.class_id = c.class_id
JOIN class_subjects cs ON c.class_id = cs.class_id
JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
JOIN subjects s ON sfo.subject_id = s.subject_id
LEFT JOIN users u ON cs.teacher_id = u.user_id
WHERE sca.is_active = true AND c.is_active = true;
```

#### Teacher Class Subjects View
```sql
CREATE VIEW teacher_class_subjects_view AS
SELECT 
    cs.teacher_id,
    cs.class_subject_id,
    c.class_id,
    c.class_name,
    c.class_code,
    s.subject_id,
    s.subject_name,
    s.subject_code,
    f.form_id,
    f.form_name,
    f.form_number
FROM class_subjects cs
JOIN classes c ON cs.class_id = c.class_id
JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
JOIN subjects s ON sfo.subject_id = s.subject_id
JOIN forms f ON c.form_id = f.form_id
WHERE cs.teacher_id IS NOT NULL AND c.is_active = true;
```

### Database Indexes

Create indexes on all foreign keys and frequently queried columns:
- `forms`: school_id, coordinator_id, academic_year
- `classes`: form_id, form_tutor_id, class_code, academic_year
- `subjects`: school_id, department_id, subject_code
- `subject_form_offerings`: subject_id, form_id
- `class_subjects`: class_id, subject_offering_id, teacher_id
- `lessons`: class_subject_id, lesson_date, created_by, status
- `student_class_assignments`: student_id, class_id, academic_year
- `lesson_attendance`: lesson_id, student_id
- `subject_assessments`: class_subject_id, created_by
- `student_grades`: assessment_id, student_id

---

## 🎨 Frontend Structure

### Directory Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── FormManagement.js
│   │   │   ├── ClassManagement.js
│   │   │   ├── SubjectManagement.js
│   │   │   ├── StudentAssignment.js
│   │   │   ├── ClassSubjectAssignment.js
│   │   │   ├── StudentManagement.js
│   │   │   └── InstitutionManagement.js
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── PrivateRoute.js
│   │   │   ├── ChangePassword.js
│   │   │   ├── ForgotPassword.js
│   │   │   └── ResetPassword.js
│   │   ├── Student/
│   │   │   ├── StudentDashboard.js
│   │   │   ├── SubjectView.js
│   │   │   ├── LessonView.js
│   │   │   ├── ViewGrades.js
│   │   │   └── AssignmentSubmission.js
│   │   ├── Teacher/
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── TeacherClassManagement.js
│   │   │   ├── LessonPlanning.js
│   │   │   ├── AttendanceMarking.js
│   │   │   ├── GradeEntry.js
│   │   │   ├── Gradebook.js
│   │   │   └── LessonContentManager.js
│   │   └── common/
│   │       ├── Navbar.js
│   │       ├── Footer.js
│   │       ├── Timetable.js
│   │       ├── Breadcrumb.js
│   │       ├── FileUpload.js
│   │       └── NotificationToast.js
│   ├── contexts/
│   │   ├── AuthContextSupabase.js
│   │   └── NotificationContext.js
│   ├── services/
│   │   ├── supabaseService.js (Main service layer)
│   │   ├── authServiceSupabase.js
│   │   ├── adminServiceSupabase.js
│   │   └── (other service files)
│   ├── config/
│   │   └── supabase.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── colors.css
│   │   └── components.css
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── .env
```

### Key Frontend Components

#### 1. Authentication Context (`AuthContextSupabase.js`)
- Manages authentication state using Supabase Auth
- Provides `login()`, `logout()`, `register()`, `loadUserProfile()` functions
- Handles session management and user profile loading
- Exports `AuthProvider` component and `useAuth` hook

#### 2. Supabase Service Layer (`supabaseService.js`)
- Main service layer for all database operations
- Methods for:
  - Authentication (signIn, signUp, signOut, getSession)
  - Forms (getAllForms, createForm, updateForm, deleteForm)
  - Classes (getAllClasses, createClass, updateClass, getClassRoster)
  - Subjects (getAllSubjects, createSubject, getSubjectOfferings)
  - Lessons (getLessons, createLesson, updateLesson, deleteLesson)
  - Attendance (markAttendance, getAttendanceHistory)
  - Assessments (createAssessment, enterGrades, getStudentGrades)
  - User management (getUserProfile, updateUserProfile)

#### 3. Student Dashboard (`StudentDashboard.js`)
- Displays student's current form and class
- Shows all subjects for the student's class
- Displays today's lessons with timetable
- Shows upcoming assignments
- Quick stats (attendance, grades, assignments due)

#### 4. Teacher Dashboard (`TeacherDashboard.js`)
- Lists all classes the teacher teaches
- Shows today's lessons
- Displays upcoming assessments to grade
- Quick access to class management

#### 5. Admin Dashboard (`AdminDashboard.js`)
- System-wide statistics
- Quick access to:
  - Form management
  - Class management
  - Subject management
  - Student assignment
  - User management

#### 6. Timetable Component (`Timetable.js`)
- Weekly grid view of lessons
- Shows lessons by day and time
- Color-coded by subject
- Clickable lessons for details

### Routing Structure

```javascript
// Main routes in App.js
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />

// Protected routes (require authentication)
<Route element={<PrivateRoute />}>
  <Route path="/student/dashboard" element={<StudentDashboard />} />
  <Route path="/student/subjects/:classSubjectId" element={<SubjectView />} />
  <Route path="/student/lessons/:lessonId" element={<LessonView />} />
  <Route path="/student/grades" element={<ViewGrades />} />
  
  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
  <Route path="/teacher/classes" element={<TeacherClassManagement />} />
  <Route path="/teacher/lessons" element={<LessonPlanning />} />
  <Route path="/teacher/attendance" element={<AttendanceMarking />} />
  <Route path="/teacher/grades" element={<GradeEntry />} />
  
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/forms" element={<FormManagement />} />
  <Route path="/admin/classes" element={<ClassManagement />} />
  <Route path="/admin/subjects" element={<SubjectManagement />} />
  <Route path="/admin/students" element={<StudentManagement />} />
</Route>
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **User Login**
   - User enters email/password in `Login.js`
   - Calls `AuthContext.login(email, password)`
   - `AuthContext` calls `authServiceSupabase.login()`
   - Supabase Auth authenticates and returns session (JWT token)
   - `AuthContext.loadUserProfile()` fetches user from `users` table using UUID
   - User state set: `isAuthenticated = true`, `user = profile`
   - Redirect to role-specific dashboard

2. **Session Management**
   - Sessions stored in Supabase Auth (JWT tokens)
   - Tokens automatically refreshed by Supabase client
   - Session persisted in browser (localStorage)
   - Auth state listener (`onAuthStateChange`) updates on sign-in/sign-out

3. **User Profile Loading**
   - Profile fetched from `users` table using UUID from Supabase Auth
   - Matches `users.id` (UUID) with `auth.users.id`
   - Falls back to `users.user_id` if UUID not found

### User Roles

- **ADMIN**: Full system access, can manage all entities
- **INSTRUCTOR/TEACHER**: Can manage their assigned classes and subjects, create lessons, mark attendance, enter grades
- **STUDENT**: Can view their classes, subjects, lessons, submit assignments, view grades

### Row-Level Security (RLS) Policies

Set up RLS policies in Supabase:

1. **Users Table**
   - Users can read their own profile
   - Admins can read all profiles
   - Users can update their own profile

2. **Forms Table**
   - All authenticated users can read forms
   - Only admins can create/update/delete forms

3. **Classes Table**
   - All authenticated users can read classes
   - Admins can create/update/delete classes
   - Form tutors can update their assigned classes

4. **Subjects Table**
   - All authenticated users can read subjects
   - Admins can create/update/delete subjects

5. **Lessons Table**
   - Students can read lessons for their classes
   - Teachers can read/create/update/delete lessons for their assigned classes
   - Admins have full access

6. **Student Grades Table**
   - Students can read their own grades
   - Teachers can read/create/update grades for their classes
   - Admins have full access

---

## 🚀 Implementation Steps

### Phase 1: Project Setup

1. **Initialize React Application**
   ```bash
   npx create-react-app frontend
   cd frontend
   npm install react-router-dom@7.3.0 bootstrap@5.3.3 react-bootstrap@2.10.9 @supabase/supabase-js@2.78.0 date-fns@4.1.0 react-icons@5.5.0 html2pdf.js@0.10.1
   ```

2. **Set Up Supabase Project**
   - Create account at https://supabase.com
   - Create new project
   - Note down:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - Anon key
     - Service role key (for admin operations)

3. **Configure Environment Variables**
   Create `.env` file in `frontend/`:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set Up Supabase Client**
   Create `src/config/supabase.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true
     }
   });
   ```

### Phase 2: Database Setup

1. **Run Database Schema Script**
   - Open Supabase SQL Editor
   - Copy and paste entire `schema-redesign.sql` file
   - Execute script
   - Verify all tables and views are created

2. **Set Up Row-Level Security (RLS)**
   - Enable RLS on all tables
   - Create policies for each table based on user roles
   - Test policies with different user roles

3. **Set Up Supabase Storage**
   - Create storage buckets:
     - `course-materials` (for lesson content)
     - `assignments` (for assignment submissions)
   - Set up RLS policies for storage buckets

### Phase 3: Authentication Implementation

1. **Create Auth Context**
   - Create `src/contexts/AuthContextSupabase.js`
   - Implement `AuthProvider` component
   - Implement `login()`, `logout()`, `register()`, `loadUserProfile()` functions
   - Export `useAuth` hook

2. **Create Auth Service**
   - Create `src/services/authServiceSupabase.js`
   - Implement authentication methods using Supabase Auth

3. **Create Login Component**
   - Create `src/components/Auth/Login.js`
   - Form with email and password fields
   - Call `AuthContext.login()` on submit
   - Handle errors and show success messages
   - Redirect to role-specific dashboard on success

4. **Create Private Route Component**
   - Create `src/components/Auth/PrivateRoute.js`
   - Check authentication status
   - Redirect to login if not authenticated
   - Check user role for role-specific routes

5. **Create Register Component**
   - Create `src/components/Auth/Register.js`
   - Form with name, email, password, role fields
   - Call `AuthContext.register()` on submit
   - Redirect to login after successful registration

### Phase 4: Service Layer Implementation

1. **Create Supabase Service**
   - Create `src/services/supabaseService.js`
   - Implement all CRUD operations for:
     - Forms
     - Classes
     - Subjects
     - Lessons
     - Attendance
     - Assessments
     - Grades
     - Users

2. **Create Role-Specific Services**
   - `adminServiceSupabase.js` - Admin operations
   - `studentServiceSupabase.js` - Student operations
   - `teacherServiceSupabase.js` - Teacher operations

### Phase 5: Component Implementation

1. **Common Components**
   - `Navbar.js` - Navigation bar with role-based links
   - `Footer.js` - Footer component
   - `Timetable.js` - Weekly timetable grid
   - `Breadcrumb.js` - Breadcrumb navigation
   - `FileUpload.js` - File upload component
   - `NotificationToast.js` - Toast notifications

2. **Student Components**
   - `StudentDashboard.js` - Main student dashboard
   - `SubjectView.js` - Subject details page
   - `LessonView.js` - Lesson details page
   - `ViewGrades.js` - Grades view
   - `AssignmentSubmission.js` - Assignment submission form

3. **Teacher Components**
   - `TeacherDashboard.js` - Main teacher dashboard
   - `TeacherClassManagement.js` - Class management
   - `LessonPlanning.js` - Lesson creation/editing
   - `AttendanceMarking.js` - Attendance marking interface
   - `GradeEntry.js` - Grade entry form
   - `Gradebook.js` - Gradebook view

4. **Admin Components**
   - `AdminDashboard.js` - Main admin dashboard
   - `FormManagement.js` - Form CRUD operations
   - `ClassManagement.js` - Class CRUD operations
   - `SubjectManagement.js` - Subject CRUD operations
   - `StudentManagement.js` - Student assignment to classes
   - `ClassSubjectAssignment.js` - Assign subjects to classes
   - `InstitutionManagement.js` - Institution management

### Phase 6: Routing & Navigation

1. **Set Up React Router**
   - Install and configure React Router
   - Create route structure in `App.js`
   - Implement `PrivateRoute` wrapper for protected routes

2. **Implement Navigation**
   - Create `Navbar` component with role-based links
   - Implement breadcrumb navigation
   - Add logout functionality

### Phase 7: Styling & UI

1. **Set Up Bootstrap**
   - Import Bootstrap CSS in `index.js`
   - Use React Bootstrap components
   - Create custom CSS files for component-specific styles

2. **Create Color Scheme**
   - Define color palette in `styles/colors.css`
   - Use Caribbean-inspired colors (blues, greens, yellows)

3. **Responsive Design**
   - Ensure all components are mobile-responsive
   - Test on various screen sizes
   - Optimize for low-bandwidth connections

### Phase 8: Testing

1. **Test Authentication**
   - Test login with valid/invalid credentials
   - Test registration
   - Test password reset
   - Test session persistence

2. **Test Student Features**
   - View dashboard
   - View subjects
   - View lessons
   - Submit assignments
   - View grades

3. **Test Teacher Features**
   - View dashboard
   - Create lessons
   - Mark attendance
   - Enter grades
   - Manage class content

4. **Test Admin Features**
   - Create forms
   - Create classes
   - Create subjects
   - Assign students to classes
   - Assign subjects to classes

### Phase 9: Deployment

1. **Prepare for Production**
   - Update environment variables
   - Build React app: `npm run build`
   - Test production build locally

2. **Deploy to Heroku**
   - Create Heroku app
   - Set environment variables in Heroku dashboard
   - Deploy using Git or Heroku CLI
   - Configure buildpacks (Node.js)

3. **Post-Deployment**
   - Verify all features work in production
   - Test authentication
   - Monitor error logs
   - Set up error tracking (optional)

---

## 📝 Configuration Requirements

### Environment Variables

**Frontend (.env):**
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

**Heroku Config Vars:**
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Configuration

1. **Authentication Settings**
   - Enable email/password authentication
   - Configure email templates (optional)
   - Set up password reset flow

2. **Database Settings**
   - Enable Row-Level Security on all tables
   - Set up database backups
   - Configure connection pooling (if needed)

3. **Storage Settings**
   - Create storage buckets
   - Set up RLS policies for storage
   - Configure file size limits

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] User can register with email/password
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect credentials
- [ ] User session persists after page refresh
- [ ] User can logout
- [ ] Password reset flow works

### Student Feature Tests
- [ ] Student can view their dashboard
- [ ] Student can see their form and class
- [ ] Student can view all subjects for their class
- [ ] Student can view lesson details
- [ ] Student can view timetable
- [ ] Student can submit assignments
- [ ] Student can view their grades
- [ ] Student cannot access admin/teacher features

### Teacher Feature Tests
- [ ] Teacher can view their dashboard
- [ ] Teacher can see all their assigned classes
- [ ] Teacher can create lessons
- [ ] Teacher can mark attendance
- [ ] Teacher can enter grades
- [ ] Teacher can upload lesson materials
- [ ] Teacher cannot access admin features

### Admin Feature Tests
- [ ] Admin can view dashboard
- [ ] Admin can create/edit/delete forms
- [ ] Admin can create/edit/delete classes
- [ ] Admin can create/edit/delete subjects
- [ ] Admin can assign students to classes
- [ ] Admin can assign subjects to classes
- [ ] Admin can manage users

### Database Tests
- [ ] All tables are created correctly
- [ ] Foreign key constraints work
- [ ] Unique constraints prevent duplicates
- [ ] RLS policies enforce access control
- [ ] Views return correct data

---

## 🎯 Key Features by Role

### For Students
- View personalized dashboard with form/class information
- See all subjects for their class
- View weekly timetable
- Access lesson content and materials
- Submit assignments
- View grades and progress
- Track attendance

### For Teachers
- View dashboard with assigned classes
- Create and manage lessons
- Upload lesson materials
- Mark attendance for lessons
- Create assessments
- Enter and manage grades
- View class rosters
- Track student progress

### For Administrators
- System-wide dashboard with statistics
- Manage institutions
- Create and manage forms (year groups)
- Create and manage classes
- Create and manage subjects
- Assign students to classes
- Assign subjects to classes
- Assign teachers to class-subjects
- Manage users and roles
- Generate reports

---

## 🔧 Development Guidelines

### Code Style
- Use functional components with hooks
- Use async/await for asynchronous operations
- Handle errors with try-catch blocks
- Show user-friendly error messages
- Use loading states for async operations

### File Naming
- Components: PascalCase (e.g., `StudentDashboard.js`)
- Services: camelCase (e.g., `supabaseService.js`)
- Contexts: PascalCase (e.g., `AuthContextSupabase.js`)
- Styles: kebab-case (e.g., `student-dashboard.css`)

### Error Handling
- Always wrap async operations in try-catch
- Show user-friendly error messages
- Log errors to console for debugging
- Use toast notifications for user feedback

### Performance Optimization
- Use React.memo for expensive components
- Lazy load routes
- Optimize images
- Minimize API calls
- Use pagination for large lists

---

## 📚 Additional Resources

### Supabase Documentation
- Authentication: https://supabase.com/docs/guides/auth
- Database: https://supabase.com/docs/guides/database
- Storage: https://supabase.com/docs/guides/storage
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security

### React Documentation
- React Router: https://reactrouter.com/
- React Hooks: https://react.dev/reference/react
- React Bootstrap: https://react-bootstrap.github.io/

### Caribbean Education Context
- CXC (Caribbean Examinations Council): https://www.cxc.org/
- CSEC (Caribbean Secondary Education Certificate)
- CAPE (Caribbean Advanced Proficiency Examination)
- Forms 1-7 structure (typical Caribbean secondary school organization)

---

## ✅ Success Criteria

The application is considered complete when:

1. ✅ All database tables and views are created
2. ✅ Authentication system works (login, register, logout)
3. ✅ Students can view their dashboard, subjects, and lessons
4. ✅ Teachers can create lessons, mark attendance, and enter grades
5. ✅ Administrators can manage all entities (forms, classes, subjects, users)
6. ✅ All RLS policies are enforced correctly
7. ✅ File uploads work for lesson materials and assignments
8. ✅ Timetable component displays lessons correctly
9. ✅ Application is responsive and works on mobile devices
10. ✅ Application is deployed and accessible in production

---

## 🚨 Important Notes

1. **No Java Backend Required**: This application uses Supabase as Backend-as-a-Service. Do NOT create Java microservices.

2. **Supabase Auth Integration**: All authentication must use Supabase Auth, not custom JWT implementation.

3. **Row-Level Security**: Always enable and test RLS policies to ensure proper access control.

4. **Caribbean Context**: Remember this is for Caribbean secondary schools - use appropriate terminology (Forms, not Grades; Subjects, not Courses).

5. **Mobile-First**: Design should be mobile-responsive as many Caribbean schools have limited desktop access.

6. **Low-Bandwidth Optimization**: Optimize for low-bandwidth connections - minimize large file downloads, use lazy loading.

7. **Academic Year Management**: Always track academic years (e.g., "2024-2025") for forms, classes, and student assignments.

8. **CXC Integration**: Support CXC subject codes and assessment types (SBA, Mock Exams, etc.).

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify environment variables are set correctly
   - Check Supabase project is active
   - Verify network connectivity

2. **Authentication Issues**
   - Check Supabase Auth is enabled
   - Verify email/password format
   - Check RLS policies on users table

3. **Database Query Errors**
   - Verify table names match exactly
   - Check foreign key relationships
   - Verify RLS policies allow the operation

4. **File Upload Issues**
   - Check storage bucket exists
   - Verify RLS policies on storage bucket
   - Check file size limits

---

**End of Build Prompt**

This comprehensive prompt provides all the information needed for an AI agent to build LaunchPad SKN from scratch. Follow the phases sequentially, test thoroughly, and ensure all features work correctly before deployment.

