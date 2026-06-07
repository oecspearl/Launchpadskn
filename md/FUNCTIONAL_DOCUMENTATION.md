# LaunchPad SKN — Functional Documentation

> A comprehensive Learning Management System built for Caribbean secondary schools in Saint Kitts and Nevis.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Admin Functions](#5-admin-functions)
6. [School Admin Functions](#6-school-admin-functions)
7. [Teacher / Instructor Functions](#7-teacher--instructor-functions)
8. [Student Functions](#8-student-functions)
9. [Parent Functions](#9-parent-functions)
10. [Cross-Role Functions](#10-cross-role-functions)
11. [AI Tutor System](#11-ai-tutor-system)
12. [Database Schema](#12-database-schema)
13. [Data Hierarchy](#13-data-hierarchy)
14. [Notification System](#14-notification-system)
15. [Messaging System](#15-messaging-system)
16. [Collaboration System](#16-collaboration-system)
17. [Content Library](#17-content-library)
18. [Quiz & Assessment Engine](#18-quiz--assessment-engine)
19. [Report Card System](#19-report-card-system)
20. [Curriculum Management](#20-curriculum-management)
21. [Student Information Management](#21-student-information-management)
22. [Server-Side API](#22-server-side-api)
23. [Third-Party Integrations](#23-third-party-integrations)

---

## 1. System Overview

LaunchPad SKN is a full-stack Learning Management System designed specifically for the Caribbean secondary school context (Forms 1–7, CSEC/CAPE aligned). It serves five distinct user roles and covers the complete educational workflow: school administration, class management, lesson delivery, assessment, grading, attendance tracking, report card generation, and AI-powered tutoring.

### Key Capabilities
- Multi-school support with institution-scoped data isolation
- Caribbean curriculum alignment (CSEC/CAPE subject codes, SBA components, Forms 1–7)
- AI-powered Socratic tutoring with YouTube and web resource search
- Real-time collaboration (documents, whiteboards, virtual classrooms)
- Comprehensive student information management (profiles, transfers, special needs, disciplinary records)
- Interactive content types (flashcards, interactive books, interactive videos, 3D models, AR/VR content)
- Report card generation with PDF export
- Parent portal with read-only access to child data
- Direct messaging between teachers, parents, and administrators

---

## 2. Architecture

### Frontend
- **Framework**: React 19 with Vite 7
- **State Management**: TanStack Query (server state), React Context (auth, sidebar, breadcrumbs, notifications, toast, tutor)
- **Routing**: React Router v6 with lazy-loaded route groups
- **Styling**: CSS custom properties + Bootstrap 5 (for data tables only)
- **Data Layer**: Supabase JavaScript client (direct database queries via RLS)

### Backend (Node.js — Production)
- **Server**: Node.js / Express (serves static frontend + AI proxy endpoints)
- **Database**: PostgreSQL via Supabase (hosted)
- **Auth**: Supabase Auth (email/password) + optional Active Directory integration
- **Storage**: Supabase Storage (file uploads, profile images, 3D models)
- **AI**: OpenAI GPT-4o-mini via server-side proxy (API key stays server-side)

### Backend (Java Microservices — Legacy/Extended)
The project also contains a Java Spring Boot microservices architecture:
- **API Gateway** (port 8080) — Spring Cloud Gateway, routes to downstream services
- **User Service** (port 8081) — User CRUD, auth (login, register, password reset), dashboard stats, analytics
- **Course Service** (port 8082) — Course CRUD, enrollments, course content, submissions, grading, instructor assignments
- **Institution Service** (port 8083) — Institution CRUD, department management
- **Config Server** (port 8888) — Centralized configuration
- **Discovery / Eureka** (port 8761) — Service registry

These microservices provide REST APIs with JWT-based auth (ROLE_ADMIN, ROLE_INSTRUCTOR, ROLE_STUDENT) and handle course/enrollment lifecycle, instructor assignments, and analytics. The gateway rewrites paths and routes to the appropriate service.

### Data Access Pattern
The frontend primarily communicates directly with Supabase using the Supabase JS client. Row Level Security (RLS) policies enforce data access control at the database level. The Express server is used for:
1. Serving the static frontend build
2. Proxying AI/OpenAI API calls (to keep API keys server-side)
3. Proxying YouTube and Google Search API calls

The Java microservices provide additional REST API endpoints for course management, enrollment workflows, and analytics.

---

## 3. User Roles & Permissions

| Role | Code | Access Level |
|------|------|-------------|
| **System Admin** | `admin` | Full access to all schools, users, and system configuration |
| **School Admin** | `school_admin` | Full access scoped to their institution |
| **Teacher / Instructor** | `instructor` | Manages their assigned classes, lessons, grades, and assessments |
| **Student** | `student` | Views lessons, submits work, takes quizzes, uses AI tutor |
| **Parent** | `parent` | Read-only view of linked children's data |
| **Super Admin** | `super_admin` | Ultimate platform admin (defined in constants, not yet distinct from admin) |
| **Curriculum Designer** | `curriculum_designer` | Content creator role (defined in constants) |

### Role Normalization
- The role `teacher` is normalized to `instructor` at the auth context level
- Role comparison is case-insensitive throughout the application
- Active roles: `ADMIN`, `SCHOOL_ADMIN`, `INSTRUCTOR`, `STUDENT`, `PARENT`
- Additional defined constants: `SUPER_ADMIN`, `CURRICULUM_DESIGNER` (reserved for future use)

---

## 4. Authentication & Authorization

### Login Methods
1. **Database Login** — Email + password via Supabase Auth
2. **Active Directory Login** — Domain credentials (e.g., `jadmin@mylab.local`)

### Auth Flow
1. User submits credentials → Supabase `signInWithPassword()` or AD endpoint
2. Supabase returns a session with JWT access token
3. Auth context extracts role from `user_metadata` and loads full profile from `users` table
4. Token stored in localStorage, user object cached
5. `PrivateRoute` component enforces role-based route access
6. Supabase RLS policies enforce data-level access control

### Session Management
- JWT tokens auto-refresh via Supabase `onAuthStateChange` listener
- 5-second global timeout prevents infinite loading states
- Token refresh updates localStorage without full profile reload
- `FirstTimeLoginCheck` component forces password change on first login

### Registration
- Students can self-register via `/register`
- Admin/School Admin/Teacher accounts are created by administrators
- Registration creates both a Supabase Auth user and a `users` table record

### Password Management
- Forgot password flow via `/forgot-password` → email reset link → `/reset-password`
- In-app password change via `/change-password`
- First-time login detection with forced password change (instructors only via `FirstTimeLoginCheck`)
- Admin can set `force_password_change = true` on any user — `PrivateRoute` enforces redirect to `/change-password`
- All passwords hashed by Supabase using bcrypt

### Institution Scoping
- School admins have `institution_id` on their user record
- `userService.hasInstitutionAccess()` checks if user can access institution data
- System admins bypass institution checks (access all)
- School admins only see data for their own institution

---

## 5. Admin Functions

System administrators have unrestricted access across all institutions.

### 5.1 Dashboard (`/admin/dashboard`)
- Total counts: users, classes, subjects, institutions
- Activity log showing recent system events (user creation, subject additions, class changes)
- Quick navigation to management pages

### 5.2 User Management (`/admin/users`)
- View all users across all institutions
- Create new users (any role)
- Edit user details (name, email, role, phone, DOB, address)
- Activate/deactivate user accounts
- Filter and search users by role, status, institution

### 5.3 Student Management (`/admin/students`)
- Comprehensive student list with search and filtering
- View detailed student profiles (`/admin/students/:studentId`)
- Access student's academic records, attendance, grades, disciplinary history
- Manage student lifecycle events (enrollment, transfers, graduations)

### 5.4 Instructor Management (`/admin/instructors`)
- View and manage all teacher/instructor accounts
- Assign instructors to departments
- View instructor teaching assignments

### 5.5 Form Management (`/admin/forms`)
- Create and manage year groups (Forms 1–7)
- Assign form coordinators
- Set academic year
- Link forms to institutions

### 5.6 Class Management (`/admin/classes`)
- Create homeroom/stream classes (e.g., 3A, 3B) within forms
- Set class capacity and room assignments
- Assign form tutors
- View class students (`/admin/classes/:classId/students`)

### 5.7 Subject Management (`/admin/subjects`)
- Create and manage academic subjects
- Assign CSEC/CAPE subject codes (`cxc_code`)
- Link subjects to departments
- Set subject descriptions and codes

### 5.8 Student Assignment (`/admin/student-assignment`)
- Assign students to classes for a given academic year
- Bulk assignment support
- View current enrollment per class

### 5.9 Class-Subject Assignment (`/admin/class-subject-assignment`)
- Link subjects to classes (which classes take which subjects)
- Assign teachers to class-subject combinations
- Set weekly period counts and room preferences

### 5.10 Course Assignment (`/admin/course-assignment`)
- Legacy course-to-instructor assignment management

### 5.11 Department Management (`/admin/departments`)
- Create and manage academic departments
- Assign heads of department
- Set department codes and contact information

### 5.12 Enrollment Approval (`/admin/enrollment-approval`)
- Review and approve/deny student enrollment requests

### 5.13 AR/VR Content Management (`/admin/arvr-content`)
- Manage 3D models and AR/VR content available to teachers
- Upload and organize 3D model assets
- Set content visibility and categorization

### 5.14 Help Page (`/admin/help`)
- Context-specific help documentation for administrators

---

## 6. School Admin Functions

School administrators have all admin capabilities but scoped to their specific institution.

### 6.1 Dashboard (`/school-admin/dashboard`)
- Institution-specific overview and statistics
- Quick access to school-level management

### 6.2 Form Management (`/school-admin/forms`)
- Manage forms within their institution only
- Same capabilities as admin form management but institution-scoped

### 6.3 Class Management (`/school-admin/classes`)
- Manage classes within their institution's forms

### 6.4 Subject Management (`/school-admin/subjects`)
- Manage subjects offered at their institution

### 6.5 Student Management (`/school-admin/students`)
- Manage students enrolled at their institution
- View and edit student profiles, records

### 6.6 Instructor Management (`/school-admin/instructors`)
- Manage teachers assigned to their institution

### 6.7 Reports (`/school-admin/reports`)
- Generate institution-level reports
- Attendance summaries, grade distributions, enrollment statistics
- Export reports as PDF

### 6.8 Report Card Management (`/school-admin/report-cards`)
- Generate, review, and publish official report cards
- Set report card parameters (term, academic year)
- Add principal comments
- Publish report cards to make them visible to parents/students

---

## 7. Teacher / Instructor Functions

Teachers manage their assigned classes and deliver instruction.

### 7.1 Dashboard (`/teacher/dashboard`)
- Today's lessons with time slots
- Upcoming assessments due for grading
- Overview of assigned classes with student counts
- Quick statistics: total classes, total students, lessons today, pending assessments
- Tab navigation: Overview, My Classes, Timetable

### 7.2 Class Management (`/teacher/classes/:classId`)
- View class roster with student details
- Access subject-specific views for the class
- Navigate to gradebook, lesson planning, and content management

### 7.3 Lesson Planning (`/teacher/lessons/create`, `/teacher/class-subjects/:classSubjectId/lessons`)
- Create new lessons for a class-subject combination
- Set lesson title, date, time, location, topic
- Define learning objectives and lesson plans
- Add homework with descriptions and due dates
- Set lesson status (SCHEDULED, COMPLETED, CANCELLED)
- **AI Lesson Planner**: Generate lesson structure, learning objectives, activities, and assessments via AI (`aiLessonService`)
- Create virtual classrooms linked to lessons (recording, breakout rooms)
- Duplicate lessons from templates
- Switch between grid, list, and calendar views

### 7.4 Lesson View & Content (`/teacher/lessons/:lessonId`)
- View full lesson details
- Navigate to content management and attendance marking

### 7.5 Lesson Content Management (`/teacher/lessons/:lessonId/content`)
- Add multiple content types to lessons:
  - **Files**: PDF, DOCX, images, videos (uploaded to Supabase Storage)
  - **Links**: External URLs
  - **Videos**: YouTube embeds with auto-metadata fetch
  - **Quizzes**: In-app quiz builder (multiple choice, true/false, short answer, essay, matching, fill-in-the-blank)
  - **Flashcards**: Interactive flashcard sets
  - **Interactive Books**: Multi-page interactive content
  - **Interactive Videos**: Videos with embedded questions/annotations
  - **3D Models**: Embeddable 3D model viewers
  - **AR Content**: Augmented reality experiences
  - **Assignments**: With rubric and detail file uploads
- Reorder content items (drag and drop or manual ordering)
- Set content as required or optional
- Add instructions, learning outcomes, key concepts, discussion prompts
- Preview content as students would see it (`/teacher/lesson/:lessonId/preview`)

### 7.6 Attendance Marking (`/teacher/lessons/:lessonId/attendance`)
- Mark attendance for each student in a lesson
- Status options: PRESENT, ABSENT, LATE, EXCUSED, SICK
- Add notes per student
- Bulk marking support

### 7.7 Grade Entry (`/teacher/assessments/:assessmentId/grades`)
- Enter grades for all students in an assessment
- Input: marks obtained, comments
- Auto-calculate percentage and grade letter
- Mark students as excused
- Bulk grade entry

### 7.8 Gradebook (`/teacher/class-subjects/:classSubjectId/gradebook`)
- Spreadsheet-style view of all assessments and grades for a class-subject
- Create new assessments (TEST, QUIZ, SBA, PROJECT, MOCK_EXAM, EXAM)
- Set assessment weights, due dates, total marks, term
- View grade statistics and distributions
- SBA component support for CXC

### 7.9 Content Library (`/teacher/content-library`)
- Browse shared content from other teachers
- Search by subject, form, content type, tags
- Rate and review content
- Add content to favorites/bookmarks
- Import library content into lessons
- Share own content to the library

### 7.10 Lesson Template Library (`/teacher/lesson-templates`)
- Save lesson structures as reusable templates
- Browse and apply templates to new lessons
- Share templates with other teachers

### 7.11 Curriculum Viewer (`/teacher/curriculum`)
- View structured curriculum guides:
  - SKN Mathematics (Form 1 and Form 2)
  - SKN Social Science (Form 1 and Form 2)
- Browse learning objectives, topics, and resources per term

### 7.12 Student Profile View (`/teacher/students/:studentId`)
- View individual student's profile and academic data
- Access grades, attendance, and behavioral records for students in teacher's classes

### 7.13 Report Card Comments (`/teacher/report-cards`)
- Add teacher comments and effort grades for students on report cards
- Submit per-subject feedback for the reporting period

### 7.14 Tutor Settings (`/teacher/tutor-settings`)
- Enable/disable AI Tutor access per class-subject
- Create per-student overrides (enable/disable with reason)
- Control which students can use the AI tutoring system

### 7.15 Help Page (`/teacher/help`)
- Context-specific help documentation for teachers

---

## 8. Student Functions

Students consume content, submit work, and interact with the AI tutor.

### 8.1 Dashboard (`/student/dashboard`)
- Today's timetable with lesson times
- Upcoming assignments and due dates
- Recent grades and announcements
- Subject list with teacher names
- XP progress bar (gamification)
- Quick stats: attendance rate, average grade, pending assignments

### 8.2 Subject View (`/student/subjects/:classSubjectId`)
- View all lessons for a specific subject
- See lesson dates, topics, and status
- Access lesson content and materials
- View assessment schedule and grades for the subject

### 8.3 Lesson Viewer (`/student/lessons/:lessonId`)
- Stream-based lesson consumption interface
- Navigate through lesson content sequentially
- Content types rendered inline:
  - Text/documents in a reader view
  - Videos with embedded player
  - Flashcards with flip interaction
  - Interactive books with page navigation
  - 3D model viewers
  - AR experiences
  - Quiz links
- Track progress through lesson content (learner_progress table)
- Speed dial for playback speed control
- Discussion sidebar for lesson-related chat

### 8.4 Quiz View (`/student/quizzes/:contentId`)
- Take quizzes embedded in lessons
- Question types: multiple choice, true/false, short answer, essay, matching, fill-in-the-blank
- Timer support for time-limited quizzes
- Auto-grading for objective questions
- Multiple attempts if allowed by teacher
- View results and correct answers (if enabled)

### 8.5 Assignment Submission (`/student/assignments/:assessmentId/submit`)
- Submit assignments for graded assessments
- Upload files (PDF, DOCX, images)
- Add submission text/notes
- View assignment rubric and details

### 8.6 Course Registration (`/student/courses/register`)
- Browse available courses/subjects
- Request enrollment in optional subjects

### 8.7 Progress Dashboard (`/student/progress`)
- View overall academic progress
- Track completion of lesson content
- View grade trends over time
- Set and track personal learning goals (via studentGoalService)

### 8.8 Curriculum Viewer
- Browse the same curriculum guides as teachers (read-only):
  - SKN Mathematics (Form 1 and Form 2)
  - SKN Social Science (Form 1 and Form 2)

### 8.9 AI Tutor Widget
- Floating chat widget available on all student pages
- Socratic tutoring powered by GPT-4o-mini
- Context-aware: knows student's current subject, lesson, and grade level
- Conversation history persistence (stored in database)
- Resource search: finds YouTube videos and web articles on demand
- Teacher-controlled access (can be enabled/disabled per class-subject)
- Special needs accommodations factored into tutor prompts
- See [Section 11](#11-ai-tutor-system) for full details

### 8.10 Help Page (`/student/help`)
- Context-specific help documentation for students

---

## 9. Parent Functions

Parents have read-only access to their linked children's educational data.

### 9.1 Dashboard (`/parent/dashboard`)
- Child selector (if multiple children are linked)
- Six-tab interface:

#### Overview Tab
- Quick stats: attendance rate, average grade, total subjects, today's lessons count
- Today's timetable with lesson times
- Subject grid with teacher names
- Recent/pending assignments

#### Grades Tab
- Filterable grade list by subject
- Assessment names, marks, percentages, grade letters
- Teacher comments on grades

#### Attendance Tab
- Summary statistics: days present, absent, late, excused, attendance rate
- Detailed attendance record table (date, lesson, subject, status, teacher notes)

#### Timetable Tab
- Full weekly timetable view for the selected child

#### Disciplinary Tab
- Summary of incident counts by type
- Detailed disciplinary incident records (date, type, severity, action taken, resolution status)

#### Report Cards Tab
- View published report cards for the selected child
- Download report card PDFs

### 9.2 Child Linking
- Parents are linked to students via the `parent_student_links` table
- Relationship types: PARENT, GUARDIAN, GRANDPARENT, OTHER
- Links managed by administrators
- Multiple children can be linked to one parent

---

## 10. Cross-Role Functions

Available to multiple or all authenticated roles.

### 10.1 Profile Management (`/profile`)
- View and edit personal profile information
- Upload profile image (stored in Supabase Storage)
- Available to: admin, school_admin, instructor, student

### 10.2 Change Password (`/change-password`)
- Change current password
- Available to: admin, school_admin, instructor, student

### 10.3 Notifications (`/notifications`)
- View notification feed (assignment due, grade posted, announcements, deadlines, system alerts)
- Mark notifications as read (individually or all)
- Notification types: `assignment_due`, `grade_posted`, `announcement`, `deadline_reminder`, `system`, `lesson_posted`
- Priority levels: low, normal, high, urgent
- Auto-archive after 30 days
- Available to: admin, school_admin, instructor, student

### 10.4 Notification Preferences (`/notification-preferences`)
- Toggle notification types on/off
- Configure delivery methods (in-app, email, push)
- Set quiet hours
- Enable daily digest mode
- Available to: admin, school_admin, instructor, student

### 10.5 Messaging Center (`/messages`)
- Direct messaging between users
- Conversation-based threading (linked to a student for parent-teacher communications)
- Real-time message updates via Supabase Realtime
- Unread message tracking
- Available to: all roles including parent

### 10.6 Help Center (`/help`)
- General help documentation
- Available to: all roles including parent

### 10.7 Curriculum Viewer (`/curriculum/*`)
- Browse SKN curriculum guides (Mathematics and Social Science, Forms 1–2)
- Publicly accessible (no authentication required)
- Also available via role-specific routes

### 10.8 Keyboard Shortcuts
- Global keyboard shortcuts initialized at app startup
- Navigation shortcuts for common actions

### 10.9 Offline Detection
- `OfflineAlert` component displays when network connection is lost

### 10.10 Dark Mode
- Theme toggle via `ThemeContext`
- `[data-theme="dark"]` CSS attribute toggles dark mode across all components

---

## 11. AI Tutor System

The AI Tutor is a Socratic tutoring system available exclusively to students.

### Architecture
```
Student Chat Widget → Server Proxy (/api/ai/tutor) → OpenAI GPT-4o-mini
                                                    ↘ YouTube API (tool call)
                                                    ↘ Google Search API (tool call)
```

### Features
- **Socratic method**: Guides students with questions rather than giving direct answers
- **Context-aware**: Knows the student's name, grade level, current subject, lesson, and topic
- **Special needs support**: Adapts language complexity and scaffolding for students with documented special needs
- **Resource integration**: Can search YouTube and the web for educational videos and articles using OpenAI function calling
- **Conversation persistence**: Conversations stored in `tutor_conversations` and `tutor_messages` tables
- **Teacher control**: Teachers can enable/disable the tutor per class-subject, with per-student overrides
- **Caribbean localization**: Uses Caribbean examples (mangoes, cricket scores, market prices, beach trips)

### Safety Rules (Enforced in System Prompt)
1. Never solves entire homework problems
2. Never writes essays or complete assignments
3. Never provides final answers without student work
4. Always asks "Do you remember...?" before giving formulas
5. Redirects non-academic topics to studies
6. Responds with empathy to distress and refers to trusted adults

### API Endpoints
- `POST /api/ai/chat` — General AI chat proxy (passes through to OpenAI)
- `POST /api/ai/tutor` — Tutor-specific endpoint (constructs system prompt server-side, handles tool calling)

### Tool Calling
The tutor can invoke two tools via OpenAI function calling:
1. **search_youtube_videos** — Searches YouTube for educational videos (requires `YOUTUBE_API_KEY`)
2. **search_web_resources** — Searches Google for educational articles (requires `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_ENGINE_ID`)

Results are cached server-side for 30 minutes.

---

## 12. Database Schema

### Core Tables (16 tables)

| Table | Purpose |
|-------|---------|
| `institutions` | Schools/institutions |
| `users` | All user accounts (all roles in one table) |
| `departments` | Academic departments within institutions |
| `forms` | Year groups (Forms 1–7) per school per academic year |
| `classes` | Homeroom/stream classes within forms (e.g., 3A, 3B) |
| `subjects` | Academic disciplines with CSEC/CAPE codes |
| `subject_form_offerings` | Which subjects are offered in which forms |
| `class_subjects` | Junction: which classes take which subjects, with assigned teacher |
| `lessons` | Individual instructional sessions/periods |
| `lesson_content` | Files, links, videos, and other materials attached to lessons |
| `student_class_assignments` | Student enrollment in classes |
| `lesson_attendance` | Per-lesson attendance records |
| `subject_assessments` | Tests, quizzes, SBAs, projects, exams |
| `student_grades` | Student marks for assessments |
| `form_announcements` | Announcements at the form/year-group level |
| `class_announcements` | Announcements at the class level |

### Extended Tables

| Table | Purpose |
|-------|---------|
| `student_profiles` | Comprehensive student information (personal, health, family, emergency contacts) |
| `student_lifecycle_events` | Enrollment, transfer, promotion, graduation tracking |
| `student_transfers` | Detailed transfer records (incoming, outgoing, internal) |
| `student_special_needs` | Special needs, IEP information, accommodations |
| `student_accommodations` | Detailed accommodation records |
| `disciplinary_incidents` | Behavioral incident records |
| `disciplinary_actions` | Actions taken for incidents (detention, suspension, etc.) |
| `student_submissions` | Student assignment/assessment submissions (file uploads) |
| `learner_progress` | Progress tracking for interactive content |
| `parent_student_links` | Parent-child relationships |

### AI Tutor Tables

| Table | Purpose |
|-------|---------|
| `tutor_settings` | Per-class-subject tutor enable/disable |
| `tutor_student_overrides` | Per-student exceptions to tutor settings |
| `tutor_conversations` | Conversation metadata |
| `tutor_messages` | Individual messages in conversations |

### Quiz System Tables

| Table | Purpose |
|-------|---------|
| `quizzes` | Quiz metadata (time limit, passing score, attempts, randomization) |
| `quiz_questions` | Questions with type, points, ordering, explanations |
| `quiz_answer_options` | Answer options for multiple choice / matching |
| `quiz_correct_answers` | Correct answers for text-based questions |
| `student_quiz_attempts` | Student attempt tracking (score, time, grading status) |
| `student_quiz_responses` | Individual responses per question per attempt |

### Messaging Tables

| Table | Purpose |
|-------|---------|
| `conversations` | Conversation metadata with student reference |
| `conversation_participants` | Users in each conversation |
| `messages` | Individual messages with real-time replication |

### Notification Tables

| Table | Purpose |
|-------|---------|
| `notifications` | User notifications with type, priority, read status |
| `notification_preferences` | Per-user notification settings |

### Report Card Tables

| Table | Purpose |
|-------|---------|
| `report_cards` | Per-student per-term report cards with attendance and conduct |
| `report_card_grades` | Per-subject grades within a report card |

### Collaboration Tables

| Table | Purpose |
|-------|---------|
| `collaboration_sessions` | Main session table (document, classroom, whiteboard, tutoring, project) |
| `collaboration_participants` | Session participants with roles and permissions |
| `collaborative_documents` | Shared documents with version control |
| `document_changes` | Operational transform change log |
| `document_comments` | Threaded comments on documents |
| `virtual_classrooms` | Video conferencing sessions (Jitsi/Zoom) |
| `breakout_rooms` | Breakout rooms within virtual classrooms |
| `breakout_room_participants` | Participants in breakout rooms |
| `collaborative_whiteboards` | Shared digital whiteboards |
| `whiteboard_elements` | Drawing elements on whiteboards |
| `tutoring_sessions` | Peer tutoring / mentoring sessions |
| `group_projects` | Group project workspaces |
| `project_tasks` | Tasks within group projects |
| `project_members` | Group project membership |

### Content Library Tables

| Table | Purpose |
|-------|---------|
| `content_library` | Shared content items with tags, ratings, usage stats |
| `content_library_ratings` | User ratings and reviews |
| `content_library_usage` | Usage tracking (when content is added to lessons) |
| `content_library_favorites` | Teacher bookmarks |

### Curriculum Builder Tables

| Table | Purpose |
|-------|---------|
| `curriculum_resources` | Resource library (videos, links, worksheets, activities) with tags and ratings |
| `curriculum_templates` | Reusable curriculum structure templates |
| `curriculum_resource_links` | Links resources to specific curriculum items (topics, units, SCOs) |
| `curriculum_editing_sessions` | Active collaborative editing sessions for curriculum |
| `curriculum_session_editors` | Users currently editing a curriculum with cursor position tracking |
| `curriculum_change_history` | Audit trail of all curriculum changes (create, update, delete, reorder) |
| `curriculum_ai_suggestions` | Cached AI-generated suggestions for curriculum items (activities, resources, assessments) |

### Curriculum Analytics Tables

| Table | Purpose |
|-------|---------|
| `curriculum_coverage` | Tracks which topics/units/SCOs have been covered per class-subject |
| `curriculum_time_allocation` | Planned vs actual time spent on curriculum items per term |
| `curriculum_outcome_achievement` | Per-student achievement status for each SCO (developing, achieved, exceeded) |
| `lesson_sco_mapping` | Maps lessons to specific SCOs they cover, with time spent |
| `curriculum_gaps` | Identifies gaps in curriculum coverage or achievement with severity levels |
| `curriculum_analytics_snapshots` | Periodic snapshots for historical tracking of coverage/achievement trends |

### Gamification Tables

| Table | Purpose |
|-------|---------|
| `student_gamification` | Per-student points, levels, XP, streaks, and rankings |
| `badges` | Badge definitions with type, category, rarity, and earning requirements |
| `student_badges` | Badges earned by students with context and display order |
| `leaderboards` | Leaderboard configurations (class, school, global, weekly, monthly) |
| `leaderboard_entries` | Student rank entries in leaderboards |
| `achievements` | Achievement definitions with criteria, progress type, and badge rewards |
| `student_achievements` | Student achievement progress tracking and unlocks |
| `points_transactions` | Full history of points earned (lesson complete, quiz pass, badge earned, etc.) |

### Social Learning Tables

| Table | Purpose |
|-------|---------|
| `discussion_forums` | Forums linked to class-subjects with moderation settings |
| `forum_topics` | Topics/threads (discussion, question, announcement, poll) with engagement stats |
| `forum_posts` | Threaded replies with flagging, best-answer marking, and like counts |
| `peer_review_assignments` | Peer review configurations with criteria, rubrics, and deadlines |
| `peer_reviews` | Individual peer reviews with per-criterion scores and quality feedback |

### Virtual Labs & AR/VR Tables

| Table | Purpose |
|-------|---------|
| `virtual_labs` | Lab/simulation definitions (science, math, chemistry, physics, biology) |
| `lab_sessions` | Student lab session records with state, actions log, and results |
| `arvr_content` | AR/VR content (3D models, AR overlays, VR experiences, virtual field trips) |
| `arvr_sessions` | Student AR/VR session records with interactions and screenshots |

### Adaptive Learning Tables

| Table | Purpose |
|-------|---------|
| `adaptive_learning_paths` | Personalized learning paths per student with mastery-based difficulty adjustment |
| `learning_path_stages` | Individual stages within learning paths with prerequisites and alternative content |

### Lesson Template Tables

| Table | Purpose |
|-------|---------|
| `lesson_templates` | Reusable lesson templates with ratings, tags, and usage stats |
| `lesson_template_content` | Content items structure within templates |
| `lesson_template_ratings` | Ratings and reviews for templates |
| `lesson_template_usage` | Tracks when templates are used to create lessons |
| `lesson_template_favorites` | Teacher bookmarks for templates |

### Teacher Collaboration Tables

| Table | Purpose |
|-------|---------|
| `content_comments` | Comments and discussions on library content and templates |
| `content_requests` | Teachers request specific content to be created (with priority and status) |
| `content_collaboration` | Multi-teacher collaboration on content (viewer, editor, co-owner roles) |
| `content_suggestions` | Suggestions for improving content (improvement, correction, enhancement) |

### Database Views

| View | Purpose |
|------|---------|
| `student_class_subjects_view` | Student's current class, subjects, and teachers |
| `teacher_class_subjects_view` | Teacher's assigned classes, forms, and subjects |

---

## 13. Data Hierarchy

The system follows a strict Caribbean secondary school hierarchy:

```
Institution (School)
  └── Form (Year Group: Form 1, Form 2, ... Form 7)
       └── Class (Stream: 3A, 3B, 3Science, 4Arts)
            ├── Students (enrolled via student_class_assignments)
            └── Subjects (linked via class_subjects ← subject_form_offerings)
                 ├── Lessons (individual periods/sessions)
                 │    ├── Lesson Content (files, videos, quizzes, interactive content)
                 │    └── Attendance (per-student per-lesson)
                 └── Assessments (tests, quizzes, SBAs, projects, exams)
                      └── Student Grades
```

### Key Relationships
- A **Form** belongs to a school and academic year
- A **Class** belongs to a form (e.g., Form 3 → Class 3A, 3B)
- **Subjects** are offered at the form level via `subject_form_offerings`
- Classes take subjects via `class_subjects` (junction table), with a teacher assigned per class-subject
- **Lessons** belong to a class-subject combination
- **Assessments** belong to a class-subject combination
- **Students** are assigned to classes (not directly to subjects — subject access is implied through class enrollment)

---

## 14. Notification System

### Types
| Type | Description | Trigger |
|------|-------------|---------|
| `assignment_due` | Assignment approaching deadline | Scheduled or manual |
| `grade_posted` | New grade available | When teacher submits grades |
| `announcement` | New announcement posted | When announcement created |
| `deadline_reminder` | Upcoming deadline | Scheduled |
| `system` | System-level messages | Admin actions |
| `lesson_posted` | New lesson content available | When content published |

### Preferences
Users can customize:
- Which notification types to receive
- Delivery methods (in-app, email, push)
- Quiet hours (e.g., 10 PM – 8 AM)
- Daily digest mode

### Database Functions
- `create_notification()` — Creates a notification respecting user preferences
- `mark_notifications_read()` — Marks specific or all notifications as read
- `get_unread_count()` — Returns unread notification count
- `archive_old_notifications()` — Archives notifications older than 30 days

---

## 15. Messaging System

### Features
- Conversation-based threading
- Multiple participants per conversation
- Student reference per conversation (for parent-teacher context)
- Real-time updates via Supabase Realtime (PostgreSQL publication)
- Unread tracking via `last_read_at` per participant
- Available to all roles

### Data Flow
1. User creates conversation → `conversations` table
2. Participants added → `conversation_participants` table
3. Messages sent → `messages` table (triggers Supabase Realtime)
4. Unread detection: compare `last_read_at` with message `created_at`

---

## 16. Collaboration System

### Session Types
1. **Document** — Real-time collaborative text editing with operational transforms
2. **Classroom** — Virtual classroom with video conferencing (Jitsi/Zoom), breakout rooms, chat, polls
3. **Whiteboard** — Shared digital whiteboard with drawing tools, shapes, text, sticky notes
4. **Tutoring** — Peer-to-peer tutoring/mentoring sessions with scheduling and feedback
5. **Project** — Group project management with tasks, milestones, team roles

### Virtual Classroom Features
- Video conferencing via Jitsi or Zoom integration
- Recording support
- Chat and raise-hand functionality
- Polls
- Breakout rooms with participant management

### Group Project Features
- Task management (TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED)
- Task assignments with priority levels
- Progress percentage tracking
- Due dates and estimated/actual hours
- Team roles (LEADER, MEMBER, OBSERVER)
- Task dependencies

---

## 17. Content Library

A shared repository where teachers can publish and discover reusable lesson content.

### Features
- **Search**: Full-text search across titles and descriptions, tag-based filtering
- **Ratings**: 1–5 star ratings with written reviews
- **Usage tracking**: Counts how many times content is added to lessons
- **Favorites**: Teachers can bookmark content for quick access
- **Filtering**: By content type, subject, form, tags, rating
- **Featured content**: Admin can mark content as featured
- **Verified content**: Admin can verify content quality
- **View counts**: Automatic view counter

### Supported Content Types
Files, links, videos, documents, images, quizzes, flashcards, interactive books, interactive videos, 3D models, AR content, assignments

---

## 18. Quiz & Assessment Engine

### Quiz Configuration
- Title, description, instructions
- Time limit (optional, in minutes)
- Passing score (percentage)
- Multiple attempts (configurable max)
- Show results immediately or after deadline
- Show/hide correct answers
- Randomize question order
- Randomize answer order
- Publish/unpublish

### Question Types
| Type | Auto-Graded | Description |
|------|-------------|-------------|
| `MULTIPLE_CHOICE` | Yes | Single correct answer from options |
| `TRUE_FALSE` | Yes | True or false |
| `SHORT_ANSWER` | Yes* | Text matching (case-sensitive or insensitive, partial match optional) |
| `ESSAY` | No | Free-text response, requires manual grading |
| `MATCHING` | Yes | Match items between two columns |
| `FILL_BLANK` | Yes* | Fill in missing words |

*Short answer and fill-in-the-blank support configurable matching rules.

### Student Attempt Tracking
- Attempt number, start time, submission time
- Time spent (seconds)
- Total points earned, percentage score
- Pass/fail determination
- Teacher feedback per attempt and per question

### Assessment Types (Subject Assessments)
| Type | Description |
|------|-------------|
| `TEST` | Regular test |
| `QUIZ` | Short quiz |
| `SBA` | School-Based Assessment (CXC component) |
| `PROJECT` | Project-based assessment |
| `MOCK_EXAM` | Practice exam |
| `EXAM` | Final/term exam |

Assessment weights, terms (1–3), and SBA component numbers support Caribbean examination board requirements.

---

## 19. Report Card System

### Workflow
1. **Draft** — School admin generates report cards for a class + term
2. **Review** — Teachers add subject grades, comments, and effort grades
3. **Published** — School admin/principal publishes, making visible to parents/students

### Report Card Contents
- **Student info**: Class, form, academic year, term
- **Attendance**: Days present, absent, late, total school days, attendance percentage
- **Conduct grade**: Overall behavior assessment
- **Subject grades**: Per subject — coursework average, exam mark, final mark, grade letter, effort grade, teacher comment
- **Comments**: Form teacher comment, principal comment
- **Statistics**: Overall average, class rank
- **Next term**: Expected start date

### PDF Export
- Report cards can be exported as PDF documents via `ReportCardPDFExporter`

---

## 20. Curriculum Management

### Built-in Curricula
The system includes pre-built curriculum guides aligned to SKN national standards:
- **Mathematics Form 1** — Full term-by-term breakdown
- **Mathematics Form 2** — Full term-by-term breakdown
- **Social Science Form 1** — Full term-by-term breakdown
- **Social Science Form 2** — Full term-by-term breakdown

These are accessible publicly (without login) and also via role-specific routes.

### Curriculum Builder
- Interactive curriculum builder with drag-and-drop unit organization
- Resource library for attaching materials to curriculum items
- Template system for saving and sharing curriculum structures
- Analytics for tracking curriculum coverage and effectiveness

### Curriculum AI Service
- AI-powered curriculum suggestions and content generation (`curriculumAIService.js`)
- Auto-tagging of content to curriculum standards (`autoTaggingService.js`)

### Curriculum Exporter
- Export curriculum documents in structured formats (`CurriculumExporter.js`)

---

## 21. Student Information Management

### Student Profiles
Comprehensive student records including:
- **Academic**: Student number, enrollment date, GPA, cumulative GPA, class rank, credits
- **Personal**: Date of birth, gender, nationality, place of birth, blood type, religion
- **Contact**: Phone numbers, addresses (home, mailing), city, parish, country
- **Emergency**: Two emergency contacts with name, relationship, phone, email
- **Family**: Guardian information (name, relationship, phone, email, occupation, address)
- **Health**: Medical conditions, allergies, medications, doctor info, insurance, health notes
- **Behavioral**: Concerns, strengths, counseling services, counseling notes

### Lifecycle Tracking
Events tracked throughout a student's journey:
- ENROLLMENT, TRANSFER_IN, TRANSFER_OUT
- PROMOTION (advancing to next form)
- RETENTION (repeating a form)
- GRADUATION
- DROPPED_OUT
- SUSPENSION, EXPULSION, RETURN

### Transfer Management
Full transfer workflow:
- Transfer types: INCOMING, OUTGOING, INTERNAL
- Status workflow: PENDING → APPROVED → COMPLETED (or REJECTED)
- Document tracking: Transcript required/received, acceptance letters
- Financial: Fees paid, outstanding balance

### Special Needs / IEP
- Need types: LEARNING_DISABILITY, PHYSICAL_DISABILITY, BEHAVIORAL, MEDICAL, GIFTED, OTHER
- IEP management: Goals, services, review dates, documents
- Accommodation types: TESTING, INSTRUCTIONAL, ENVIRONMENTAL, BEHAVIORAL, TECHNOLOGY
- Support team assignment: Case manager, special education teacher, counselor
- Effectiveness monitoring and review tracking

### Disciplinary Records
- Incident types: MINOR_INFRACTION, MAJOR_INFRACTION, VIOLENCE, DRUGS, THEFT, VANDALISM, DISRESPECT, TRUANCY, OTHER
- Severity levels: MINOR, MODERATE, MAJOR, SEVERE
- Actions: VERBAL_WARNING, WRITTEN_WARNING, DETENTION, SUSPENSION, EXPULSION, PARENT_MEETING, COUNSELING
- Full investigation workflow: Reporting → Investigation → Review → Resolution
- Parent notification tracking (method, response, meeting notes)
- Appeal process (filed, status, decision)
- Evidence and witness statement documentation

---

## 22. Gamification System

### Points & Leveling
- **Points**: Earned for lesson completion, quiz passes, assignment submissions, badge earning, bonuses
- **Levels**: XP-based leveling system with configurable thresholds per level
- **Streaks**: Consecutive daily activity tracking (current and longest streak)
- **Statistics**: Lessons completed, quizzes passed, assignments submitted, perfect scores

### Badges
- **Types**: Achievement, Milestone, Special, Event
- **Categories**: Academic, Social, Creativity, Leadership
- **Rarity tiers**: Common, Uncommon, Rare, Epic, Legendary
- **Requirements**: Configurable JSONB criteria for earning badges
- **Points reward**: Each badge awards configurable points

### Leaderboards
- **Scopes**: Class, School, Global, Subject
- **Periods**: Daily, Weekly, Monthly, Yearly, All-Time
- **Ranking criteria**: Points, Level, Streak, or Perfect Scores
- **Display**: Public or private, max 100 rankings

### Achievements
- **Progress tracking**: Count, Percentage, Score, or Time-based
- **Linked badges**: Achievements can unlock specific badges
- **Categories**: Academic, Social, Milestone, Special
- **Student progress**: Tracked incrementally until unlocked

---

## 23. Social Learning

### Discussion Forums
- **Scope**: Linked to class-subjects
- **Topic types**: Discussion, Question, Announcement, Poll
- **Moderation**: Optional approval-required mode, content flagging
- **Engagement**: View counts, reply counts, like counts
- **Features**: Pinned topics, locked threads, best-answer marking for Q&A

### Peer Reviews
- **Configuration**: Min/max reviews per submission, weighted review criteria, detailed rubrics
- **Anonymity**: Optional anonymous reviews
- **Workflow**: Submission deadline → Review deadline → Results release
- **Quality**: Reviewees can rate review helpfulness; auto-assign or manual assignment
- **Types**: Peer, Self, Instructor review modes

---

## 24. Virtual Labs & AR/VR

### Virtual Labs
- **Lab types**: Science, Math, Chemistry, Physics, Biology
- **Simulation types**: Interactive, Animation, 3D Model, VR
- **Features**: Configurable initial state, reset capability, time limits
- **Session tracking**: Full state logging, actions log, results, observations, conclusions
- **Resources**: Instructions, videos, and 3D model files per lab

### AR/VR Content
- **Content types**: 3D Models, AR Overlays, VR Experiences, Virtual Field Trips
- **Platforms**: WebXR, ARKit, ARCore, Custom
- **Model formats**: GLTF, OBJ, FBX, USDZ
- **Interaction modes**: View Only, Interactive, Guided Tour
- **3D properties**: Scale, rotation, position, animations, annotations
- **Location-based AR**: GPS coordinates for location-triggered AR content
- **Session tracking**: Interaction logs, screenshots, completion percentage, time spent

---

## 25. Adaptive Learning

### Learning Paths
- **Path types**: Performance-Based, Interest-Based, Mixed
- **Mastery levels**: Beginner, Intermediate, Advanced, Expert
- **Difficulty adjustment**: Automatic difficulty scaling (Easy → Medium → Hard → Expert)
- **Adaptation rules**: Configurable JSONB rules for path adjustments

### Learning Path Stages
- **Content types**: Lesson, Quiz, Assignment, Project, Simulation
- **Prerequisites**: Required stages or competencies before advancing
- **Adaptive branching**: Alternative content if student struggles at a stage
- **Attempt tracking**: Score, attempts, estimated vs actual duration per stage

---

## 26. Lesson Templates

### Template System
- **Structure**: Full lesson structure with title, objectives, plan, homework, duration
- **Content items**: Ordered content blocks with type, instructions, key concepts, activities
- **Sharing**: Public or private, with tags for searchability
- **Featured**: Admin can feature templates for discovery
- **Versioning**: Version tracking for template updates

### Template Ecosystem
- **Ratings & reviews**: 1-5 star ratings with text reviews
- **Usage tracking**: Records which lessons were created from which templates
- **Favorites**: Teachers can bookmark templates for quick access
- **Statistics**: View count, use count, rating average

---

## 27. Teacher Collaboration

### Content Comments
- **Threaded**: Nested replies on library content and templates
- **Resolution**: Comments can be marked as resolved
- **Helpfulness**: Users can rate comments as helpful

### Content Requests
- **Workflow**: Teachers request specific content types for subjects/forms
- **Priority**: Low, Normal, High, Urgent
- **Status**: Open → In Progress → Fulfilled (or Closed)
- **Fulfillment**: Links to the content library item that fulfills the request

### Content Collaboration
- **Roles**: Viewer, Editor, Co-Owner
- **Scope**: Applied to library content or lesson templates
- **Invitations**: Track who invited whom and when they joined

### Content Suggestions
- **Types**: Improvement, Correction, Enhancement, Tag
- **Workflow**: Pending → Accepted/Rejected → Implemented
- **Review**: Track who reviewed and when

---

## 28. Server-Side API

### 28.1 Express Server (Node.js)

The Express server (`server.js`) exposes three endpoints:

### `POST /api/ai/chat`
- **Purpose**: General AI chat proxy
- **Auth**: None (API key stored server-side)
- **Body**: Standard OpenAI chat completion request
- **Response**: OpenAI API response

### `POST /api/ai/tutor`
- **Purpose**: AI Tutor with Socratic system prompt and tool calling
- **Auth**: None (API key stored server-side)
- **Body**: `{ messages, studentProfile, currentContext }`
- **Response**: OpenAI response + optional `resources` object (YouTube videos, web links)
- **Features**:
  - Constructs system prompt server-side from student profile and context
  - Supports OpenAI function calling for YouTube and web search
  - Retry logic with exponential backoff (1s, 3s, 6s) for 503/429 errors
  - 30-minute search result cache

### `GET *` (SPA Fallback)
- **Purpose**: Serves the React frontend for all non-API routes

### 28.2 Java Microservices API (Spring Boot)

The Java microservices expose 80+ REST endpoints via the API Gateway (port 8080):

#### Authentication (`/api/auth`)
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/login` | Email/password login, returns JWT |
| `POST` | `/auth/login-ad` | Active Directory login |
| `POST` | `/auth/register` | Register new user (default: STUDENT) |
| `POST` | `/auth/forgot-password` | Request password reset token (24h validity) |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/validate-reset-token` | Validate a reset token |

#### User Management (`/api/users`)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/users` | List all users (Admin) |
| `GET` | `/users/{id}` | Get user by ID (Admin) |
| `GET` | `/users/role/{role}` | Get users by role (Admin) |
| `GET` | `/users/profile` | Get current user's profile |
| `POST` | `/users` | Create new user (Admin) |
| `PUT` | `/users/{id}` | Update user (Admin) |
| `PUT` | `/users/profile` | Update own profile |
| `PUT` | `/users/{id}/activate` | Activate user (Admin) |
| `PUT` | `/users/{id}/deactivate` | Deactivate user (Admin) |
| `PUT` | `/users/change-password` | Change own password |
| `GET` | `/users/stats` | User statistics (Admin) |

#### Dashboard & Analytics (`/api/dashboard`, `/api/analytics`)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/dashboard/stats` | Dashboard statistics (Admin) |
| `GET` | `/dashboard/students` | Filtered student list (Admin) |
| `GET` | `/analytics/users/trends` | User registration trends (Admin) |
| `GET` | `/analytics/users/by-role` | User distribution by role (Admin) |
| `GET` | `/analytics/system/health` | System health metrics (Admin) |
| `GET` | `/analytics/courses/trends` | Course creation trends (Admin) |
| `GET` | `/analytics/enrollments/trends` | Enrollment trends (Admin) |
| `GET` | `/analytics/courses/by-department` | Courses by department (Admin) |

#### Course Management (`/api/courses`)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/courses` | List all courses |
| `GET` | `/courses/active` | List active courses only |
| `GET` | `/courses/{id}` | Get course by ID |
| `GET` | `/courses/code/{code}` | Get course by code |
| `GET` | `/courses/department/{departmentId}` | Courses by department |
| `POST` | `/courses` | Create course (Admin) |
| `PUT` | `/courses/{id}` | Update course (Admin) |
| `PUT` | `/courses/{id}/activate` | Activate course (Admin) |
| `PUT` | `/courses/{id}/deactivate` | Deactivate course (Admin) |
| `DELETE` | `/courses/{id}` | Delete course (Admin) |

#### Enrollment Management (`/api/enrollments`)
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/enrollments` | Request enrollment (Student) |
| `GET` | `/enrollments/{id}` | Get enrollment by ID |
| `GET` | `/enrollments/course/{courseId}` | Enrollments for a course |
| `GET` | `/enrollments/student/{studentId}` | Enrollments for a student |
| `GET` | `/enrollments/pending` | Pending enrollment requests (Admin) |
| `PUT` | `/enrollments/{id}/approve` | Approve enrollment (Admin) |
| `PUT` | `/enrollments/{id}/reject` | Reject enrollment (Admin) |
| `PUT` | `/enrollments/{id}/drop` | Drop enrollment |
| `PUT` | `/enrollments/{id}/complete` | Mark completed with grade |

#### Course Content (`/api/course-contents`)
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/course-contents` | Create content (Instructor) |
| `GET` | `/course-contents/course/{courseId}` | Get content for a course |
| `GET` | `/course-contents/{contentId}` | Get content by ID |
| `PUT` | `/course-contents/{contentId}` | Update content (Instructor) |
| `DELETE` | `/course-contents/{contentId}` | Delete content (Instructor) |

#### Submissions (`/api/submissions`)
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/submissions` | Submit assignment (Student) |
| `GET` | `/submissions/assignment/{contentId}` | Submissions for an assignment |
| `GET` | `/submissions/student/{studentId}` | Submissions by student |
| `GET` | `/submissions/ungraded` | Ungraded submissions (Instructor) |
| `PUT` | `/submissions/{id}/grade` | Grade a submission (Instructor) |

#### Instructor Assignments
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/{courseId}/instructors/{instructorId}` | Assign instructor (Admin) |
| `DELETE` | `/{courseId}/instructors/{instructorId}` | Remove instructor (Admin) |
| `GET` | `/courses/instructor/{instructorId}` | Courses by instructor |

#### Institutions (`/api/institutions`)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/institutions` | List all institutions |
| `GET` | `/institutions/{id}` | Get institution by ID |
| `POST` | `/institutions` | Create institution (Admin) |
| `PUT` | `/institutions/{id}` | Update institution (Admin) |
| `DELETE` | `/institutions/{id}` | Delete institution (Admin) |
| `GET` | `/institutions/{id}/departments` | Departments in institution |
| `GET` | `/institutions/{id}/stats` | Institution statistics (Admin) |

#### Departments (`/api/departments`)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/departments` | List all departments |
| `GET` | `/departments/{id}` | Get department by ID |
| `GET` | `/departments/code/{code}` | Get by code |
| `POST` | `/departments` | Create department (Admin) |
| `PUT` | `/departments/{id}` | Update department (Admin) |
| `DELETE` | `/departments/{id}` | Delete department (Admin) |

---

## 29. Third-Party Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Supabase** | Database, Auth, Storage, Realtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| **OpenAI** | AI Tutor (GPT-4o-mini) | `OPENAI_API_KEY` |
| **YouTube Data API v3** | Educational video search for tutor | `YOUTUBE_API_KEY` |
| **Google Custom Search** | Educational web resource search for tutor | `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` |
| **Active Directory / LDAP** | Enterprise SSO login | AD server configuration |
| **Jitsi / Zoom** | Virtual classroom video conferencing | Meeting URL/ID configuration |
| **Heroku** | Deployment platform | `Procfile` configured |

---

## Appendix: Frontend Service Files

| Service | Purpose |
|---------|---------|
| `authServiceSupabase.jsx` | Login, register, password reset via Supabase Auth |
| `supabaseService.jsx` | Facade aggregating all domain services |
| `userService.js` | User CRUD, profile management |
| `classService.js` | Class, form, subject, lesson, attendance, grade queries |
| `studentService.js` | Student data, grades, class assignments |
| `adminService.jsx` / `adminServiceSupabase.jsx` | Admin dashboard stats, user management |
| `instructorService.jsx` | Teacher-specific data queries |
| `institutionService.js` | Institution CRUD, branding |
| `parentService.js` | Parent portal data (children, grades, attendance, discipline) |
| `dashboardService.js` | Dashboard statistics aggregation |
| `storageService.js` | Supabase Storage file upload/download |
| `fileService.js` | File handling utilities |
| `contentLibraryService.js` | Content library CRUD, search, ratings |
| `lessonTemplateService.js` | Lesson template CRUD |
| `interactiveContentService.js` | Interactive books, flashcards, videos |
| `collaborationService.js` | Collaboration session management |
| `teacherCollaborationService.js` | Teacher-specific collaboration features |
| `notificationService.js` | Notification CRUD and preferences |
| `messageService.js` | Messaging CRUD, conversation management |
| `reportService.js` | Report generation queries |
| `reportCardService.js` | Report card CRUD and generation |
| `ReportCardPDFExporter.js` | PDF generation for report cards |
| `ReportPDFExporter.js` | General PDF report generation |
| `tutorService.js` | AI Tutor conversation management |
| `progressService.js` | Learner progress tracking |
| `studentGoalService.js` | Student learning goal management |
| `studentInformationService.js` | Student profile, lifecycle, special needs, discipline |
| `curriculumAnalyticsService.js` | Curriculum analytics queries |
| `curriculumAIService.js` | AI-powered curriculum suggestions |
| `autoTaggingService.js` | Auto-tag content to curriculum standards |
| `CurriculumExporter.js` | Export curriculum documents |
| `searchService.js` | Global search across content |
| `recommendationService.js` | Content recommendations |
| `recentlyViewedService.js` | Recently viewed items tracking |
| `analyticsService.jsx` | Analytics data queries |
| `youtubeService.jsx` | YouTube API integration (client-side) |
| `aiLessonService.jsx` | AI-assisted lesson planning |
| `learnerProgressService.js` | Learner progress CRUD |
