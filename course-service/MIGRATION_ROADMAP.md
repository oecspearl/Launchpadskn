# Course Service Migration Roadmap

## Overview
Migration from monolithic backend to course-service microservice, maintaining exact same workflow and functionality.

## Phase 1: Core Course Management (Admin Functions) ✅ COMPLETED
**Target**: Admin creates courses and assigns instructors

### Entities to Migrate:
- Course.java (with Department reference)
- ContentType.java enum
- InstructorRole.java enum

### Services to Migrate:
- CourseService.createCourse()
- CourseService.getCourseById()
- CourseService.getAllCourses()
- CourseService.getActiveCourses()
- CourseService.updateCourse()
- CourseService.activateCourse()
- CourseService.deactivateCourse()

### Controllers to Migrate:
- CourseController.createCourse() - POST /api/courses
- CourseController.getAllCourses() - GET /api/courses
- CourseController.getActiveCourses() - GET /api/courses/active
- CourseController.getCourseById() - GET /api/courses/{id}
- CourseController.updateCourse() - PUT /api/courses/{id}
- CourseController.activateCourse() - PUT /api/courses/{id}/activate
- CourseController.deactivateCourse() - PUT /api/courses/{id}/deactivate

### Inter-Service Calls:
- Validate department exists via institution-service

---

## Phase 2: Instructor Assignment (Admin Functions) ✅ COMPLETED
**Target**: Admin assigns instructors to courses

### Entities to Migrate:
- CourseInstructor.java

### Services to Migrate:
- InstructorService.assignInstructorToCourse()
- InstructorService.removeInstructorFromCourse()
- InstructorService.getCoursesByInstructor()
- InstructorService.getInstructorsByCourse()
- InstructorService.validateInstructorCourseAssignment()

### Controllers to Migrate:
- POST /api/courses/{courseId}/instructors/{instructorId} (from InstructorController)
- DELETE /api/courses/{courseId}/instructors/{instructorId}
- GET /api/courses/instructor/{instructorId}
- GET /api/courses/{courseId}/instructors

### Inter-Service Calls:
- Validate instructor exists and has INSTRUCTOR role via user-service

---

## Phase 3: Student Enrollment Management ✅ COMPLETED
**Target**: Students request enrollment, Admin approves/rejects

### Entities to Migrate:
- Enrollment.java
- EnrollmentStatus.java enum

### Services to Migrate:
- EnrollmentService.requestEnrollment()
- EnrollmentService.updateEnrollmentStatus()
- EnrollmentService.getEnrollmentsByStatus()
- EnrollmentService.getEnrollmentsByCourse()
- EnrollmentService.getEnrollmentsByStudent()

### Controllers to Migrate:
- POST /api/enrollments - Student requests enrollment
- GET /api/enrollments/pending - Admin views pending
- PUT /api/enrollments/{id}/approve - Admin approves
- PUT /api/enrollments/{id}/reject - Admin rejects
- GET /api/enrollments/student/{studentId}
- GET /api/enrollments/course/{courseId}

### Inter-Service Calls:
- Validate student exists and has STUDENT role via user-service

---

## Phase 4: Course Content Management (Instructor Functions) ✅ COMPLETED
**Target**: Instructors add course materials for assigned courses

### Entities to Migrate:
- CourseContent.java

### Services to Migrate:
- CourseContentService (entire service)
- File upload handling

### Controllers to Migrate:
- CourseContentController (entire controller)
- File upload endpoints

### Inter-Service Calls:
- Validate instructor has access to course
- File storage management

---

## Phase 5: Submissions & Grading ✅ COMPLETED
**Target**: Students submit assignments, Instructors grade submissions

### Entities to Migrate:
- Submission.java
- AttendanceRecord.java
- AttendanceStatus.java enum

### Services to Migrate:
- SubmissionService (entire service)

### Controllers to Migrate:
- SubmissionController (entire controller)

---

## Database Schema
Database: scholarspace_courses (Port: 8092)
Tables: courses, course_prerequisites, course_contents, course_instructors, enrollments, submissions, attendance_records

## Security Model
- ADMIN: Full access to all endpoints
- INSTRUCTOR: Access to assigned courses only
- STUDENT: Access to enrolled courses and enrollment requests

## Current Status: MIGRATION COMPLETE! ✅

All phases have been successfully migrated from monolithic backend to course-service microservice:
- ✅ Phase 1: Core Course Management
- ✅ Phase 2: Instructor Assignment  
- ✅ Phase 3: Student Enrollment Management
- ✅ Phase 4: Course Content Management
- ✅ Phase 5: Submissions & Grading

The course-service is now ready for testing and deployment!