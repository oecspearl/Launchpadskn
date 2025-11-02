# LaunchPad SKN - Student User Experience Guide

## Overview
This guide explains what a student sees and experiences when they log into the LaunchPad SKN Learning Management System.

## Student Account Setup

### Login Credentials (Test Student)
- **Email**: `student.test@launchpadskn.com`
- **Password**: `Student123!`
- **Role**: STUDENT

### Assignment Structure
- **School**: Automatically assigned based on class assignment
- **Form**: Form 3 (Lower Secondary - Year 3)
- **Class**: 3A (Homeroom class)

## Student Dashboard Experience

### 1. Dashboard Overview Tab

When a student logs in, they see their **Student Dashboard** with:

#### Header Section
- **Welcome Message**: Personalized greeting with student name
- **Class Information Card**: 
  - Shows current class (e.g., "Form 3A")
  - Displays form tutor/class teacher name

#### My Subjects Section
- **Grid of Subject Cards** showing all subjects for their class:
  - Each card displays:
    - Subject icon with gradient background
    - Subject name (e.g., "Mathematics", "English Language")
    - Subject metadata (teacher, schedule info)
  - Clicking a subject card navigates to subject details

#### Today's Lessons
- **List of lessons scheduled for today**:
  - Lesson time
  - Subject name
  - Lesson title/topic
  - Location/room
- Shows lessons in chronological order

#### Weekly Timetable
- **Visual weekly schedule**:
  - Grid layout showing days of the week (Monday-Sunday)
  - Time slots displayed
  - Color-coded subjects
  - Click to view lesson details

#### Upcoming Assignments
- **List of upcoming assessments and homework**:
  - Assignment name
  - Subject
  - Due date
  - Status indicators

### 2. My Subjects Page (`/student/subjects`)

**Navigation**: Click "My Subjects" in navbar or any subject card

**Features**:
- Complete list of all subjects for student's class
- Each subject shows:
  - Subject details (CSEC code, description)
  - Number of lessons
  - Recent activity
- Click subject to view detailed subject page

### 3. Subject Details Page (`/student/subjects/:classSubjectId`)

**Access**: Click on any subject from the dashboard or subjects list

**Content**:
- **Subject Information**:
  - Subject name and code
  - CSEC/CAPE information
  - Teacher information
  
- **Lessons Tab**:
  - Complete list of lessons for this subject
  - Filter by date range
  - Lesson status indicators
  - Click lesson to view details

- **Assignments Tab**:
  - All assessments for this subject
  - Due dates
  - Submission status
  - Grades (when available)

- **Grades Tab**:
  - Assessment grades
  - Overall subject performance
  - Progress tracking

### 4. Lesson View Page (`/student/lessons/:lessonId`)

**Access**: Click on any lesson from dashboard, timetable, or subject page

**Content**:
- **Lesson Details**:
  - Lesson title and topic
  - Date and time
  - Location/room
  - Learning objectives
  - Lesson plan content

- **Lesson Materials**:
  - Files and resources uploaded by teacher
  - Links to external content
  - Downloadable materials

- **Homework**:
  - Assignment description
  - Due date
  - Submission status

- **Attendance**:
  - Attendance status for this lesson
  - Marked as Present, Absent, Late, or Excused

## Navigation Structure

### Navbar Links (Student View)
- **Dashboard**: Main student dashboard (`/student/dashboard`)
- **My Subjects**: List of all subjects (`/student/subjects`)
- **Notifications**: Alert/bell icon (future feature)
- **Profile Dropdown**:
  - My Profile
  - Logout

### Mobile Navigation
- Hamburger menu on small screens
- Touch-friendly buttons (minimum 48px)
- Collapsible navigation with smooth transitions

## Data Flow

### What Data the Student Sees
1. **Class Assignment**:
   - Fetched from `student_class_assignments` table
   - Links student to a specific class
   - Class belongs to a form, form belongs to a school

2. **Subjects**:
   - Derived from `class_subjects` table
   - Shows all subjects assigned to student's class
   - Each subject has a teacher assignment

3. **Lessons**:
   - Fetched from `lessons` table
   - Filtered by:
     - Student's class assignments
     - Subject assignments
     - Date range (today, this week, upcoming)

4. **Assignments**:
   - From `subject_assessments` table
   - Filtered by student's class and subjects
   - Shows due dates and grades

5. **Grades**:
   - From `student_grades` table
   - Linked to assessments
   - Organized by subject

## Responsive Design Features

### Mobile Experience (< 768px)
- **Single column layouts**
- **Larger touch targets** (minimum 48px)
- **Collapsible navigation**
- **Optimized card layouts**
- **Full-width forms**
- **Swipe-friendly interactions**

### Tablet Experience (768px - 1024px)
- **Two-column grids**
- **Side-by-side content**
- **Enhanced spacing**

### Desktop Experience (> 1024px)
- **Multi-column grids** (3-4 columns)
- **Expanded navigation**
- **Hover effects**
- **Larger typography**

## Key User Interactions

### 1. Viewing Today's Schedule
- Dashboard shows today's lessons automatically
- Click lesson card to view details
- Navigate to full timetable for week view

### 2. Accessing Subject Materials
- Navigate to "My Subjects"
- Click subject card
- View lessons, assignments, and grades
- Access lesson materials and resources

### 3. Checking Assignments
- Dashboard shows upcoming assignments
- Click to view assignment details
- Subject page shows all assignments for that subject

### 4. Viewing Grades
- Subject page → Grades tab
- See individual assessment grades
- View overall subject performance

## Visual Design Elements

### Color Scheme (SKN Flag Colors)
- **Primary Green**: Main actions, links
- **Red**: Secondary actions, alerts
- **Yellow/Accent**: Highlights, important info
- **Gradients**: Modern, professional look

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, 16px base size
- **Mobile**: Prevents zoom on input focus (16px)

### Cards & Components
- **Glass morphism effects**: Modern, sleek appearance
- **Gradient backgrounds**: Visual interest
- **Smooth animations**: Professional feel
- **Hover effects**: Interactive feedback

## Common Student Actions

1. **Check Today's Schedule**: View dashboard → Today's Lessons
2. **Access Subject Content**: Dashboard → My Subjects → Select Subject
3. **View Weekly Timetable**: Dashboard → Weekly Timetable section
4. **Check Assignments**: Dashboard → Upcoming Assignments
5. **Download Lesson Materials**: Subject → Lesson → Lesson Materials
6. **View Grades**: Subject → Grades Tab
7. **Update Profile**: Profile Dropdown → My Profile

## Future Features (Planned)
- Notifications system
- Direct messaging with teachers
- Submission of assignments
- Attendance tracking view
- Academic progress reports
- Calendar integration

## Technical Notes

### Authentication
- Uses Supabase Auth
- Session persists across browser tabs
- Auto-logout on token expiration
- Secure JWT tokens

### Data Loading
- Optimistic UI updates
- Graceful error handling
- Loading states with skeletons
- Timeout protections prevent infinite loading

### Performance
- Mobile-first design
- Optimized images and assets
- Lazy loading where applicable
- Efficient database queries

## Troubleshooting

### Student Can't See Subjects
- **Check**: Student is assigned to a class (`student_class_assignments`)
- **Check**: Class has subjects assigned (`class_subjects`)
- **Check**: Subjects are active

### Student Can't See Lessons
- **Check**: Lessons exist for the class-subject combinations
- **Check**: Lesson dates are within the queried range
- **Check**: Student's class assignment is active

### Dashboard Shows "Loading..."
- Usually resolves within 2-5 seconds
- Check browser console for errors
- Verify Supabase connection
- Ensure student profile exists in `users` table

