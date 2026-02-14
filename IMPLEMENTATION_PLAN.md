# Implementation Plan - Caribbean Secondary School Architecture

## Phase 1: Database Schema & Models (Week 1)

### 1.1 Create Migration Scripts
- [ ] Create `schema-redesign.sql` with all new tables
- [ ] Create `migration-from-courses.sql` for data migration
- [ ] Test migrations on development database

### 1.2 Entity Models (Java)
- [ ] `Form.java` entity
- [ ] `Class.java` entity (rename existing if needed)
- [ ] `Subject.java` entity (new)
- [ ] `SubjectFormOffering.java` entity
- [ ] `ClassSubject.java` entity (junction table)
- [ ] `Lesson.java` entity
- [ ] `LessonContent.java` entity
- [ ] `StudentClassAssignment.java` entity
- [ ] `LessonAttendance.java` entity
- [ ] `SubjectAssessment.java` entity
- [ ] `StudentGrade.java` entity

### 1.3 Repositories
- [ ] Create repositories for all new entities
- [ ] Custom query methods for common operations

---

## Phase 2: Backend Services (Week 2)

### 2.1 Form Service
- [ ] Create/Update/Delete forms
- [ ] List forms by school
- [ ] Form coordinator assignment

### 2.2 Class Service
- [ ] Create/Update/Delete classes
- [ ] Class roster management
- [ ] Form tutor assignment
- [ ] Student assignment to classes

### 2.3 Subject Service
- [ ] Subject CRUD operations
- [ ] Subject offerings per form
- [ ] CXC code management

### 2.4 Class-Subject Service
- [ ] Assign subjects to classes
- [ ] Teacher assignment to class-subject
- [ ] Get subjects for class
- [ ] Get classes for subject

### 2.5 Lesson Service
- [ ] Lesson CRUD
- [ ] Timetable-based lesson creation
- [ ] Lesson content management
- [ ] Lesson queries (by date, class, subject, teacher)

### 2.6 Attendance Service
- [ ] Mark attendance for lesson
- [ ] Attendance history
- [ ] Attendance reports

### 2.7 Assessment Service
- [ ] Assessment CRUD
- [ ] Grade entry
- [ ] Grade calculations
- [ ] Term-based reporting

---

## Phase 3: REST API Controllers (Week 3)

### 3.1 Form Controller
- [ ] All CRUD endpoints
- [ ] Form classes endpoint
- [ ] Form students endpoint

### 3.2 Class Controller
- [ ] All CRUD endpoints
- [ ] Class roster endpoints
- [ ] Class subjects endpoint

### 3.3 Subject Controller
- [ ] All CRUD endpoints
- [ ] Subject offerings endpoints
- [ ] Class assignments endpoint

### 3.4 Lesson Controller
- [ ] All CRUD endpoints
- [ ] Timetable endpoints
- [ ] Content upload endpoints

### 3.5 Attendance Controller
- [ ] Mark attendance
- [ ] Attendance history
- [ ] Reports

### 3.6 Assessment Controller
- [ ] Assessment CRUD
- [ ] Grade entry endpoints
- [ ] Grade reports

### 3.7 Dashboard Controllers
- [ ] Student dashboard endpoint
- [ ] Teacher dashboard endpoint
- [ ] Timetable endpoint

---

## Phase 4: Frontend Redesign (Week 4-5)

### 4.1 Navigation Structure
- [ ] Redesign navbar (Subject-based navigation)
- [ ] Breadcrumb system (School → Form → Class → Subject)
- [ ] Sidebar navigation

### 4.2 Student Interface
- [ ] Dashboard with timetable
- [ ] My Subjects page
- [ ] Subject detail pages
- [ ] Lesson pages
- [ ] Grades/progress view
- [ ] Assignments page

### 4.3 Teacher Interface
- [ ] Dashboard with class list
- [ ] Class management pages
- [ ] Lesson planning interface
- [ ] Grade entry interface
- [ ] Attendance marking interface
- [ ] Subject content library

### 4.4 Admin Interface
- [ ] Form management
- [ ] Class management
- [ ] Student assignment interface
- [ ] Subject management
- [ ] Timetable configuration
- [ ] Reporting dashboard

### 4.5 Components
- [ ] Timetable component (weekly grid)
- [ ] Lesson card component
- [ ] Class roster component
- [ ] Subject selector component
- [ ] Grade entry form
- [ ] Attendance marking interface

---

## Phase 5: Migration Tools (Week 6)

