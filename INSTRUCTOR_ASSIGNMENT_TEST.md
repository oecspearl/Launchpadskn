# Instructor Assignment Feature Test Plan

## Implementation Summary

### Backend Changes Made:
1. **Enhanced InstructorAssignmentService** - Added validation for active instructors and active courses
2. **Updated InstructorAssignmentController** - Added alternative endpoints for instructor-centric operations
3. **Validation Rules**:
   - Only active instructors can be assigned to courses
   - Only active courses can have instructors assigned
   - Prevents duplicate assignments

### Frontend Changes Made:
1. **Updated ManageInstructors.js** - Added expandable instructor view showing assigned courses
2. **Course Assignment Modal** - Shows only active courses available for assignment
3. **Real-time Updates** - Refreshes course assignments after add/remove operations
4. **Status Indicators** - Shows active/inactive status for courses and instructors

## API Endpoints Available:

### Course-Centric Endpoints:
- `POST /api/courses/{courseId}/instructors/{instructorId}` - Assign instructor to course
- `DELETE /api/courses/{courseId}/instructors/{instructorId}` - Remove instructor from course
- `GET /api/courses/{courseId}/instructors` - Get instructors for a course
- `GET /api/courses/instructor/{instructorId}` - Get courses for an instructor

### Instructor-Centric Endpoints:
- `POST /api/instructors/{instructorId}/courses/{courseId}` - Assign course to instructor
- `DELETE /api/instructors/{instructorId}/courses/{courseId}` - Remove course from instructor

## Testing Steps:

### 1. Test Active Instructor Assignment
1. Navigate to Admin Dashboard → Manage Instructors
2. Find an active instructor and click the dropdown arrow
3. Click "Assign Course" button
4. Verify only active courses are shown in the modal
5. Assign a course and verify it appears in the expanded view

### 2. Test Inactive Instructor Restriction
1. Deactivate an instructor using the status toggle
2. Verify the "Assign Course" button is disabled
3. Try to assign a course via API - should return error

### 3. Test Inactive Course Restriction
1. Deactivate a course in the course management
2. Verify it doesn't appear in the assignment modal
3. Try to assign an inactive course via API - should return error

### 4. Test Course Removal
1. In the expanded instructor view, click the "X" button on an assigned course
2. Confirm the removal in the dialog
3. Verify the course is removed from the instructor's list

### 5. Test Duplicate Assignment Prevention
1. Try to assign the same course to an instructor twice
2. Should receive an error message

## Expected Behavior:

### UI Features:
- ✅ Expandable instructor rows (similar to institution management)
- ✅ Course assignment modal with active courses only
- ✅ Real-time updates after assignment/removal
- ✅ Status indicators for active/inactive items
- ✅ Disabled assignment button for inactive instructors

### Business Rules:
- ✅ Only active instructors can be assigned courses
- ✅ Only active courses can be assigned to instructors
- ✅ No duplicate assignments allowed
- ✅ Proper error handling and user feedback

## Database Schema:
```sql
-- course_instructors table
CREATE TABLE course_instructors (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(course_id),
    instructor_id BIGINT NOT NULL, -- References users.user_id
    role VARCHAR(50) DEFAULT 'PRIMARY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Service Communication:
- Course Service validates instructor exists and is active by calling User Service
- Frontend uses Gateway (port 8080) to route requests to Course Service (port 8092)
- All instructor data comes from User Service, course assignments from Course Service

## Ready for Testing!
The instructor-course assignment feature is now fully implemented with:
- Backend validation and business rules
- Frontend expandable UI similar to institution management
- Real-time updates and proper error handling
- Active/inactive status enforcement