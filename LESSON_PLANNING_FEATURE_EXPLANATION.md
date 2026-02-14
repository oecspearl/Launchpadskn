# Lesson Planning Feature - Complete Explanation

## Overview

The Lesson Planning feature in LaunchPad SKN allows teachers to create, manage, and organize lessons for their assigned class-subjects. It includes both manual lesson creation and AI-powered lesson plan generation, making it easy for teachers to create comprehensive, structured lesson plans aligned with Caribbean secondary school curriculum standards.

---

## 🎯 Core Functionality

### 1. **Manual Lesson Creation**

Teachers can create lessons manually by filling out a form with:

- **Basic Information:**
  - Lesson Date (required)
  - Start Time (required)
  - End Time (required)
  - Lesson Title
  - Topic
  - Location (room number)

- **Educational Content:**
  - Learning Objectives (what students will learn)
  - Lesson Plan (detailed step-by-step plan)
  - Homework Description
  - Homework Due Date

- **Status Management:**
  - Status: SCHEDULED, COMPLETED, or CANCELLED
  - Tracks lesson completion and attendance status

### 2. **AI-Powered Lesson Plan Generation**

The system includes two AI-powered tools:

#### **Basic AI Lesson Planner**
- Simple form with topic, grade level, duration
- Generates basic lesson plan structure
- Quick generation for simple lessons

#### **Enhanced AI Lesson Planner** (Recommended)
- Comprehensive form with multiple tabs:
  - **Basic Info Tab:** Subject, Form, Class, Topic, Learning Outcomes, Student Count, Duration
  - **Teaching Strategy Tab:** Pedagogical strategies, Learning styles, Multiple intelligences, Materials, Prerequisite skills
  - **Additional Details Tab:** Special needs accommodations, Additional instructions, Reference URLs
- Automatically loads curriculum standards from the database
- Generates detailed, structured lesson plans following Caribbean education standards

---

## 📋 User Interface

### Main Lesson Planning Page

**Location:** `/teacher/class-subjects/:classSubjectId/lessons`

**Features:**
1. **Header Section:**
   - Shows current class-subject (e.g., "Mathematics • Form 3 - 3A")
   - "AI Lesson Planner" button (opens enhanced planner modal)
   - "Create Lesson" button (opens lesson creation modal)

2. **View Modes:**
   - **Grid View:** Card-based layout showing lesson cards with key information
   - **List View:** Table-like layout with all lessons in a list
   - **Schedule View:** Weekly timetable view using the Timetable component

3. **Lesson Cards/Items Display:**
   - Lesson title
   - Date and time
   - Location
   - Topic
   - Status badge (color-coded: Scheduled/Completed/Cancelled)
   - Homework indicator (if homework assigned)
   - Action buttons: View, Edit

4. **Empty State:**
   - Shows when no lessons exist
   - "Create First Lesson" button

### Create/Edit Lesson Modal

**Opens when:**
- Clicking "Create Lesson" button
- Clicking "Edit" on an existing lesson

**Structure:**
1. **AI Lesson Planner Accordion** (only for new lessons):
   - Expandable section with "Use AI to Generate Lesson Plan (Enhanced)"
   - Contains the EnhancedLessonPlannerForm component
   - When AI generates a plan, it auto-populates the form fields below

2. **Lesson Form Fields:**
   - Date, Time fields (required)
   - Lesson Title
   - Topic
   - Learning Objectives (textarea)
   - Lesson Plan (large textarea)
   - Location
   - Homework Description (textarea)
   - Homework Due Date
   - Status dropdown

3. **Actions:**
   - Cancel button
   - Save/Create button

### Enhanced AI Lesson Planner Modal

**Opens when:** Clicking "AI Lesson Planner" button in header

**Layout:**
- **Left Column (5/12 width):** Enhanced Lesson Planner Form
- **Right Column (7/12 width):** Lesson Plan Output Preview

**Features:**
- Multi-tab form for comprehensive input
- Real-time curriculum standards loading
- Form data saved to localStorage (persists for 24 hours)
- "Generate Lesson Plan" button triggers AI generation
- Generated plan appears in right column preview
- "Use in Lesson Form" button transfers data to main lesson form

---

## 🔄 Workflow

### Creating a Lesson with AI

1. **Navigate to Lesson Planning:**
   - Teacher goes to their class-subject page
   - Clicks "Lesson Planning" or navigates to `/teacher/class-subjects/:classSubjectId/lessons`