### 5.1 Data Migration Scripts
- [ ] Course → Subject migration
- [ ] Course Content → Lesson Content
- [ ] Enrollment → Class Assignment
- [ ] Assessment migration
- [ ] Grade migration

### 5.2 Migration Utilities
- [ ] Migration service/script
- [ ] Data validation
- [ ] Rollback capability
- [ ] Progress tracking

---

## Phase 6: Advanced Features (Week 7+)

### 6.1 Timetable Integration
- [ ] Timetable import/export
- [ ] Automatic lesson generation
- [ ] Timetable conflict detection

### 6.2 Bulk Operations
- [ ] Bulk student promotion
- [ ] Class reorganization
- [ ] Batch assignments

### 6.3 CXC/SBA Management
- [ ] SBA component tracking
- [ ] Mock exam scheduling
- [ ] CSEC/CAPE grade predictions

### 6.4 Communication
- [ ] Form-level announcements
- [ ] Class-specific messages
- [ ] Subject discussions
- [ ] Parent notifications

### 6.5 Reporting
- [ ] Form-wide reports
- [ ] Class reports
- [ ] Subject reports
- [ ] Individual student reports
- [ ] Ministry reporting

---

## File Structure Changes

### New Backend Structure
```
course-service/src/main/java/com/scholarspace/courseservice/
├── models/
│   ├── Form.java
│   ├── Class.java
│   ├── Subject.java
│   ├── SubjectFormOffering.java
│   ├── ClassSubject.java
│   ├── Lesson.java
│   ├── LessonContent.java
│   ├── StudentClassAssignment.java
│   ├── LessonAttendance.java
│   ├── SubjectAssessment.java
│   └── StudentGrade.java
├── repositories/
│   ├── FormRepository.java
│   ├── ClassRepository.java
│   ├── SubjectRepository.java
│   ├── LessonRepository.java
│   └── ... (all new repositories)
├── services/
│   ├── FormService.java
│   ├── ClassService.java
│   ├── SubjectService.java
│   ├── LessonService.java
│   ├── AttendanceService.java
│   └── AssessmentService.java
└── controllers/
    ├── FormController.java
    ├── ClassController.java
    ├── SubjectController.java
    ├── LessonController.java
    └── DashboardController.java
```

### New Frontend Structure
```
frontend/src/components/
├── Student/
│   ├── StudentDashboard.js (timetable view)
│   ├── MySubjects.js
│   ├── SubjectView.js
│   ├── LessonView.js
│   └── MyGrades.js
├── Teacher/
│   ├── TeacherDashboard.js (class list)
│   ├── ClassManagement.js
│   ├── LessonPlanning.js
│   ├── GradeEntry.js
│   └── AttendanceMarking.js
├── Admin/
│   ├── FormManagement.js
│   ├── ClassManagement.js
│   ├── StudentAssignment.js
│   └── TimetableConfig.js
└── common/
    ├── Timetable.js (weekly grid)
    ├── ClassRoster.js
    ├── SubjectSelector.js
    └── LessonCard.js
```

---

## Testing Checklist

### Backend Testing
- [ ] Unit tests for all services
- [ ] Integration tests for controllers
- [ ] Database relationship tests
- [ ] Permission/role tests

### Frontend Testing
- [ ] Component rendering tests
- [ ] Navigation flow tests
- [ ] Dashboard data display
- [ ] Form submission tests

### End-to-End Testing
- [ ] Student workflow (view timetable, access subjects)
- [ ] Teacher workflow (create lesson, mark attendance, enter grades)
- [ ] Admin workflow (create forms, assign classes, manage students)

---

## Rollout Strategy

1. **Development Environment**
   - Implement and test all changes
   - Run migration scripts on test data

2. **Staging Environment**
   - Deploy redesigned system
   - Train pilot users
   - Gather feedback

3. **Production Rollout**
   - Schedule maintenance window
   - Run migration scripts
   - Monitor for issues
   - Provide user training

---

## Risk Mitigation

- **Data Loss**: Complete backup before migration
- **Downtime**: Plan migration during low-usage period
- **User Confusion**: Provide training materials and support
- **Performance**: Optimize queries, add indexes
- **Compatibility**: Test with existing integrations

---

## Success Criteria

- ✅ All students can see their Form/Class structure
- ✅ Teachers manage multiple classes efficiently
- ✅ Lessons align with timetable
- ✅ Assessments support CXC structure
- ✅ Mobile-responsive design works
- ✅ Performance is acceptable
- ✅ Users trained and productive


