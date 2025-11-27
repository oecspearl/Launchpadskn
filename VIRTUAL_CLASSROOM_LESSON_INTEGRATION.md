# Virtual Classroom Integration with Lessons

## Overview

Teachers can now add virtual classrooms directly to their lessons, allowing seamless integration of online video conferencing with lesson planning. This feature enables teachers to:

- Link existing virtual classrooms to lessons
- Create new virtual classrooms from within the lesson planning form
- Join virtual classrooms directly from the lesson view
- See visual indicators for lessons that have virtual classrooms

## Database Changes

A new `session_id` column has been added to the `lessons` table to link lessons with collaboration sessions (virtual classrooms):

```sql
ALTER TABLE lessons 
ADD COLUMN session_id BIGINT REFERENCES collaboration_sessions(session_id) ON DELETE SET NULL;
```

**Migration File:** `database/add-virtual-classroom-to-lessons.sql`

## Features

### 1. Adding Virtual Classroom to Lesson

When creating or editing a lesson, teachers can:

1. **Select an Existing Virtual Classroom:**
   - A dropdown shows all available virtual classrooms for the class-subject
   - Select "No virtual classroom" to remove the link

2. **Create a New Virtual Classroom:**
   - Click the "New" button next to the dropdown
   - Fill in the classroom details:
     - Title (required)
     - Description (optional)
     - Enable Recording (checkbox)
     - Enable Breakout Rooms (checkbox)
   - The new classroom is automatically created and linked to the lesson

### 2. Viewing Virtual Classroom in Lesson

When viewing a lesson that has a virtual classroom:

- A **Virtual Classroom** section appears in the lesson details
- Shows the meeting ID/name
- **"Join Classroom"** button opens the Jitsi meeting in a new window
- Also available in the Quick Actions sidebar

### 3. Visual Indicators

Lessons with virtual classrooms are marked with:
- A blue **"Virtual Classroom"** badge in grid view
- A blue **"Virtual"** badge in list view

## User Interface

### Lesson Planning Form

**Location:** `/teacher/class-subjects/:classSubjectId/lessons`

The lesson form now includes a "Virtual Classroom" section:
- Dropdown to select existing classrooms
- "New" button to create a classroom
- Helpful text explaining the feature

### Lesson View

**Location:** `/teacher/lessons/:lessonId`

Displays:
- Virtual classroom card with meeting information
- Join button in both the details section and quick actions

## Technical Implementation

### Components Updated

1. **LessonPlanning.jsx** (Teacher)
   - Added virtual classroom state management
   - Fetches available virtual classrooms on load
   - Includes virtual classroom selection in form
   - Modal for creating new virtual classrooms
   - Visual indicators in lesson cards/list

2. **TeacherLessonView.jsx** (Teacher)
   - Fetches virtual classroom data when lesson has `session_id`
   - Displays virtual classroom information
   - Provides join functionality

3. **LessonView.jsx** (Student)
   - Fetches virtual classroom data when lesson has `session_id`
   - Displays prominent "Join Virtual Classroom" button
   - Integrates with collaboration service for session joining

4. **LessonViewStream.jsx** (Student)
   - Fetches virtual classroom data when lesson has `session_id`
   - Displays styled "Join Virtual Classroom" button
   - Matches gamified interface theme

### Services Used

- `collaborationService.getActiveSessions()` - Fetch virtual classrooms
- `collaborationService.createSession()` - Create new session
- `collaborationService.createVirtualClassroom()` - Create virtual classroom
- `collaborationService.getVirtualClassroom()` - Get classroom details
- `collaborationService.joinSession()` - Join the session

## Usage Example

1. **Teacher creates a lesson:**
   - Navigates to Lesson Planning
   - Clicks "Create Lesson"
   - Fills in lesson details
   - In "Virtual Classroom" section:
     - Either selects an existing classroom from dropdown, OR
     - Clicks "New" to create a classroom
   - Saves the lesson

2. **Teacher views the lesson:**
   - Opens the lesson detail page
   - Sees the virtual classroom section
   - Clicks "Join Classroom" to start/join the video session

3. **Students:**
   - Can access the virtual classroom directly from the lesson view
   - See a prominent "Join Virtual Classroom" button in the lesson header
   - Available in both standard lesson view (`/student/lessons/:lessonId`) and stream view

## Database Schema

```sql
-- Lessons table now includes:
session_id BIGINT REFERENCES collaboration_sessions(session_id) ON DELETE SET NULL
```

The relationship:
- `lessons.session_id` → `collaboration_sessions.session_id`
- `collaboration_sessions` → `virtual_classrooms` (via session_id)

## Student Access

Students can access virtual classrooms from:

1. **Standard Lesson View** (`/student/lessons/:lessonId`)
   - Prominent green "Join Virtual Classroom" button in the hero section
   - Appears below the estimated time badge
   - Opens Jitsi meeting in a new window

2. **Stream Lesson View** (`/student/lessons/:lessonId/stream`)
   - "Join Virtual Classroom" button in the mission header
   - Styled to match the gamified interface
   - Same functionality as standard view

Both views automatically:
- Fetch virtual classroom data when a lesson has `session_id`
- Join the collaboration session when clicking the button
- Open the Jitsi meeting in a new window

## Future Enhancements

Potential improvements:
- Auto-create virtual classroom when lesson is scheduled
- Schedule virtual classrooms for future lessons
- Integration with calendar/notifications
- Recording playback from lesson view
- Notifications when virtual classroom is about to start

## Notes

- Virtual classrooms are optional - lessons work fine without them
- Deleting a collaboration session will set `session_id` to NULL (doesn't delete the lesson)
- Virtual classrooms use Jitsi Meet for video conferencing
- The feature respects existing RLS policies for collaboration sessions