2. **Open AI Planner (Optional):**
   - Click "AI Lesson Planner" button
   - Fill out the enhanced form:
     - Basic Info: Subject, Form, Topic, Learning Outcomes
     - Teaching Strategy: Select pedagogical approaches, learning styles
     - Additional Details: Special needs, instructions
   - Click "Generate Lesson Plan"
   - AI generates comprehensive lesson plan
   - Review in preview panel
   - Click "Use in Lesson Form"

3. **Create Lesson:**
   - Click "Create Lesson" button
   - If AI was used, form is pre-populated
   - Otherwise, fill form manually
   - Set date, time, location
   - Add/edit learning objectives, lesson plan, homework
   - Set status
   - Click "Create Lesson"

4. **Save to Database:**
   - Lesson saved to `lessons` table in Supabase
   - Linked to `class_subject_id`
   - Available for viewing, editing, attendance marking

### Creating a Lesson Manually

1. Click "Create Lesson"
2. Fill out all form fields
3. Click "Create Lesson"
4. Lesson saved to database

### Editing a Lesson

1. Click "Edit" on any lesson card/item
2. Modal opens with pre-filled data
3. Make changes
4. Click "Update Lesson"
5. Changes saved to database

### Viewing Lessons

1. **Grid View:** See lesson cards in a grid layout
2. **List View:** See lessons in a table format
3. **Schedule View:** See lessons in weekly timetable format
4. Click "View" to see full lesson details (navigates to lesson detail page)

---

## 🤖 AI Integration

### How AI Generation Works

1. **User Input:**
   - Teacher fills out Enhanced Lesson Planner Form
   - System loads curriculum standards from database (if available)

2. **API Call:**
   - Frontend calls `generateEnhancedLessonPlan()` from `aiLessonService.js`
   - Service uses OpenAI API (requires `REACT_APP_OPENAI_API_KEY`)

3. **Prompt Construction:**
   - Builds comprehensive prompt with:
     - Subject, Form, Class, Topic
     - Learning outcomes (essential and specific)
     - Curriculum standards from database
     - Teaching strategies selected
     - Learning styles and preferences
     - Materials and prerequisites
     - Special needs accommodations
     - Duration and student count

4. **AI Response:**
   - OpenAI generates structured JSON lesson plan
   - Includes:
     - Lesson title
     - Learning objectives
     - Structured lesson plan with:
       - Lesson Header
       - Objectives Table (Knowledge, Skills, Values)
       - Lesson Components (Prompter/Hook, Introduction, Concept Development, Reflection)
       - Assessment strategies
       - Resources
       - Homework/Extension
     - Homework description

5. **Response Processing:**
   - Parses JSON response
   - Formats structured plan into readable text
   - Extracts homework description
   - Populates form fields

### AI Service Configuration

**File:** `frontend/src/services/aiLessonService.js`

**Requirements:**
- OpenAI API key in `.env`: `REACT_APP_OPENAI_API_KEY=your_key_here`
- Uses OpenAI GPT models (default: gpt-4 or gpt-3.5-turbo)

**Features:**
- Error handling for API failures
- JSON parsing with fallbacks
- Structured lesson plan formatting
- Caribbean education context awareness

---

## 💾 Database Structure

### Lessons Table

```sql
CREATE TABLE lessons (
    lesson_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id),
    lesson_title VARCHAR(200) NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    lesson_number INTEGER,
    topic VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    homework_description TEXT,
    homework_due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    attendance_taken BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Relationships

- **class_subject_id:** Links lesson to specific class-subject combination
- **created_by:** Tracks which teacher created the lesson
- **status:** Tracks lesson state (SCHEDULED, COMPLETED, CANCELLED, ABSENT)

### Lesson Content Table

Lessons can have associated content (files, links, videos):

```sql
CREATE TABLE lesson_content (
    content_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id),
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Technical Implementation

### Component Structure

```
LessonPlanning.js (Main Component)
├── EnhancedLessonPlannerForm.js (AI Form)
├── AILessonPlanner.js (Basic AI Form - legacy)
├── LessonPlanOutput.js (Preview Component)
└── Timetable.js (Schedule View)
```

### Service Layer

