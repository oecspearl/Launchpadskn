# Full Supabase Migration Plan - Option B

## Overview
Complete migration from Java microservices backend to React + Supabase (BaaS). Implementing the hierarchical Caribbean secondary school structure: **School → Form → Class → Subject → Lesson**.

---

## Phase 1: Supabase Service Layer (Foundation)

### 1.1 Core Entity Services
- [x] `supabaseService.js` - Basic structure exists
- [ ] Add Form CRUD operations
- [ ] Add Class CRUD operations  
- [ ] Add Subject CRUD operations
- [ ] Add Subject Form Offering operations
- [ ] Add Class-Subject junction operations
- [ ] Add Lesson CRUD operations
- [ ] Add Student Class Assignment operations
- [ ] Add Attendance operations
- [ ] Add Assessment & Grade operations

### 1.2 Query Helpers
- [ ] Get forms by school
- [ ] Get classes by form
- [ ] Get subjects for class
- [ ] Get lessons by date/class/subject
- [ ] Get student timetable
- [ ] Get teacher schedule

---

## Phase 2: Frontend Component Updates

### 2.1 Navigation & Routing
- [ ] Update App.js routes (remove course routes)
- [ ] Add Form/Class/Subject routes
- [ ] Update Navbar for new navigation
- [ ] Create breadcrumb component (School → Form → Class → Subject)

### 2.2 Student Interface
- [ ] StudentDashboard - Timetable view + My Subjects
- [ ] MySubjects - List all subjects for student's class
- [ ] SubjectView - Subject detail page with lessons
- [ ] LessonView - Individual lesson page
- [ ] StudentTimetable - Weekly grid view
- [ ] MyGrades - Progress across all subjects

### 2.3 Teacher Interface  
- [ ] TeacherDashboard - My Classes list
- [ ] ClassManagement - Class roster & management
- [ ] LessonPlanning - Create/edit lessons
- [ ] AttendanceMarking - Mark attendance per lesson
- [ ] GradeEntry - Enter grades for assessments
- [ ] SubjectLibrary - Reusable content library

### 2.4 Admin Interface
- [ ] FormManagement - Create/manage forms
- [ ] ClassManagement - Create/manage classes
- [ ] SubjectManagement - Create/manage subjects
- [ ] StudentAssignment - Assign students to classes
- [ ] ClassSubjectAssignment - Assign subjects to classes
- [ ] TimetableConfig - Configure timetable
- [ ] BulkPromotion - Promote students (Form 3 → Form 4)

### 2.5 Common Components
- [ ] Timetable - Weekly grid component
- [ ] ClassRoster - Student list component
- [ ] SubjectSelector - Subject picker
- [ ] LessonCard - Lesson display card
- [ ] GradeEntryForm - Grade input form

---

## Phase 3: Remove Java Backend Dependencies

### 3.1 Remove Backend Services
- [ ] Stop all Java services
- [ ] Remove service startup scripts
- [ ] Update README to reflect Supabase-only architecture

### 3.2 Clean Up Code
- [ ] Remove Java backend references from frontend
- [ ] Remove old API service calls
- [ ] Remove Gateway proxy configuration
- [ ] Update environment variables documentation

---

## Phase 4: Core Features Implementation

### 4.1 Timetable Integration
- [ ] Timetable data structure
- [ ] Weekly view component
- [ ] Automatic lesson creation from timetable
- [ ] Conflict detection

### 4.2 Assessment System
- [ ] Create assessments (Test, Quiz, SBA, Project)
- [ ] Grade entry interface
- [ ] Term-based calculations
- [ ] Progress tracking
- [ ] CSEC/CAPE grade predictions

### 4.3 Communication
- [ ] Form-level announcements
- [ ] Class-specific messages
- [ ] Subject discussions
- [ ] Notification system

### 4.4 Reporting
- [ ] Student progress reports
- [ ] Class reports
- [ ] Subject reports
- [ ] Form-wide reports

---

## Phase 5: Migration & Data

### 5.1 Data Migration
- [ ] Course → Subject migration script
- [ ] Enrollment → Class Assignment
- [ ] Course Content → Lesson Content
- [ ] Assessment data migration

### 5.2 Testing
- [ ] Test all CRUD operations
- [ ] Test user workflows
- [ ] Performance testing
- [ ] Mobile responsiveness

---

## File Structure

```
frontend/src/
├── services/
│   ├── supabaseService.js (expand with new functions)
│   ├── formService.js (new)
│   ├── classService.js (new)
│   ├── subjectService.js (new)
│   ├── lessonService.js (new)
│   ├── attendanceService.js (new)
│   └── assessmentService.js (new)
│
├── components/
│   ├── Student/
│   │   ├── StudentDashboard.js (redesign)
│   │   ├── MySubjects.js (new)
│   │   ├── SubjectView.js (new)
│   │   ├── LessonView.js (new)
│   │   ├── StudentTimetable.js (new)
│   │   └── MyGrades.js (new)
│   │
│   ├── Teacher/
│   │   ├── TeacherDashboard.js (redesign)
│   │   ├── ClassManagement.js (new)
│   │   ├── LessonPlanning.js (new)
│   │   ├── AttendanceMarking.js (new)
│   │   └── GradeEntry.js (new)
│   │
│   ├── Admin/
│   │   ├── FormManagement.js (new)
│   │   ├── ClassManagement.js (new)
│   │   ├── SubjectManagement.js (new)
│   │   ├── StudentAssignment.js (new)
│   │   └── TimetableConfig.js (new)
│   │
│   └── common/
│       ├── Timetable.js (new)
│       ├── ClassRoster.js (new)
│       ├── SubjectSelector.js (new)
│       └── LessonCard.js (new)
```

---

## Implementation Order

1. **Week 1**: Supabase service layer for all entities
2. **Week 2**: Student interface (Dashboard, Subjects, Lessons)
3. **Week 3**: Teacher interface (Classes, Lessons, Attendance, Grades)
4. **Week 4**: Admin interface (Forms, Classes, Subjects, Assignments)
5. **Week 5**: Timetable integration & Assessment system
6. **Week 6**: Communication, Reporting, Polish

---

## Success Criteria

✅ All CRUD operations work via Supabase
✅ Students see subjects (not courses) organized by Form/Class
✅ Teachers manage classes and subjects efficiently
✅ Lessons align with timetable
✅ Assessment system supports SBA/CXC
✅ No Java backend dependencies
✅ Mobile-responsive design
✅ Performance acceptable

---

## Start Implementation

Let's begin with Phase 1: Expanding the Supabase service layer!


