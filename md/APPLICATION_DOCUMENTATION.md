# LaunchPad SKN - Complete Application Documentation

## Caribbean Secondary School Learning Management System

**Version:** 1.0.0
**Platform:** Web Application (Full-Stack)
**Target Region:** Federation of Saint Kitts and Nevis

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Backend - Node.js Express Server](#3-backend---nodejs-express-server)
4. [Java Microservices](#4-java-microservices)
5. [Frontend - React Application](#5-frontend---react-application)
6. [Database Schema](#6-database-schema)
7. [Authentication & Security](#7-authentication--security)
8. [Feature Catalog](#8-feature-catalog)
9. [API Reference](#9-api-reference)
10. [Deployment & Configuration](#10-deployment--configuration)

---

## 1. System Architecture Overview

LaunchPad SKN uses a hybrid architecture:

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│  React SPA  │────▶│  Node.js/Express │────▶│  Supabase (PostgreSQL)   │
│  (Vite)     │     │  (port 3000)     │     │  + Supabase Auth         │
└─────────────┘     └──────────────────┘     └──────────────────────────┘
       │
       │            ┌──────────────────┐
       └───────────▶│  API Gateway     │
                    │  (port 8080)     │
                    └───────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                  ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
  │ User Service │ │ Institution  │ │ Course Service   │
  │ (port 8090)  │ │ Service 8091 │ │ (port 8092)      │
  └──────────────┘ └──────────────┘ └──────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
  ┌──────────────────────────────────────────────────┐
  │          Config Server (port 8888)               │
  │          Discovery/Eureka (port 8761)            │
  └──────────────────────────────────────────────────┘
```

**Key Components:**
- **Frontend:** React 19 SPA with Vite build tool
- **Primary Backend:** Node.js/Express serving AI tutor and static assets
- **Microservices:** Spring Boot Java services for domain management
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Service Discovery:** Netflix Eureka
- **API Gateway:** Spring Cloud Gateway (WebFlux)
- **Configuration:** Spring Cloud Config Server

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI Framework |
| React Router DOM | 7.3.0 | Client-side routing |
| Vite | 7.2.4 | Build tool & dev server |
| TailwindCSS | 3.4.18 | Utility-first CSS |
| Bootstrap | 5.3.3 | UI component framework |
| React Bootstrap | 2.10.9 | Bootstrap React wrappers |
| TanStack React Query | 5.90.10 | Server state management |
| Supabase JS | 2.78.0 | Backend-as-a-Service client |
| Axios | 1.8.2 | HTTP requests |
| Recharts | 3.5.0 | Data visualization |
| TinyMCE | 8.2.2 | Rich text editor |
| Three.js | 0.170.0 | 3D graphics engine |
| A-Frame | - | WebXR/VR support |
| PDF.js / jsPDF | - | PDF handling |
| Lucide React | 0.263.1 | Icon library |
| Date-fns | 4.1.0 | Date utilities |
| DOMPurify | 3.3.1 | HTML sanitization |

### Backend (Node.js)
| Technology | Purpose |
|---|---|
| Express 4.21.0 | HTTP server framework |
| OpenAI API | AI tutor integration |
| YouTube API v3 | Educational video search |
| Google Custom Search API | Web resource search |

### Backend (Java Microservices)
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Language runtime |
| Spring Boot | 3.5.6 | Application framework |
| Spring Cloud | 2025.0.0 | Cloud infrastructure |
| Spring Security | - | Authentication/Authorization |
| Spring Data JPA | - | Database ORM |
| JJWT | 0.11.5 | JWT token management |
| Spring LDAP | - | Active Directory integration |
| SpringDoc OpenAPI | 2.2.0 | API documentation |
| PostgreSQL Driver | - | Database connectivity |
| Lombok | - | Boilerplate reduction |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| Supabase | PostgreSQL hosting + Auth + Storage |
| Netflix Eureka | Service discovery |
| Spring Cloud Config | Centralized configuration |
| Heroku | Deployment platform |

---

## 3. Backend - Node.js Express Server

**File:** `server.js` | **Port:** 3000

### 3.1 Server Configuration
- Express with JSON body parsing (50KB limit)
- Serves React build from `/frontend/build`
- SPA fallback: all non-API routes serve `index.html`

### 3.2 API Endpoints

#### POST `/api/ai/chat` - Generic AI Proxy
- **Purpose:** Forward chat requests to OpenAI API with server-side key management
- **Request Body:** Standard OpenAI chat completion format
- **Response:** OpenAI completion response
- **Auth:** Requires `OPENAI_API_KEY` environment variable
- **Error:** 500 if API key not configured

#### POST `/api/ai/tutor` - AI Tutor Endpoint
- **Purpose:** Specialized educational tutor with Socratic teaching method
- **Model:** GPT-4o-mini (temperature 0.7, max tokens 800)
- **Request Schema:**
  ```json
  {
    "messages": [{ "role": "user/assistant", "content": "..." }],
    "studentProfile": {
      "name": "string",
      "gradeLevel": "string",
      "specialNeeds": "string (optional)",
      "accommodations": "string (optional)"
    },
    "currentContext": {
      "subjectName": "string",
      "lessonTitle": "string",
      "lessonTopic": "string",
      "learningObjectives": "string"
    }
  }
  ```

### 3.3 AI Tutor Tool Calling

The tutor uses OpenAI function calling to dynamically search external resources:

**Tool 1: `search_youtube_videos`**
- Searches YouTube API v3 for educational videos
- Restricted to educational category (ID: 27)
- Safe search: strict
- 30-minute cache TTL for identical queries
- Returns: `videoId`, `title`, `description`, `thumbnail`, `channelTitle`, `url`

**Tool 2: `search_web_resources`**
- Searches Google Custom Search API
- 30-minute cache TTL
- Returns: `title`, `url`, `snippet`, `source`

### 3.4 AI Tutor System Prompt

Function `buildTutorSystemPrompt(studentProfile, currentContext)` configures:

**Language Rules:**
- Simplified vocabulary for student age/grade
- Short sentences, one idea per sentence
- Mathematical formulas in student-friendly format
- Max 2-3 short paragraphs per response

**Core Teaching Rules (Absolute):**
1. NEVER solve entire homework/quiz problems
2. NEVER write essays or complete submittable work
3. NEVER provide final answers without student effort
4. Ask "Do you remember...?" before giving formulas
5. Verify all student work - check math, confirm correctness
6. Never praise wrong work
7. Name mistakes clearly

**Teaching Methodology:**
- Socratic method (questions before answers)
- Caribbean-context examples (mangoes, cricket, markets)
- Break-apart method for calculations
- Hints not answers
- Practice problems after errors
- Resource integration (search only when beneficial)

### 3.5 Admin User Creation Script

**File:** `create-admin-user-script.js`
- Creates admin user in Supabase Auth
- Default credentials: `admin@launchpadskn.com` / `Admin123!`
- Links auth user to database `users` table
- Creates UUID index on users table

---

## 4. Java Microservices

### 4.1 Config Server (Port 8888)

**Purpose:** Centralized configuration management for all microservices

- **Annotation:** `@EnableConfigServer`
- **Storage:** Native classpath + optional Git repository
- **Served Configs:**
  - `application.yml` - General settings
  - `user-service.yml` - JWT secret, token expiration (24h)

### 4.2 Discovery Service (Port 8761)

**Purpose:** Service registry and discovery using Netflix Eureka

- **Annotation:** `@EnableEurekaServer`
- **Self-registration:** Disabled
- **Self-preservation:** Disabled
- **Eviction interval:** 10 seconds

### 4.3 API Gateway (Port 8080)

**Purpose:** Central request router with CORS handling

**Routes:**

| Route | Path | Target Service |
|---|---|---|
| Auth | `/api/auth/**` | `lb://user-service` |
| Users | `/api/users/**` | `lb://user-service` |
| Institutions | `/api/institutions/**` | `lb://institution-service` |
| Departments | `/api/departments/**` | `lb://institution-service` |
| Courses | `/api/courses/**` | `lb://course-service` |
| Enrollments | `/api/enrollments/**` | `lb://course-service` |
| Course Contents | `/api/course-contents/**` | `lb://course-service` |
| Submissions | `/api/submissions/**` | `lb://course-service` |
| Instructors | `/api/instructors/**` | `lb://course-service` |
| Dashboard | `/api/dashboard/**` | `lb://user-service` |
| Eureka Web | `/eureka/web` | `http://localhost:8761` |

**CORS:** Allows `http://localhost:3000`, all methods, all headers, credentials enabled

### 4.4 User Service (Port 8090)

**Purpose:** Authentication, registration, and user profile management

#### Models

**User:**
- `userId` (PK), `name`, `email` (unique), `password`, `role` (ADMIN/INSTRUCTOR/STUDENT)
- `phone`, `dateOfBirth`, `address`, `emergencyContact`
- `isActive`, `createdAt`, `lastLogin`, `isFirstLogin`, `departmentId`

**PasswordResetToken:**
- Token-based password reset with expiration

#### Controllers

**AuthController (`/auth`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/auth/login` | Local database authentication; returns JWT token |
| POST | `/auth/login-ad` | Active Directory/LDAP authentication |
| POST | `/auth/register` | User registration with student fields |
| POST | `/auth/forgot-password` | Generate password reset token |
| POST | `/auth/reset-password` | Reset password using token |
| GET | `/auth/validate-reset-token` | Validate token expiration |

**UserController (`/api/users`):**

| Method | Endpoint | Function |
|---|---|---|
| GET | `/api/users` | List all users (Admin) |
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/role/{role}` | Filter users by role |
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update current user profile |
| PUT | `/api/users/{id}` | Update user (Admin) |
| PUT | `/api/users/{id}/activate` | Activate user account |
| PUT | `/api/users/{id}/deactivate` | Deactivate user account |
| PUT | `/api/users/change-password` | Change password |
| POST | `/api/users` | Create user (Admin) |
| GET | `/api/users/stats` | Get user statistics |
| GET | `/api/users/debug-auth` | Debug auth status |

**AnalyticsController:** User analytics and reporting
**DashboardController:** User dashboard data aggregation

#### Services
- `AuthService` - Authentication logic, JWT generation, AD integration
- `UserService` - User CRUD, profile management
- `JwtService` - JWT token creation and validation
- `CustomUserDetailsService` - Spring Security integration
- `LdapAuthenticationService` - Active Directory authentication
- `AnalyticsService` - Analytics computation
- `DashboardService` - Dashboard data preparation

#### LDAP/Active Directory Configuration
```
URL: ldap://192.168.154.5:389
Base: DC=mylab,DC=local
Service Account: scholarspace-svc@mylab.local
User Search Base: OU=ScholarSpace
User Search Filter: (|(userPrincipalName={0})(sAMAccountName={0}))
```

### 4.5 Institution Service (Port 8091)

**Purpose:** Manage educational institutions and departments

#### Models

**Institution:**
- `institutionId` (PK), `name` (unique), `location`, `contact`
- `phone`, `website`, `establishedYear`, `type`
- `createdAt`

**Department:**
- `departmentId` (PK), `name`, `code`, `description`
- `headOfDepartment`, `email`, `officeLocation`
- `institution` (FK), `createdAt`

#### Controllers

**InstitutionController (`/api/institutions`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/institutions` | Create institution (Admin) |
| GET | `/api/institutions` | List all institutions |
| GET | `/api/institutions/{id}` | Get by ID |
| GET | `/api/institutions/name/{name}` | Get by name |
| PUT | `/api/institutions/{id}` | Update institution (Admin) |
| DELETE | `/api/institutions/{id}` | Delete institution (Admin) |
| GET | `/api/institutions/{id}/departments` | Get departments |
| GET | `/api/institutions/{id}/stats` | Get statistics |

**DepartmentController (`/api/departments`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/departments` | Create department (Admin) |
| GET | `/api/departments` | List all departments |
| GET | `/api/departments/{id}` | Get by ID |
| GET | `/api/departments/code/{code}` | Get by code |
| GET | `/api/departments/institution/{id}` | Get by institution |
| PUT | `/api/departments/{id}` | Update department (Admin) |
| DELETE | `/api/departments/{id}` | Delete department (Admin) |
| GET | `/api/departments/{id}/stats` | Get statistics |

### 4.6 Course Service (Port 8092)

**Purpose:** Course management, enrollments, content, submissions, and lesson planning

#### Models

**Course:**
- `courseId` (PK), `code` (unique), `title`, `description`
- `creditHours`, `semester`, `academicYear`
- `departmentId` (FK), `prerequisites` (M2M), `isActive`, `createdAt`

**Enrollment:**
- `enrollmentId` (PK), `course` (FK), `studentId` (FK)
- `enrollmentDate`, `status` (PENDING/ACTIVE/COMPLETED/DROPPED)
- `grade`, `createdAt`

**CourseContent:**
- `contentId` (PK), `course` (FK), `type`, `title`
- `description`, `content/filePath`, `sequence`, `createdAt`

**Submission:**
- `submissionId` (PK), `assignment` (FK), `studentId` (FK)
- `submissionDate`, `filePath`, `grade`, `feedback`
- `gradedBy`, `gradedAt`, `createdAt`

**Lesson:**
- `lessonId` (PK), `classSubjectId` (FK)
- `lessonTitle`, `lessonDate`, `startTime`, `endTime`
- `location`, `lessonNumber`, `topic`
- `learningObjectives`, `lessonPlan`
- `homeworkDescription`, `homeworkDueDate`
- `status` (SCHEDULED/COMPLETED/CANCELLED/ABSENT)
- `attendanceTaken`, `createdBy`, `createdAt`, `updatedAt`

**Additional Models:** `CourseInstructor`, `AttendanceRecord`, `Subject`, `Form`, `SchoolClass`, `ClassSubject`, `SubjectFormOffering`

#### Controllers

**CourseController (`/api/courses`):**

| Method | Endpoint | Function |
|---|---|---|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create course (Admin) |
| GET | `/api/courses/{id}` | Get course by ID |
| PUT | `/api/courses/{id}` | Update course |
| DELETE | `/api/courses/{id}` | Delete course |

**EnrollmentController (`/api/enrollments`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/enrollments` | Create enrollment |
| GET | `/api/enrollments` | List enrollments |
| PUT | `/api/enrollments/{id}/status` | Update status |
| PUT | `/api/enrollments/{id}/grade` | Assign grade |

**CourseContentController (`/api/course-contents`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/course-contents` | Upload content |
| GET | `/api/course-contents/course/{id}` | Get by course |
| DELETE | `/api/course-contents/{id}` | Delete content |

**SubmissionController (`/api/submissions`):**

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/submissions` | Submit assignment |
| GET | `/api/submissions/assignment/{id}` | Get by assignment |
| PUT | `/api/submissions/{id}/grade` | Grade submission |

**InstructorAssignmentController (`/api/instructors`):**
- Assign instructors to courses
- Manage instructor roles

**File Upload Config:** Max file: 10MB, Max request: 15MB

---

## 5. Frontend - React Application

### 5.1 Project Configuration

**Build Tool:** Vite 7.2.4
**Entry Point:** `frontend/src/main.jsx`
**Build Output:** `frontend/build/`

### 5.2 State Management

**Context Providers (nesting order):**

1. **QueryClientProvider** - TanStack React Query
   - Stale time: 5 minutes
   - Cache time: 30 minutes
   - Refetch on window focus: disabled
   - Retry: 1

2. **AuthProvider** (`AuthContextSupabase.jsx`)
   - State: `user`, `isAuthenticated`, `isLoading`, `lastLoginTime`
   - Functions: `login()`, `logout()`, `register()`, `updateUserProfile()`, `sendPasswordResetEmail()`, `resetPassword()`
   - Features: Session persistence, profile lazy loading, token refresh

3. **ToastProvider** (`ToastContext.jsx`)
   - Functions: `addToast()`, `showSuccess()`, `showError()`, `showWarning()`, `showInfo()`, `removeToast()`
   - Auto-dismissal with configurable duration

4. **NotificationsProvider** (`NotificationsContext.jsx`)
   - Functions: `fetchNotifications()`, `fetchUnreadCount()`, `markNotificationAsRead()`, `refreshNotifications()`, `subscribeToRealtimeNotifications()`
   - Real-time subscription via Supabase

5. **SidebarProvider** (`SidebarContext.jsx`)
   - Functions: `toggleCollapse()`, `toggleMobile()`, `closeMobile()`
   - Persists to localStorage

6. **BreadcrumbProvider** (`BreadcrumbContext.jsx`)
   - Dynamic breadcrumb management

7. **ThemeProvider** (`ThemeContext.jsx`)
   - Dark mode/theme management

8. **TutorProvider** (`TutorContext.jsx`)
   - Functions: `toggleTutor()`, `closeTutor()`, `sendMessage()`, `loadConversation()`, `loadConversationHistory()`, `startNewConversation()`
   - State: `isOpen`, `isEnabled`, `messages`, `conversationHistory`, `currentContext`
   - Derives context from current route

### 5.3 Routing Structure

#### Public Routes (No authentication required)

| Path | Component | Description |
|---|---|---|
| `/` | Homepage | Marketing landing page |
| `/login` | Login | Authentication form |
| `/register` | Register | User registration |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password` | ResetPassword | Password reset form |
| `/curriculum/*` | CurriculumAccess | Public curriculum pages |

#### Student Routes (Role: STUDENT)

| Path | Component | Description |
|---|---|---|
| `/student/dashboard` | StudentDashboard | Main learning hub |
| `/student/subjects` | SubjectList | All enrolled subjects |
| `/student/subjects/:classSubjectId` | SubjectView | Subject details/lessons |
| `/student/lessons/:lessonId` | LessonViewStream | Lesson content viewer |
| `/student/quizzes/:contentId` | StudentQuizView | Quiz/assessment interface |
| `/student/assignments/:assessmentId/submit` | AssignmentSubmission | Submit assignments |
| `/student/courses/register` | CourseRegistration | Course enrollment |
| `/student/curriculum/*` | CurriculumAccess | Curriculum access |
| `/student/progress` | ProgressDashboard | Progress visualization |
| `/student/help` | StudentHelpPage | Help center |

#### Teacher/Instructor Routes (Role: INSTRUCTOR)

| Path | Component | Description |
|---|---|---|
| `/teacher/dashboard` | TeacherDashboard | Teacher overview |
| `/teacher/classes/:classId` | TeacherClassManagement | Class management |
| `/teacher/lessons/create` | LessonPlanning | Create lessons |
| `/teacher/lessons/:lessonId` | TeacherLessonView | Edit/preview lessons |
| `/teacher/lessons/:lessonId/content` | LessonContentManager | Content management |
| `/teacher/lessons/:lessonId/attendance` | AttendanceMarking | Mark attendance |
| `/teacher/assessments/:assessmentId/grades` | GradeEntry | Enter grades |
| `/teacher/class-subjects/:classSubjectId/gradebook` | Gradebook | Grade overview |
| `/teacher/content-library` | ContentLibrary | Reusable content |
| `/teacher/lesson-templates` | LessonTemplateLibrary | Template library |
| `/teacher/curriculum` | CurriculumView | Curriculum viewer |
| `/teacher/students/:studentId` | StudentProfileView | Student profile |
| `/teacher/report-cards` | TeacherReportCardComments | Report card feedback |
| `/teacher/tutor-settings` | TutorSettings | AI tutor config |
| `/teacher/help` | TeacherHelpPage | Help center |

#### Admin Routes (Role: ADMIN)

| Path | Component | Description |
|---|---|---|
| `/admin/dashboard` | AdminDashboard | System overview |
| `/admin/forms` | FormManagement | Form/year management |
| `/admin/classes` | ManageClasses | Class setup |
| `/admin/subjects` | ManageSubjects | Subject configuration |
| `/admin/students` | StudentAssignment | Student management |
| `/admin/instructors` | ManageInstructors | Teacher management |
| `/admin/courses` | ManageCourses | Course CRUD |
| `/admin/departments` | ManageDepartments | Department management |
| `/admin/users` | UserManagement | User CRUD |
| `/admin/arvr-content` | ARVRContentManager | AR/VR management |
| `/admin/help` | AdminHelpPage | Help center |

#### School Admin Routes (Role: SCHOOL_ADMIN)

| Path | Component | Description |
|---|---|---|
| `/school-admin/dashboard` | SchoolAdminDashboard | School-level overview |
| `/school-admin/forms` | FormManagement | Academic forms |
| `/school-admin/classes` | ManageClasses | Class management |
| `/school-admin/subjects` | ManageSubjects | Subject management |
| `/school-admin/students` | StudentAssignment | Student management |
| `/school-admin/instructors` | ManageInstructors | Teacher management |
| `/school-admin/reports` | Reports | School reports |
| `/school-admin/report-cards` | ReportCards | Report cards |

#### Parent Routes (Role: PARENT)

| Path | Component | Description |
|---|---|---|
| `/parent/dashboard` | ParentDashboard | Child progress overview |
| `/parent/children` | Children | Manage linked children |
| `/parent/messages` | Messages | Communication |

#### Common Routes (All authenticated users)

| Path | Component | Description |
|---|---|---|
| `/change-password` | ChangePassword | Password change |
| `/profile` | Profile | User profile editing |
| `/notification-preferences` | NotificationPreferences | Notification settings |
| `/notifications` | NotificationsList | Notification history |
| `/messages` | MessagingCenter | Messaging |
| `/help` | HelpCenter | Help center |

### 5.4 Component Architecture

#### Layout Components

**AppLayout.jsx**
- Conditional rendering of TopBar and Sidebar based on auth state and current route
- Manages responsive layout

**TopBar.jsx**
- Brand logo/institution name
- Quick search (Ctrl/Cmd + K)
- Message icon with unread badge
- Notification center dropdown
- User profile dropdown
- Global search modal

**Sidebar.jsx**
- Role-based navigation via `sidebarNavConfig`
- Collapsible/expandable
- Mobile drawer mode
- XP progress bar (students only)
- Active state detection

#### Student Components

**StudentDashboard.jsx**
- Time-based greeting
- Today's lessons schedule
- Upcoming assignments with deadlines
- Grades overview
- Subject cards with emoji icons
- Keyboard shortcuts modal
- Uses `useStudentData()` hook for data aggregation

**SubjectView.jsx**
- Subject lessons list with filtering
- Assessments tab
- Grades for subject tab
- Tabbed interface

**LessonViewStream.jsx**
- Multi-type content viewer (videos, flashcards, interactive books, checkpoints)
- Fullscreen support
- Discussion board sidebar
- Notes panel
- Tools speed dial menu
- Completion tracking with progress persistence
- AI tutor integration button

**StudentQuizView.jsx**
- Question and answer randomization
- Timer with countdown display
- Progress indicator
- Results and scoring display
- Submit confirmation modal
- Multiple attempt support

**AITutorWidget.jsx**
- Context-aware help (derives from current lesson/subject)
- Quick action buttons: Videos, Explain, Websites, Worksheets, Examples
- Chat history with message streaming
- Auto-scroll to latest message

**AssignmentSubmission.jsx** - File upload with drag-and-drop for assignment submissions
**CourseRegistration.jsx** - Browse and enroll in available courses
**ProgressDashboard.jsx** - Visual progress tracking with charts and metrics
**ThemeSelector.jsx** - Appearance/theme customization

#### Teacher Components

**TeacherDashboard.jsx**
- My classes overview with student counts
- Today's lessons schedule
- Upcoming assessments deadlines
- Class statistics and analytics
- Quick action links

**TeacherClassManagement.jsx** - Manage class roster, student details, and class settings
**TeacherLessonView.jsx** - Edit and preview lesson content and details

**LessonPlanning.jsx**
- Create/edit lesson plans
- Set objectives, topics, and homework
- Schedule with date/time
- Link to class subjects

**LessonContentManager.jsx** (5882 lines)
- Comprehensive content creation and management
- Multiple content types: files, videos, links, documents, images
- Interactive content: flashcards, interactive books, interactive videos
- Quiz creation with multiple question types
- Content sequencing and ordering
- Publishing workflow
- AI-assisted content generation

**AttendanceMarking.jsx**
- Mark student attendance per lesson
- Status options: Present, Absent, Late, Excused, Sick
- Notes per student
- Batch operations

**GradeEntry.jsx**
- Enter grades for assessments
- Marks, percentage, letter grade
- Comments and feedback
- Excused marking

**Gradebook.jsx**
- Full grade overview per class subject
- Assessment columns with weights
- Term filtering
- Grade calculations
- Export capabilities

**ContentLibrary.jsx**
- Browse and search reusable content
- Filter by type, subject, form
- Ratings and reviews
- Favorites/bookmarks
- Usage tracking

**LessonTemplateLibrary.jsx** - Pre-made lesson templates for common topics
**StudentProfileView.jsx** - View individual student details and progress
**TeacherReportCardComments.jsx** - Write and manage report card feedback
**TutorSettings.jsx** - Configure AI tutor behavior and context

#### Admin Components

**AdminDashboard.jsx**
- Total users, courses, instructors, students statistics
- Recent activity feed
- System health indicators
- Quick action cards

**FormManagement.jsx** - CRUD for academic forms/years (Form 1-7)
**ManageClasses.jsx** - Create, edit, delete classes; assign form tutors
**ManageSubjects.jsx** - Subject configuration with CXC codes
**ManageCourses.jsx** - Course CRUD with department linking
**ManageInstructors.jsx** - Teacher account management
**ManageDepartments.jsx** - Department hierarchy management
**UserManagement.jsx** - Full user CRUD with role assignment
**StudentAssignment.jsx** - Assign students to classes
**ClassSubjectAssignment.jsx** - Link classes to subjects with teacher assignment
**CourseAssignment.jsx** - Assign courses to students
**EnrollmentApproval.jsx** - Approve/reject student registrations
**ARVRContentManager.jsx** - 3D model and AR/VR content management
**StudentProfile.jsx** - Admin view of student details
**ClassStudents.jsx** - View and manage class rosters

#### Collaboration Components

**CollaborationHub.jsx** - Central hub for all collaboration features
**VirtualClassrooms.jsx** - Online video class sessions (Jitsi/WebRTC integration)
**CollaborativeDocuments.jsx** - Shared real-time document editing
**WhiteboardCollaboration.jsx** - Shared digital whiteboard
**PeerToPeerLearning.jsx** - Peer tutoring and study sessions
**GroupProjectManagement.jsx** - Group project task tracking

#### Interactive Content Components

**Gamification.jsx** - Points, levels, badges, leaderboards, streaks
**AdaptiveLearningPaths.jsx** - Personalized learning path management
**InteractiveContentHub.jsx** - Interactive content dashboard
**SocialLearning.jsx** - Discussion forums, peer reviews
**VirtualLabs.jsx** - Virtual experiment simulations

#### 3D/AR/VR Viewer Components

**ThreeDModelViewer.jsx** - Three.js-based 3D model display
**ThreeDModelViewerV2.jsx** - Enhanced 3D viewer with annotations
**ARViewer.jsx** - Augmented reality experiences
**ARViewerEnhanced.jsx** - Enhanced AR with marker detection
**WebXRViewer.jsx** - WebXR/VR immersive experiences
**WebXRViewerV2.jsx** - Enhanced VR viewer
**VirtualFieldTripViewer.jsx** - VR field trip experiences
**ModelViewerComponent.jsx** - Generic model viewer wrapper
**ViewerErrorBoundary.jsx** - Error handling for 3D viewers

#### Auth Components

**Login.jsx** - Email/password login form with Supabase Auth
**Register.jsx** - User registration with role selection
**ForgotPassword.jsx** - Password reset email request
**ResetPassword.jsx** - Password reset form with token validation
**ChangePassword.jsx** - Authenticated password change
**PrivateRoute.jsx** - Route protection with role-based access control; 3-second loading timeout; localStorage fallback
**FirstTimeLoginCheck.jsx** - Force password change on first login

#### Common/Shared Components

**ErrorBoundary.jsx** - Graceful error display with retry and dev details
**NotificationCenter.jsx** - Real-time notification dropdown with bell badge
**Toast.jsx** - Toast notifications (success/error/warning/info)
**SkeletonLoader.jsx** / **LoadingSkeleton.jsx** - Loading placeholder animations
**EmptyState.jsx** - Empty state UI with actions
**Profile.jsx** - User profile editing form
**Breadcrumb.jsx** - Navigation breadcrumb trail
**FlagLogo.jsx** - SKN flag logo SVG
**GlobalSearch.jsx** - Full-text search modal (Ctrl/Cmd + K)
**QuickSearch.jsx** - Inline quick search bar
**QuickActions.jsx** - Action shortcut buttons
**RecentlyViewed.jsx** - Recently viewed items list
**KeyboardShortcutsModal.jsx** - Keyboard shortcuts help
**CourseDetails.jsx** - Course information display
**NotificationPreferences.jsx** - Per-type notification settings
**NotificationsList.jsx** - Full notification history
**MessagingCenter.jsx** - Direct messaging interface
**MessageIcon.jsx** - Message count badge
**OfflineAlert.jsx** - Offline status indicator
**DarkModeToggle.jsx** - Theme switcher button
**Timetable.jsx** - Calendar/schedule grid view
**FileUpload.jsx** - File upload button component
**FileUploadZone.jsx** - Drag-and-drop file upload area
**FileManagement.jsx** - File management interface
**FileList.jsx** - File listing with actions
**FilePreviewModal.jsx** - File preview overlay
**NotFound.jsx** - 404 page
**CurriculumAccess.jsx** - Public curriculum access widget

#### Help Components

**StudentHelpPage.jsx** - Student-oriented help documentation
**TeacherHelpPage.jsx** - Teacher-oriented help documentation
**AdminHelpPage.jsx** - Admin-oriented help documentation
**HelpCenter.jsx** - Centralized help with search

### 5.5 Services Layer

#### Authentication & User Services

| Service File | Functions |
|---|---|
| `authServiceSupabase.jsx` | `login()`, `register()`, `logout()`, `isAuthenticated()`, `sendPasswordResetEmail()`, `resetPassword()`, `updatePassword()`, `refreshSession()` |
| `userService.js` | User profile CRUD, settings management |
| `adminServiceSupabase.jsx` | Admin-specific operations |

#### Data Services

| Service File | Functions |
|---|---|
| `studentService.js` (19KB) | Student data operations, class assignments, grades, attendance, submissions |
| `classService.js` (33KB) | Class/class-subject operations, teacher assignments, lesson queries, form management |
| `institutionService.js` (17KB) | Institution/school CRUD, department management |
| `dashboardService.js` (12KB) | Dashboard data aggregation for all roles |
| `supabaseService.jsx` | Service facade combining all service modules |

#### Content & Learning Services

| Service File | Functions |
|---|---|
| `aiLessonService.jsx` (127KB) | AI lesson generation via OpenAI, generates plans/objectives/homework |
| `tutorService.js` (11KB) | AI conversation management, message streaming, student profile personalization |
| `contentLibraryService.js` (12KB) | Content CRUD, ratings, favorites, usage tracking |
| `lessonTemplateService.js` (17KB) | Template CRUD, template categories, template usage |
| `interactiveContentService.js` | Interactive content management (flashcards, books, videos) |
| `youtubeService.jsx` | `searchEducationalVideos()`, `findBestVideoForLesson()`, `searchVideosByOutcomes()`, `getVideoDetails()` |

#### Progress & Assessment Services

| Service File | Functions |
|---|---|
| `progressService.js` | Learning progress tracking and calculations |
| `learnerProgressService.js` | Student progress data with RLS |
| `studentInformationService.js` | Detailed student information |
| `recommendationService.js` | Adaptive content recommendations |
| `studentGoalService.js` | Student goal tracking and management |

#### Communication & Notification Services

| Service File | Functions |
|---|---|
| `notificationService.js` (12KB) | `getNotifications()`, `getUnreadCount()`, `markAsRead()`, `subscribeToNotifications()` |
| `messageService.js` (10KB) | Conversation CRUD, message sending, read tracking |
| `collaborationService.js` (10KB) | Session management, participant tracking |
| `teacherCollaborationService.js` | Teacher-specific collaboration features |

#### Reporting & Analytics Services

| Service File | Functions |
|---|---|
| `reportService.js` (13KB) | Report generation and data aggregation |
| `reportCardService.js` (15KB) | Report card creation, comments, grades |
| `curriculumAnalyticsService.js` | Curriculum coverage, gap analysis, time allocation |
| `analyticsService.jsx` | General analytics and metrics |

#### Export Services

| Service File | Functions |
|---|---|
| `CurriculumExporter.js` | Export curriculum data to various formats |
| `ReportPDFExporter.js` | Generate PDF reports |
| `ReportCardPDFExporter.js` | Generate PDF report cards |

#### Storage & File Services

| Service File | Functions |
|---|---|
| `storageService.js` | Supabase storage upload/download/delete |
| `fileService.js` | File operations and management |

#### Utility Services

| Service File | Functions |
|---|---|
| `searchService.js` | Global full-text search across entities |
| `recentlyViewedService.js` | Track and retrieve recently viewed items |
| `autoTaggingService.js` | Auto-tag content based on analysis |
| `curriculumAIService.js` | AI-assisted curriculum suggestions |
| `parentService.js` | Parent-specific operations, child linking |
| `api.jsx` | Legacy HTTP API client for Java microservices |

### 5.6 Custom Hooks

**`useStudentData.js`**
- Aggregates all student dashboard data using TanStack React Query
- Returns: `classAssignment`, `myClass`, `subjects`, `lessons`, `assignments`, `grades`, `isLoading`, `error`
- Features: Batched queries, dependent queries, automatic caching

### 5.7 Design System

**SKN Color Palette:**
- Green: `#009e60`
- Red: `#c8001e`
- Yellow: `#fcd116`
- Black: `#000000`

**Frameworks:** Bootstrap 5 + TailwindCSS
**Responsive:** Mobile-first design
**Dark Mode:** Full theme context support
**Accessibility:** Keyboard shortcuts, ARIA attributes

### 5.8 Performance Optimizations

- **Code Splitting:** React.lazy() + Suspense for all route components
- **Caching:** React Query with 5-min stale time, 30-min cache
- **Memoization:** useMemo() for expensive calculations
- **Debouncing:** Search and input handlers
- **HTML Sanitization:** DOMPurify for user-generated content

---

## 6. Database Schema

### 6.1 Foundational Tables

**institutions** - Educational institutions
- `institution_id` (BIGSERIAL PK), `name` (UNIQUE), `location`, `contact`, `phone`, `website`, `established_year`, `institution_type`, `created_at`

**users** - All system users
- `user_id` (BIGSERIAL PK), `name`, `email` (UNIQUE), `password`, `role`
- `phone`, `date_of_birth`, `address`, `emergency_contact`
- `is_active`, `department_id` (FK), `created_at`, `updated_at`, `last_login`, `is_first_login`
- `id` (UUID from Supabase auth.users)

**departments** - Academic departments
- `department_id` (BIGSERIAL PK), `institution_id` (FK), `name`, `code`, `head_of_department`, `department_email`, `office_location`, `created_at`

### 6.2 Academic Structure

**forms** - Year groups (Forms 1-7)
- `form_id` (BIGSERIAL PK), `school_id` (FK), `form_number` (1-7), `form_name`, `academic_year`, `coordinator_id` (FK), `description`, `is_active`
- Unique: `(school_id, form_number, academic_year)`

**classes** - Homeroom/stream (3A, 3B, etc.)
- `class_id` (BIGSERIAL PK), `form_id` (FK), `class_name`, `class_code`, `academic_year`, `capacity` (default 35), `current_enrollment`, `form_tutor_id` (FK), `room_number`, `is_active`
- Unique: `(form_id, class_name, academic_year)`

**subjects** - Academic subjects
- `subject_id` (BIGSERIAL PK), `school_id` (FK), `subject_name`, `subject_code` (UNIQUE), `description`, `cxc_code`, `department_id` (FK), `is_active`

**subject_form_offerings** - Subject offered in specific form
- `offering_id` (BIGSERIAL PK), `subject_id` (FK), `form_id` (FK), `curriculum_framework`, `learning_outcomes`, `weekly_periods` (default 5), `is_compulsory`, `is_active`
- Unique: `(subject_id, form_id)`

**class_subjects** - Junction: class + subject + teacher
- `class_subject_id` (BIGSERIAL PK), `class_id` (FK), `subject_offering_id` (FK), `teacher_id` (FK), `room_preference`
- Unique: `(class_id, subject_offering_id)`

**student_class_assignments** - Student to class enrollment
- `assignment_id` (BIGSERIAL PK), `student_id` (FK), `class_id` (FK), `academic_year`, `assignment_date`, `is_active`, `notes`
- Unique: `(student_id, class_id, academic_year)`

### 6.3 Lesson Management

**lessons** - Individual instructional sessions
- `lesson_id` (BIGSERIAL PK), `class_subject_id` (FK)
- `lesson_title`, `lesson_date`, `start_time`, `end_time`, `location`, `lesson_number`, `topic`
- `learning_objectives`, `lesson_plan`, `homework_description`, `homework_due_date`
- `status` (SCHEDULED/COMPLETED/CANCELLED/ABSENT), `attendance_taken`
- `created_by` (FK), `created_at`, `updated_at`

**lesson_content** - Files, links, materials attached to lessons
- `content_id` (BIGSERIAL PK), `lesson_id` (FK)
- `content_type` (FILE/LINK/VIDEO/DOCUMENT/IMAGE/INTERACTIVE_BOOK/FLASHCARD/INTERACTIVE_VIDEO)
- `title`, `url`, `file_path`, `file_name`, `file_size`, `mime_type`
- `instructions`, `learning_outcomes`, `learning_activities`, `key_concepts`
- `reflection_questions`, `discussion_prompts`, `summary`, `content_section`
- `is_required`, `estimated_minutes`, `content_data` (JSONB), `metadata` (JSONB)
- `prerequisite_content_ids` (BIGINT[])
- `upload_date`, `uploaded_by` (FK)

### 6.4 Attendance & Assessment

**lesson_attendance** - Per-lesson student attendance
- `attendance_id` (BIGSERIAL PK), `lesson_id` (FK), `student_id` (FK)
- `status` (PRESENT/ABSENT/LATE/EXCUSED/SICK), `marked_by` (FK), `marked_at`, `notes`
- Unique: `(lesson_id, student_id)`

**subject_assessments** - Tests, quizzes, SBAs, exams
- `assessment_id` (BIGSERIAL PK), `class_subject_id` (FK)
- `assessment_type` (TEST/QUIZ/SBA/PROJECT/MOCK_EXAM/EXAM)
- `assessment_name`, `description`, `total_marks`, `weight` (% of final grade)
- `due_date`, `assessment_date`, `term` (1/2/3), `academic_year`
- `is_sba_component`, `sba_component_number`
- `created_by` (FK), `created_at`, `updated_at`

**student_grades** - Individual student grades
- `grade_id` (BIGSERIAL PK), `assessment_id` (FK), `student_id` (FK)
- `marks_obtained`, `percentage`, `grade_letter` (A-F or 1-5 CXC)
- `is_excused`, `graded_by` (FK), `graded_at`, `comments`
- Unique: `(assessment_id, student_id)`

**student_submissions** - Assignment submissions
- `submission_id` (BIGSERIAL PK), `assessment_id` (FK), `student_id` (FK)
- `submission_text`, `file_url`, `file_path`, `file_name`, `file_size`, `mime_type`
- `submitted_at`, `updated_at`
- Unique: `(assessment_id, student_id)`

### 6.5 Quiz System

**quizzes** - Quiz definitions
- `quiz_id` (BIGSERIAL PK), `content_id` (FK), `title`, `description`, `instructions`
- `time_limit_minutes`, `total_points`, `passing_score` (%)
- `allow_multiple_attempts`, `max_attempts`
- `show_results_immediately`, `show_correct_answers`, `randomize_questions`, `randomize_answers`
- `is_published`, `published_at`, `due_date`, `created_by` (FK)

**quiz_questions** - Questions within quizzes
- `question_id` (BIGSERIAL PK), `quiz_id` (FK)
- `question_type` (MULTIPLE_CHOICE/TRUE_FALSE/SHORT_ANSWER/ESSAY/MATCHING/FILL_BLANK)
- `question_text`, `question_order`, `points`, `explanation`, `is_required`

**quiz_answer_options** - Multiple choice options
- `option_id` (BIGSERIAL PK), `question_id` (FK)
- `option_text`, `is_correct`, `option_order`, `points` (partial credit)

**quiz_correct_answers** - Correct answers for non-MC questions
- `answer_id` (BIGSERIAL PK), `question_id` (FK)
- `correct_answer`, `case_sensitive`, `accept_partial`

**student_quiz_attempts** - Student quiz attempts
- `attempt_id` (BIGSERIAL PK), `quiz_id` (FK), `student_id` (FK)
- `attempt_number`, `started_at`, `submitted_at`, `time_spent_seconds`
- `total_points_earned`, `percentage_score`, `is_passed`, `is_graded`
- `graded_by` (FK), `graded_at`, `feedback`
- Unique: `(quiz_id, student_id, attempt_number)`

**student_quiz_responses** - Individual question responses
- `response_id` (BIGSERIAL PK), `attempt_id` (FK), `question_id` (FK)
- `response_text`, `selected_option_id` (FK)
- `points_earned`, `is_correct`, `is_graded`, `feedback`

### 6.6 Content Library

**content_library** - Reusable content across lessons
- `library_id` (BIGSERIAL PK)
- `content_type` (FILE/LINK/VIDEO/DOCUMENT/IMAGE/INTERACTIVE_BOOK/FLASHCARD/INTERACTIVE_VIDEO/3D_MODEL/AR_CONTENT)
- `title`, `description`, `url`, `file_path`, `file_name`, `file_size`, `mime_type`
- All metadata fields from lesson_content plus assignment-specific file fields
- `shared_by` (FK), `subject_id` (FK), `form_id` (FK)
- `tags` (TEXT[]), `is_public`, `is_featured`, `is_verified`
- `view_count`, `use_count`, `rating_average`, `rating_count`
- `status` (ACTIVE/ARCHIVED/DELETED), `version`

**content_library_ratings** - User ratings and reviews
- Unique: `(library_id, user_id)`, `rating` (1-5 CHECK)

**content_library_usage** - Tracks when library content is used in lessons

**content_library_favorites** - Teacher bookmarks
- Unique: `(library_id, user_id)`

**Database Triggers:**
- `update_content_library_ratings()` - Updates average rating on change
- `update_content_library_use_count()` - Increments use count
- `increment_library_view_count()` - Increments view count

### 6.7 Collaboration & Real-Time

**collaboration_sessions** - Session containers
- `session_type` (DOCUMENT/CLASSROOM/WHITEBOARD/TUTORING/PROJECT)
- `max_participants` (default 50), `settings` (JSONB), `metadata` (JSONB)

**collaboration_participants** - Session participants with roles (OWNER/MODERATOR/PARTICIPANT/OBSERVER)
- Permissions: `can_edit`, `can_share`, `can_moderate`
- Media: `video_enabled`, `audio_enabled`, `screen_sharing`

**collaborative_documents** - Shared documents
- `content_type` (TEXT/RICH_TEXT/CODE/MARKDOWN)
- `operational_transform_state` (JSONB)

**document_changes** - Operational transform changelog
- `change_type` (INSERT/DELETE/FORMAT/MOVE)

**document_comments** - Threaded document comments with resolution tracking

**virtual_classrooms** - Video conferencing (Jitsi/Zoom/WebRTC)
- `recording_enabled`, `chat_enabled`, `raise_hand_enabled`, `polls_enabled`
- `breakout_rooms_enabled`, `max_breakout_rooms` (default 10)

**breakout_rooms** - Sub-rooms for group work
**breakout_room_participants** - Room participant tracking

**collaborative_whiteboards** - Shared whiteboards
- `canvas_data` (JSONB), `grid_enabled`, `snap_to_grid`

**whiteboard_elements** - Drawing objects (SHAPE/TEXT/DRAWING/IMAGE/STICKY_NOTE)
- Soft delete support

**tutoring_sessions** - Peer-to-peer tutoring
- `session_type` (TUTORING/MENTORING/PEER_STUDY)
- `status` (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED)
- Bidirectional ratings and feedback

**group_projects** - Group project management
- `project_type` (ASSIGNMENT/PRESENTATION/RESEARCH/PORTFOLIO)
- `status` (PLANNING/IN_PROGRESS/REVIEW/COMPLETED/SUBMITTED)
- `progress_percentage` (0-100)

**project_tasks** - Task management within projects
- `status` (TODO/IN_PROGRESS/IN_REVIEW/COMPLETED/BLOCKED)
- `priority` (LOW/MEDIUM/HIGH/CRITICAL)
- `depends_on_task_id` (FK) - task dependencies

**project_members** - Project team members with roles (LEADER/MEMBER/OBSERVER)

### 6.8 Messaging System

**conversations** - Teacher-parent direct messaging
- `institution_id` (FK), `student_id` (FK), `subject`, `last_message_at`

**conversation_participants** - Conversation members with read tracking

**messages** - Individual messages with read status

### 6.9 Announcements

**form_announcements** - Form-level communications
- `priority` (HIGH/NORMAL/LOW), `expiry_date`

**class_announcements** - Class-specific communications
- `priority` (HIGH/NORMAL/LOW), `expiry_date`

### 6.10 Gamification & Achievements

**student_gamification** - Points, levels, streaks
- `total_points`, `current_points`, `points_this_week`, `points_this_month`
- `current_level`, `experience_points`, `experience_to_next_level`
- `current_streak`, `longest_streak`, `last_activity_date`
- `lessons_completed`, `quizzes_passed`, `assignments_submitted`, `perfect_scores`
- `class_rank`, `school_rank`

**badges** - Achievement badge definitions
- `badge_type` (ACHIEVEMENT/MILESTONE/SPECIAL/EVENT)
- `category` (ACADEMIC/SOCIAL/CREATIVITY/LEADERSHIP)
- `rarity` (COMMON/UNCOMMON/RARE/EPIC/LEGENDARY)
- `requirements` (JSONB), `points_reward`

**student_badges** - Earned badges per student

**leaderboards** - Ranking boards
- `leaderboard_type` (CLASS/SCHOOL/GLOBAL/SUBJECT/WEEKLY/MONTHLY)
- `ranking_criteria` (POINTS/LEVEL/STREAK/PERFECT_SCORES)

**leaderboard_entries** - Individual rankings

**achievements** - Achievement definitions with progress tracking
- `progress_type` (COUNT/PERCENTAGE/SCORE/TIME)

**student_achievements** - Student achievement progress and unlocks

**points_transactions** - Points history log
- `transaction_type` (LESSON_COMPLETE/QUIZ_PASS/ASSIGNMENT_SUBMIT/BADGE_EARNED/ACHIEVEMENT/BONUS)

### 6.11 Discussion & Peer Learning

**discussion_forums** - Forum containers per class subject
- `moderation_enabled`, `require_approval`

**forum_topics** - Discussion threads
- `topic_type` (DISCUSSION/QUESTION/ANNOUNCEMENT/POLL)
- `poll_options` (JSONB), `poll_votes` (JSONB)
- `is_pinned`, `is_locked`

**forum_posts** - Replies with nested threading
- `is_best_answer`, `is_flagged`, `flag_reason`

**peer_review_assignments** - Peer review configuration
- `review_criteria` (JSONB), `rubric` (JSONB)
- `anonymous_reviews`, `allow_rebuttal`, `auto_assign`

**peer_reviews** - Individual peer reviews with scoring

### 6.12 Virtual Labs & AR/VR

**virtual_labs** - Lab simulations
- `lab_type` (SCIENCE/MATH/CHEMISTRY/PHYSICS/BIOLOGY)
- `simulation_type` (INTERACTIVE/ANIMATION/3D_MODEL/VR)
- `lab_content` (JSONB), `initial_state` (JSONB)

**lab_sessions** - Student lab sessions with state tracking

**arvr_content** - AR/VR experiences
- `content_type` (3D_MODEL/AR_OVERLAY/VR_EXPERIENCE/FIELD_TRIP)
- `model_format` (GLTF/OBJ/FBX/USDZ)
- `platform` (WEBXR/ARKIT/ARCORE/CUSTOM)
- `interaction_mode` (VIEW_ONLY/INTERACTIVE/GUIDED_TOUR)
- Field trip: `location_name`, `location_coordinates` (JSONB), `virtual_tour_url`

**arvr_sessions** - Student AR/VR session tracking

### 6.13 Learner Progress & Curriculum Analytics

**learner_progress** - Per-content progress tracking
- `user_id` (UUID FK to auth.users), `content_id` (FK)
- `progress_percentage`, `viewed_pages` (INTEGER[]), `data` (JSONB)
- RLS: Users see own; teachers see student progress

**curriculum_coverage** - Topic coverage tracking
- `status` (NOT_STARTED/IN_PROGRESS/COMPLETED/SKIPPED)
- `coverage_percentage`, `lessons_count`

**curriculum_time_allocation** - Planned vs actual time per topic

**curriculum_outcome_achievement** - Student outcome mastery
- `achievement_status` (NOT_ASSESSED/DEVELOPING/ACHIEVED/EXCEEDED)

**lesson_sco_mapping** - Lesson to Specific Curriculum Outcome mapping

**curriculum_gaps** - Gap analysis
- `gap_type` (NOT_COVERED/PARTIALLY_COVERED/NO_ASSESSMENT/LOW_ACHIEVEMENT)
- `severity` (LOW/MEDIUM/HIGH/CRITICAL)
- `recommended_action`

**curriculum_analytics_snapshots** - Historical analytics snapshots

### 6.14 Parent Portal

**parent_student_links** - Parent to student relationships
- `relationship` (PARENT/GUARDIAN/GRANDPARENT/OTHER)
- `is_primary_contact`, `is_active`

### 6.15 Database Views

**student_class_subjects_view** - Joins students with their class subjects and teachers
**teacher_class_subjects_view** - Joins teachers with their assigned class subjects

### 6.16 Key Indexes

Comprehensive indexing across all tables for:
- Foreign key lookups
- Date-based queries
- Status filtering
- Full-text search (GIN index on content_library)
- Tag-based queries

---

## 7. Authentication & Security

### 7.1 Authentication Flow (Primary - Supabase)

1. User submits credentials via Login component
2. Supabase Auth validates and returns session token
3. Token stored in localStorage by Supabase client
4. AuthContext manages auth state globally
5. PrivateRoute enforces route access by role
6. Automatic token refresh via Supabase session management

### 7.2 Authentication Flow (Secondary - Java/JWT)

1. User authenticates via `/auth/login` or `/auth/login-ad`
2. JWT token generated with 24-hour expiration
3. Token includes user ID, email, and role
4. JWT filter validates token on each request
5. Spring Security context populated

### 7.3 Active Directory Integration

- LDAP URL: `ldap://192.168.154.5:389`
- Base DN: `DC=mylab,DC=local`
- User search: `OU=ScholarSpace`
- Filter: `(|(userPrincipalName={0})(sAMAccountName={0}))`
- Fallback to local auth if AD unavailable

### 7.4 Role-Based Access Control

| Role | Access Level |
|---|---|
| ADMIN | Full system access, user management, all CRUD operations |
| SCHOOL_ADMIN | School-scoped access, reports, student/teacher management |
| INSTRUCTOR | Class management, lessons, grades, content, assessments |
| STUDENT | Dashboard, subjects, lessons, quizzes, submissions, progress |
| PARENT | Child progress viewing, messaging, notifications |

### 7.5 Security Measures

- Supabase Row Level Security on all tables
- JWT token validation with expiration
- HTML sanitization with DOMPurify
- Error boundaries prevent information leaks
- CORS restricted to frontend origin
- File upload size limits (10MB file, 15MB request)
- Password reset tokens with expiration
- First-login forced password change

---

## 8. Feature Catalog

### 8.1 AI-Powered Learning

| Feature | Description |
|---|---|
| AI Tutor | Socratic teaching assistant with Caribbean context, never solves homework directly |
| AI Lesson Generation | Automated lesson plan creation with objectives and activities |
| YouTube Video Search | Context-aware educational video recommendations |
| Web Resource Search | Educational web resource discovery |
| Curriculum AI Suggestions | AI-assisted curriculum planning |
| Auto-Tagging | Automatic content categorization |

### 8.2 Lesson & Content Management

| Feature | Description |
|---|---|
| Lesson Planning | Create/edit lessons with objectives, topics, homework |
| Multi-Type Content | Support for files, videos, links, documents, images |
| Interactive Content | Flashcards, interactive books, interactive videos |
| Content Library | Reusable content with ratings, favorites, usage tracking |
| Lesson Templates | Pre-made templates for common topics |
| Content Sequencing | Ordered content delivery within lessons |
| Publishing Workflow | Draft/publish states for content |

### 8.3 Assessment & Grading

| Feature | Description |
|---|---|
| Quiz Creation | Multiple question types (MC, T/F, short answer, essay, matching, fill-blank) |
| Quiz Randomization | Random question and answer ordering |
| Timed Quizzes | Countdown timer with auto-submit |
| Multiple Attempts | Configurable attempt limits |
| Auto-Grading | Automatic scoring for objective questions |
| Manual Grading | Teacher grading for essays and projects |
| Gradebook | Full grade overview with weights and calculations |
| SBA Tracking | School-Based Assessment component tracking |
| Report Cards | Per-student report generation with comments |
| Grade Export | PDF export of grades and reports |

### 8.4 Attendance Tracking

| Feature | Description |
|---|---|
| Lesson Attendance | Per-lesson marking (Present/Absent/Late/Excused/Sick) |
| Batch Operations | Mark multiple students at once |
| Notes | Per-student attendance notes |
| History | Attendance history and analytics |

### 8.5 Student Features

| Feature | Description |
|---|---|
| Dashboard | Time-based greeting, today's lessons, upcoming assignments, grades |
| Subject View | Lessons, assessments, and grades per subject |
| Lesson Streaming | Multi-type content viewer with progress tracking |
| Assignment Submission | File upload and text submission |
| Course Registration | Browse and enroll in courses |
| Progress Dashboard | Visual progress charts and metrics |
| Keyboard Shortcuts | Quick navigation shortcuts |

### 8.6 Collaboration

| Feature | Description |
|---|---|
| Virtual Classrooms | Video conferencing via Jitsi/WebRTC with breakout rooms |
| Collaborative Documents | Real-time shared document editing with comments |
| Digital Whiteboard | Shared drawing/annotation canvas |
| Peer Tutoring | One-on-one tutoring session management |
| Group Projects | Project management with tasks, deadlines, team roles |
| Discussion Forums | Threaded forums with polls, pinning, best answers |
| Peer Review | Anonymous peer assessment with rubrics |

### 8.7 Gamification

| Feature | Description |
|---|---|
| Points System | Earn points for activities (lessons, quizzes, assignments) |
| Levels | Experience-based leveling system |
| Badges | Achievement badges with rarity (Common to Legendary) |
| Leaderboards | Class, school, and global rankings |
| Streaks | Activity streak tracking |
| Achievements | Multi-step achievement progression |

### 8.8 AR/VR & Interactive

| Feature | Description |
|---|---|
| 3D Model Viewer | Three.js-based 3D model display and interaction |
| AR Experiences | Augmented reality overlays and markers |
| VR/WebXR | Immersive virtual reality experiences |
| Virtual Field Trips | VR location-based tours |
| Virtual Labs | Science/math/chemistry simulations |
| Adaptive Learning | Personalized difficulty-adjusted learning paths |

### 8.9 Communication

| Feature | Description |
|---|---|
| Direct Messaging | Teacher-parent messaging with read tracking |
| Announcements | Form-level and class-level announcements with priority |
| Notifications | Real-time notifications via Supabase subscriptions |
| Toast Alerts | In-app toast notifications |

### 8.10 Analytics & Reporting

| Feature | Description |
|---|---|
| Curriculum Coverage | Topic and SCO coverage tracking |
| Time Allocation | Planned vs actual teaching time |
| Gap Analysis | Identify uncovered or underperforming areas |
| Student Achievement | Per-outcome mastery tracking |
| Historical Snapshots | Periodic analytics snapshots |
| Learner Progress | Per-content completion tracking |
| PDF Reports | Exportable PDF reports and report cards |

### 8.11 Administration

| Feature | Description |
|---|---|
| Multi-Institution | Support for multiple schools |
| Form Management | Academic year/form setup (Forms 1-7) |
| Class Management | Class creation, capacity, form tutor assignment |
| Subject Management | Subject configuration with CXC codes |
| Department Management | Department hierarchy |
| User Management | Full CRUD for all user roles |
| Student Assignment | Assign students to classes |
| Teacher Assignment | Assign teachers to class subjects |
| Enrollment Approval | Approve/reject course registrations |

### 8.12 Parent Portal

| Feature | Description |
|---|---|
| Child Progress | View linked children's academic progress |
| Messaging | Communicate with teachers |
| Notifications | Receive alerts about child's activities |

---

## 9. API Reference

### 9.1 Node.js Express API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/chat` | Generic OpenAI proxy |
| POST | `/api/ai/tutor` | AI tutor with Socratic method |
| GET | `/*` | SPA fallback to index.html |

### 9.2 User Service API (Port 8090)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Local authentication |
| POST | `/auth/login-ad` | Active Directory login |
| POST | `/auth/register` | User registration |
| POST | `/auth/forgot-password` | Request reset token |
| POST | `/auth/reset-password` | Reset with token |
| GET | `/auth/validate-reset-token` | Validate token |
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user |
| GET | `/api/users/role/{role}` | Filter by role |
| GET | `/api/users/profile` | Current user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/{id}` | Update user (Admin) |
| PUT | `/api/users/{id}/activate` | Activate account |
| PUT | `/api/users/{id}/deactivate` | Deactivate account |
| PUT | `/api/users/change-password` | Change password |
| POST | `/api/users` | Create user (Admin) |
| GET | `/api/users/stats` | User statistics |

### 9.3 Institution Service API (Port 8091)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/institutions` | Create institution |
| GET | `/api/institutions` | List institutions |
| GET | `/api/institutions/{id}` | Get by ID |
| GET | `/api/institutions/name/{name}` | Get by name |
| PUT | `/api/institutions/{id}` | Update institution |
| DELETE | `/api/institutions/{id}` | Delete institution |
| GET | `/api/institutions/{id}/departments` | Get departments |
| GET | `/api/institutions/{id}/stats` | Get statistics |
| POST | `/api/departments` | Create department |
| GET | `/api/departments` | List departments |
| GET | `/api/departments/{id}` | Get by ID |
| GET | `/api/departments/code/{code}` | Get by code |
| GET | `/api/departments/institution/{id}` | Get by institution |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |
| GET | `/api/departments/{id}/stats` | Get statistics |

### 9.4 Course Service API (Port 8092)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/courses` | List courses |
| POST | `/api/courses` | Create course |
| GET | `/api/courses/{id}` | Get course |
| PUT | `/api/courses/{id}` | Update course |
| DELETE | `/api/courses/{id}` | Delete course |
| POST | `/api/enrollments` | Create enrollment |
| GET | `/api/enrollments` | List enrollments |
| PUT | `/api/enrollments/{id}/status` | Update status |
| PUT | `/api/enrollments/{id}/grade` | Assign grade |
| POST | `/api/course-contents` | Upload content |
| GET | `/api/course-contents/course/{id}` | Get by course |
| DELETE | `/api/course-contents/{id}` | Delete content |
| POST | `/api/submissions` | Submit assignment |
| GET | `/api/submissions/assignment/{id}` | Get by assignment |
| PUT | `/api/submissions/{id}/grade` | Grade submission |
| POST | `/api/instructors` | Assign instructor |

### 9.5 Supabase Direct Queries (Frontend Services)

The frontend services make direct Supabase queries for:
- All form, class, subject, lesson operations
- Attendance marking and retrieval
- Assessment and grade management
- Quiz creation, attempts, and responses
- Content library CRUD
- Collaboration session management
- Gamification data
- Notification management
- Messaging
- Parent-child linking
- Progress tracking
- Curriculum analytics

---

## 10. Deployment & Configuration

### 10.1 Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `PORT` | Node.js | Server port (default: 3000) |
| `NODE_ENV` | Node.js | Environment mode |
| `OPENAI_API_KEY` | Node.js | OpenAI API access |
| `YOUTUBE_API_KEY` | Node.js | YouTube search |
| `GOOGLE_SEARCH_API_KEY` | Node.js | Google Custom Search |
| `GOOGLE_SEARCH_ENGINE_ID` | Node.js | Custom Search Engine ID |
| `REACT_APP_SUPABASE_URL` | Frontend | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts | Admin operations key |

### 10.2 Build Scripts

```json
{
  "build": "cd frontend && npm install && npm run build",
  "start": "node server.js",
  "heroku-postbuild": "cd frontend && rm -rf node_modules && NPM_CONFIG_PRODUCTION=false npm install --legacy-peer-deps && npm run build"
}
```

### 10.3 Service Startup Order

1. **Config Server** (port 8888) - Serves configurations
2. **Discovery Service** (port 8761) - Service registry
3. **User Service** (port 8090) - Registers with Eureka
4. **Institution Service** (port 8091) - Registers with Eureka
5. **Course Service** (port 8092) - Registers with Eureka
6. **API Gateway** (port 8080) - Routes to registered services
7. **Node.js Server** (port 3000) - Serves frontend + AI API
8. **Frontend** - Communicates via Node.js server and API Gateway

### 10.4 Heroku Deployment

**Procfile:** `web: npm start`

**app.json:**
- Buildpacks: Node.js
- Required: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`

### 10.5 Database

- **Provider:** Supabase
- **Engine:** PostgreSQL
- **Host:** `db.zdcniidpqppwjyosooge.supabase.co:5432`
- **Features:** Row Level Security, Real-time subscriptions, Auth, Storage
- **Hibernate DDL:** `update` (auto-schema generation for Java services)

### 10.6 API Documentation

Each Java microservice exposes Swagger/OpenAPI docs:
- Docs: `/v3/api-docs`
- UI: `/swagger-ui.html`

---

## Summary

LaunchPad SKN is a comprehensive, production-grade Learning Management System tailored for Caribbean secondary schools (specifically St. Kitts and Nevis). It encompasses:

- **5 user roles** (Admin, School Admin, Teacher, Student, Parent)
- **3 Node.js API endpoints** for AI-powered tutoring
- **25+ Java microservice API endpoints** across 3 services
- **50+ database tables** with comprehensive relationships
- **70+ React components** organized by role and feature
- **40+ frontend service modules** for data management
- **7 context providers** for state management
- **6 route modules** with 50+ routes

Key differentiators include the AI Socratic tutor with Caribbean context, gamification system, AR/VR content support, real-time collaboration tools, and comprehensive curriculum analytics aligned with CXC (Caribbean Examinations Council) standards.