**supabaseService.js:**
- `getLessonsByClassSubject(classSubjectId)` - Fetch all lessons for a class-subject
- `createLesson(lessonData)` - Create new lesson
- `updateLesson(lessonId, updates)` - Update existing lesson
- `deleteLesson(lessonId)` - Delete lesson

**aiLessonService.js:**
- `generateLessonPlan(params)` - Basic AI generation
- `generateEnhancedLessonPlan(formData)` - Enhanced AI generation
- `formatStructuredLessonPlan(planObj)` - Format structured plan to text

### State Management

**Local State (React Hooks):**
- `lessons` - Array of lesson objects
- `classSubject` - Current class-subject details
- `showModal` - Controls create/edit modal visibility
- `showEnhancedPlanner` - Controls AI planner modal visibility
- `editingLesson` - Currently editing lesson (null for new)
- `viewMode` - Current view mode ('grid', 'list', 'calendar')
- `lessonData` - Form data for create/edit

**Data Flow:**
1. Component mounts → `fetchData()` loads lessons and class-subject
2. User creates/edits → Form data stored in `lessonData` state
3. User submits → `handleSubmit()` calls service method
4. Service saves to Supabase → Database updated
5. `fetchData()` called again → UI refreshes with new data

---

## 📱 Features & Capabilities

### View Modes

1. **Grid View:**
   - Card-based layout
   - Shows key information at a glance
   - Good for browsing multiple lessons
   - Responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)

2. **List View:**
   - Table-like layout
   - More information visible
   - Better for comparing lessons
   - Sortable by date/time

3. **Schedule View:**
   - Weekly timetable format
   - Visual representation of lesson schedule
   - Shows lessons by day and time
   - Color-coded by subject
   - Clickable lessons for details

### Lesson Status Management

- **SCHEDULED:** Default status for new lessons
- **COMPLETED:** Mark when lesson is finished
- **CANCELLED:** Mark if lesson is cancelled
- **ABSENT:** Mark if teacher was absent (optional)

### Homework Management

- Assign homework with description
- Set due date
- Students see homework in their dashboard
- Teachers can track submission

### Curriculum Integration

- Automatically loads curriculum standards from `subject_form_offerings` table
- AI uses curriculum standards when generating plans
- Ensures alignment with CXC/CSEC/CAPE standards

### Form Persistence

- Enhanced planner form data saved to localStorage
- Persists for 24 hours
- Allows teachers to continue where they left off
- Cleared when form is submitted or manually cleared

---

## 🎓 Educational Features

### Structured Lesson Plans

AI-generated plans follow Caribbean education structure:

1. **Lesson Header:**
   - Subject, Form, Class
   - Topic
   - Essential and Specific Learning Outcomes
   - Duration

2. **Objectives Table:**
   - Knowledge objectives
   - Skills objectives
   - Values objectives

3. **Lesson Components:**
   - **Prompter/Hook:** Engaging opening (1-3 min)
   - **Introduction:** Connect to prior knowledge (2-3 min)
   - **Concept Development:** Main content with detailed activities (50-60% of duration)
   - **Time to Reflect:** Student reflection and sharing (3-5 min)

4. **Assessment:**
   - Formative assessment strategies
   - Assessment activities
   - Assessment tools

5. **Resources:**
   - Materials needed
   - References
   - Digital resources

6. **Homework/Extension:**
   - Meaningful assignments
   - Clear instructions

### Pedagogical Support

- Multiple pedagogical strategies (Inquiry-Based, Project-Based, etc.)
- Learning styles support (Visual, Auditory, Kinesthetic, Reading/Writing)
- Multiple intelligences integration
- Special needs accommodations
- Prerequisite skills tracking

---

## 🔐 Permissions & Access

### Teacher Access

- Teachers can only see/edit lessons for their assigned class-subjects
- Determined by `class_subjects.teacher_id` matching current user
- Row-Level Security (RLS) policies enforce this in Supabase

### Admin Access

- Admins can view all lessons
- Can edit/delete any lesson
- Full system access

### Student Access

- Students can view lessons for their classes
- Read-only access
- Can see lesson content, homework, materials

---

## 🚀 Usage Examples

### Example 1: Quick Lesson Creation

1. Teacher navigates to "Form 3A - Mathematics" lesson planning
2. Clicks "Create Lesson"
3. Fills in:
   - Date: Tomorrow
   - Time: 8:00 AM - 8:45 AM
   - Title: "Introduction to Fractions"
   - Topic: "Understanding Fractions"
   - Learning Objectives: "Students will understand what fractions represent"
   - Lesson Plan: "1. Show pizza example... 2. Explain numerator/denominator..."
   - Location: "Room 101"
4. Clicks "Create Lesson"
5. Lesson appears in grid/list/schedule view

### Example 2: AI-Generated Comprehensive Lesson

1. Teacher clicks "AI Lesson Planner"
2. Fills Enhanced Form:
   - Basic Info: Mathematics, Form 3, 3A, Topic: "Introduction to Algebra"
   - Teaching Strategy: Selects "Inquiry-Based Learning", "Visual", "Group work"
   - Additional: Notes "Students struggle with abstract concepts"
3. Clicks "Generate Lesson Plan"
4. AI generates comprehensive plan with:
   - Detailed lesson header
   - Objectives table
   - Step-by-step lesson components with timing
   - Assessment strategies
   - Resources list
   - Homework assignment
5. Teacher reviews in preview panel
6. Clicks "Use in Lesson Form"
7. Form auto-populated with generated content
8. Teacher adds date/time/location
9. Clicks "Create Lesson"
10. Comprehensive lesson saved

### Example 3: Editing Existing Lesson

1. Teacher sees lesson in grid view
2. Clicks "Edit" button
3. Modal opens with existing data
4. Teacher updates:
   - Changes status to "COMPLETED"
   - Adds notes to lesson plan
   - Updates homework due date
5. Clicks "Update Lesson"
6. Changes saved

---

## 🐛 Troubleshooting

### AI Generation Not Working

**Issue:** AI lesson planner doesn't generate plans

**Solutions:**
1. Check `.env` file has `REACT_APP_OPENAI_API_KEY` set
2. Verify API key is valid and has credits
3. Check browser console for errors
4. Ensure internet connection is active
5. Try refreshing the page

### Form Not Saving

**Issue:** Lesson creation/update fails

**Solutions:**
1. Check all required fields are filled (date, start time, end time)
2. Verify user has permission to create lessons for this class-subject
3. Check Supabase connection
4. Look for error messages in UI
5. Check browser console for detailed errors

### Curriculum Standards Not Loading

**Issue:** Enhanced planner doesn't show curriculum standards

**Solutions:**
1. Verify `subject_form_offerings` table has curriculum data
2. Check `class_subject_id` is valid
3. Ensure database connection is working
4. Check browser console for errors

### View Mode Not Working

**Issue:** Can't switch between grid/list/schedule views

**Solutions:**
1. Ensure lessons exist (empty state doesn't show view toggle)
2. Check browser console for errors
3. Try refreshing the page
4. Verify Timetable component is properly imported

---

## 📊 Performance Considerations

### Optimization Features

1. **Lazy Loading:**
   - Lessons loaded only when needed
   - Pagination for large lesson lists (future enhancement)

2. **Caching:**
   - Form data cached in localStorage
   - Reduces re-entry of data

3. **Efficient Queries:**
   - Database queries use indexes
   - Only fetch necessary data

4. **Component Optimization:**
   - React.memo for expensive components
   - Conditional rendering

---

## 🔮 Future Enhancements

Potential improvements:

1. **Bulk Operations:**
   - Create multiple lessons at once
   - Copy lessons to other class-subjects
   - Template system

2. **Collaboration:**
   - Share lessons between teachers
   - Lesson plan library
   - Peer review system

3. **Analytics:**
   - Lesson completion tracking
   - Time spent on lessons
   - Student engagement metrics

4. **Integration:**
   - Calendar integration
   - Email notifications
   - Mobile app support

5. **Advanced AI:**
   - Lesson plan variations
   - Differentiation suggestions
   - Assessment question generation

---

## 📝 Summary

The Lesson Planning feature is a comprehensive tool that:

✅ Allows manual lesson creation with full control  
✅ Provides AI-powered lesson plan generation  
✅ Supports multiple view modes (grid, list, schedule)  
✅ Integrates with curriculum standards  
✅ Manages homework assignments  
✅ Tracks lesson status  
✅ Supports special needs accommodations  
✅ Follows Caribbean education standards  
✅ Provides detailed, structured lesson plans  
✅ Integrates seamlessly with attendance and grading features  

It's designed to save teachers time while ensuring high-quality, curriculum-aligned lesson plans that support effective teaching and learning in Caribbean secondary schools.

