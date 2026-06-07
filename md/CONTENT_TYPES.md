# LaunchPad SKN - Content Types Reference

This document describes all content types that can be created by users (teachers/instructors) and generated via AI in the LaunchPad SKN LMS.

---

## Table of Contents

1. [Content Type Overview](#1-content-type-overview)
2. [File-Based Content](#2-file-based-content)
3. [Interactive Content](#3-interactive-content)
4. [Instructional Content Blocks](#4-instructional-content-blocks)
5. [Assessment Types](#5-assessment-types)
6. [AR/VR & 3D Content](#6-arvr--3d-content)
7. [Virtual Labs & Simulations](#7-virtual-labs--simulations)
8. [AI-Generated Content](#8-ai-generated-content)
9. [AI Lesson Planner Fields](#9-ai-lesson-planner-fields)
10. [Content Sections & Lesson Structure](#10-content-sections--lesson-structure)

---

## 1. Content Type Overview

Content types are defined in `frontend/src/types/contentTypes.ts`. Each piece of lesson content has a `content_type` field stored in the `lesson_content` table, with interactive data stored in a `content_data` JSONB column.

### Complete Content Type Enum

| Content Type | Category | Creation Method | AI-Generatable |
|---|---|---|---|
| `FILE` | File-Based | Upload | No |
| `LINK` | File-Based | URL input | No |
| `VIDEO` | File-Based | Upload / URL / YouTube search | Yes (URL discovery) |
| `DOCUMENT` | File-Based | Upload | No |
| `IMAGE` | File-Based | Upload | No |
| `QUIZ` | Interactive | Builder UI / AI | Yes |
| `ASSIGNMENT` | Interactive | Builder UI / AI | Yes (rubric) |
| `FLASHCARD` | Interactive | Builder UI / AI | Yes |
| `INTERACTIVE_VIDEO` | Interactive | Builder UI / AI | Yes |
| `INTERACTIVE_BOOK` | Interactive | Builder UI / AI | Yes |
| `IMAGE_HOTSPOT` | Interactive | Builder UI | No |
| `DRAG_DROP` | Interactive | Builder UI | No |
| `FILL_BLANKS` | Interactive | Builder UI | No |
| `MEMORY_GAME` | Interactive | Builder UI | No |
| `VIDEO_FINDER` | Utility | YouTube API search | Yes (search) |
| `PRESENTATION` | Instructional | Manual / AI | Yes |
| `LEARNING_OUTCOMES` | Instructional | Manual / AI | Yes |
| `KEY_CONCEPTS` | Instructional | Manual / AI | Yes |
| `LEARNING_ACTIVITIES` | Instructional | Manual / AI | Yes |
| `REFLECTION_QUESTIONS` | Instructional | Manual / AI | Yes |
| `DISCUSSION_PROMPTS` | Instructional | Manual / AI | Yes |
| `SUMMARY` | Instructional | Manual / AI | Yes |

---

## 2. File-Based Content

### FILE
Generic file upload for documents, PDFs, presentations, spreadsheets, archives, or any other file type.

- **Supported formats**: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, ZIP, RAR, and others
- **Storage**: Supabase Storage with signed URLs
- **Fields**: `file_path`, `file_name`, `file_size`, `mime_type`

### VIDEO
Video content from file upload or external URL.

- **Sources**: Direct upload (MP4, WebM, MOV, AVI), YouTube URL, Vimeo URL
- **Fields**: `url` (for external), `file_path` (for uploaded), `description`
- **Features**: Inline playback, YouTube/Vimeo embed detection
- **AI**: YouTube Data API v3 search discovers relevant educational videos based on topic, subject, and learning outcomes

### IMAGE
Image files for visual learning materials.

- **Supported formats**: JPEG, PNG, GIF, SVG, WebP
- **Fields**: `file_path`, `file_name`, `file_size`, `mime_type`

### DOCUMENT
Document files distinguished from generic files for specialized rendering.

- **Supported formats**: PDF, DOC/DOCX, XLS/XLSX, TXT
- **Features**: In-browser PDF preview where supported

### LINK
External hyperlink to any web resource.

- **Fields**: `url`, `title`, `description`
- **Usage**: Links to external learning resources, reference materials, tools

---

## 3. Interactive Content

### FLASHCARD

Flashcard decks for study and memorization.

**Data structure** (`FlashcardData`):
- **Cards**: Array of cards, each with:
  - `front` / `back` text (term/definition, question/answer)
  - Optional `frontImage` / `backImage` URLs
  - Optional `tags` array and `difficulty` level (easy, medium, hard)
  - `order` for sequencing
- **Settings** (`FlashcardSettings`):
  - `showAnswer`: click, hover, or auto
  - `shuffleCards`: Randomize order when studying
  - `studyMode`: sequential, random, or difficulty-based
  - `showProgress`: Progress indicator toggle
  - `allowMarking`: Students mark cards as known/unknown
  - `autoAdvance` / `autoAdvanceDelay`: Auto-flip with configurable delay

**Components**: `FlashcardCreator.tsx` (teacher), `FlashcardViewer.tsx` (student)
**AI**: `generateFlashcards()` - Creates 1-50 cards from topic, subject, grade level, and difficulty

---

### INTERACTIVE_VIDEO

Videos enhanced with timed interactive checkpoints.

**Data structure** (`InteractiveVideoData`):
- **Video source**: YouTube, Vimeo, or direct URL
  - Auto-detection via URL pattern matching
  - Video ID extraction for YouTube/Vimeo embeds
- **Checkpoints** (`VideoCheckpoint[]`): Interactions at specific timestamps
  - `timestamp`: Time in seconds
  - `type`: question, quiz, note, pause, reflection
  - `content`: Question or note text
  - `options` / `correctAnswer`: For quiz-type checkpoints
  - `explanation`: Shown after answering
  - `required`: Must complete to continue
  - `pauseVideo`: Auto-pause at checkpoint
- **Settings** (`InteractiveVideoSettings`):
  - `allowSkip`: Skip checkpoints
  - `autoPause`: Auto-pause at checkpoints
  - `allowSeeking`: Allow video scrubbing
  - `requireCompletion`: All checkpoints must be done
  - `showHints` / `allowRetry` / `maxAttempts`

**Components**: `InteractiveVideoCreator.tsx` (teacher), `InteractiveVideoViewer.tsx` (student)
**AI**: `generateInteractiveVideo()` - Creates checkpoints with configurable types and count

---

### INTERACTIVE_BOOK

Multi-page interactive books combining text, media, and activities.

**Data structure** (`InteractiveBookData`):
- **Pages** (`BookPage[]`): Each page has:
  - `pageType`: content, video, quiz, image
  - `title` and `content` (rich text/HTML for content pages)
  - `audioUrl`: Optional narration audio (base64 encoded)
  - **Page-type-specific data**:
    - `videoData`: Video ID, URL, title, description, instructions
    - `quizData`: Questions array with settings (shuffle, showAnswers, allowRetry, timeLimit)
      - Question types within books: multiple-choice, true-false, fill-blank
    - `imageData`: Image URL, description, instructions
  - `embeddedContent`: Nested interactive content (flashcards, quizzes, etc.)
- **Settings** (`InteractiveBookSettings`):
  - `showNavigation`: Page navigation controls
  - `showProgress`: Progress indicator
  - `requireCompletion`: Must complete embedded activities to proceed
- **Metadata**: `subject`, `gradeLevel`

**Components**: `InteractiveBookCreator.tsx` (teacher), `InteractiveBookPlayer.tsx` (student)
**AI**: `generateInteractiveBook()` - Creates complete book with configurable page count and types (content, video, quiz)

---

### QUIZ (Standalone)

Standalone quizzes with full grading system (separate from quiz pages in interactive books).

**Question types**:
| Type | Description | Auto-Graded |
|---|---|---|
| `MULTIPLE_CHOICE` | Multiple options, one or more correct | Yes |
| `TRUE_FALSE` | True/False binary choice | Yes |
| `SHORT_ANSWER` | Free-text response with expected answer | Yes (keyword match) |
| `FILL_BLANK` | Fill-in-the-blank with expected text | Yes (keyword match) |
| `ESSAY` | Long-form written response | No (manual grading) |

**Quiz settings**: Time limit, max attempts, passing score, question randomization, immediate vs delayed results
**Database**: `quizzes`, `quiz_questions`, `quiz_answer_options`, `quiz_correct_answers`, `student_quiz_attempts`, `student_quiz_responses`
**Components**: `QuizBuilder.jsx` (teacher), `QuizTaker.jsx` / `EnhancedQuizTaker.jsx` (student)
**AI**: `generateQuiz()` - Generates quiz with configurable question count, types, difficulty, and Bloom's taxonomy progression

---

### ASSIGNMENT

Assignments with instructions, rubrics, and submission tracking.

**Fields**:
- `assignment_description`: Detailed instructions (min 200 chars for AI-generated)
- `total_points`: Point value (default 100)
- `rubric_criteria`: Array of criteria with points and descriptions
- Assignment details PDF: `assignment_details_file_path`, `assignment_details_file_name`, etc.
- Rubric PDF: `assignment_rubric_file_path`, `assignment_rubric_file_name`, etc.

**Submissions**: Students upload files via `student_submissions` table
- `submission_text`, `file_url`, `file_path`, `file_name`, `file_size`, `mime_type`
- One submission per student per assessment (unique constraint)

**AI**: `generateAssignmentRubric()` - Creates grading rubrics with 4 criteria, real-world tasks with steps

---

### IMAGE_HOTSPOT
Interactive images with clickable regions that reveal information.
- Click-able regions defined on an image
- Each region has associated content/explanation

### DRAG_DROP
Drag-and-drop matching or sorting exercises.
- Draggable items matched to drop zones
- Configurable matching criteria

### FILL_BLANKS
Fill-in-the-blank text exercises.
- Text with blanked-out portions
- Expected answers for each blank

### MEMORY_GAME
Memory card matching game.
- Pairs of cards to be matched
- Timed or untimed play modes

---

## 4. Instructional Content Blocks

These content types structure the pedagogical flow of a lesson. They contain rich text and are organized into lesson sections following the Gradual Release of Responsibility (GRR) model.

| Content Type | Section | Purpose |
|---|---|---|
| `LEARNING_OUTCOMES` | Introduction | Essential question, 3-5 Bloom's taxonomy objectives, guiding questions, prior knowledge activation |
| `KEY_CONCEPTS` | Learning | Core concepts with definitions, examples, vocabulary, formative checks |
| `LEARNING_ACTIVITIES` | Learning | Guided-to-independent activities tied to outcomes with steps and materials |
| `REFLECTION_QUESTIONS` | Closure | "I can" self-assessment per outcome, metacognitive questions |
| `DISCUSSION_PROMPTS` | Closure | Open-ended critical thinking questions for class discussion |
| `SUMMARY` | Closure | Key takeaways tied to outcomes, revisits essential question |
| `PRESENTATION` | Learning | Presentation slides or structured presentation content |

All of these are AI-generatable as part of `generateCompleteLessonContent()`.

---

## 5. Assessment Types

The `subject_assessments` table supports these assessment types (distinct from content types):

| Assessment Type | Description |
|---|---|
| `TEST` | Formal test or quiz |
| `QUIZ` | Shorter formative quiz |
| `SBA` | School-Based Assessment (Caribbean-specific coursework) |
| `PROJECT` | Project-based assessment |
| `MOCK_EXAM` | Practice/mock examination |
| `EXAM` | Formal end-of-term or end-of-year examination |

Each assessment has: title, description, total marks, weight percentage, due date, and term assignment. Student grades are recorded in `student_grades` with marks, letter grades, and teacher comments.

---

## 6. AR/VR & 3D Content

Stored in the `arvr_content` table. Managed via `ARVRContentManager.jsx`.

### Content Types

| Type | Description |
|---|---|
| `3D_MODEL` | Interactive 3D models viewable in browser |
| `AR_OVERLAY` | Augmented Reality marker-based content |
| `VR_EXPERIENCE` | Virtual Reality immersive experiences |
| `FIELD_TRIP` | Virtual field trips with location-based content |

### Supported 3D Model Formats
- **GLTF/glTF** - Web-optimized 3D format (recommended)
- **OBJ** - Wavefront 3D object
- **FBX** - Autodesk exchange format
- **USDZ** - Apple AR format (iOS AR Quick Look)

### Properties
- **Model properties** (JSONB): Scale, rotation, position, animations, auto-rotate, camera controls
- **Annotations** (JSONB): 3D labels and information points on models
- **Interaction modes**: VIEW_ONLY, INTERACTIVE, GUIDED_TOUR
- **AR markers**: Marker image URL for AR marker-based detection
- **VR scenes**: Scene configuration for VR experiences
- **Field trips**: Location name, GPS coordinates, virtual tour URL
- **Metadata**: Difficulty level, estimated duration, learning objectives

### Session Tracking (`arvr_sessions`)
- Session state, interaction logs, screenshots
- Completion percentage, time spent
- Student observations and notes

---

## 7. Virtual Labs & Simulations

Stored in the `virtual_labs` table.

### Lab Types

| Lab Type | Description |
|---|---|
| `SCIENCE` | General science experiments |
| `MATH` | Mathematical simulations |
| `CHEMISTRY` | Chemical reaction simulations |
| `PHYSICS` | Physics experiments and models |
| `BIOLOGY` | Biological process simulations |

### Simulation Types

| Simulation Type | Description |
|---|---|
| `INTERACTIVE` | Hands-on interactive simulation |
| `ANIMATION` | Animated demonstration |
| `3D_MODEL` | 3D model exploration |
| `VR` | Virtual reality simulation |

### Features
- **Lab content** (JSONB): Configuration, parameters, variables
- **Initial state** (JSONB): Starting conditions for the simulation
- **Learning objectives**: What students should learn
- **Time limits**: Optional time-boxed sessions
- **Reset**: Allow students to restart simulations
- **Instructions**: Written instructions and/or video guides

### Session Tracking (`lab_sessions`)
- **Session state** (JSONB): Current state of the simulation
- **Actions log** (JSONB): Complete log of student actions
- **Results** (JSONB): Measurements, calculations, outcomes
- **Observations / Conclusions**: Student-written analysis
- **Scoring**: Optional score per session
- **Duration**: Time tracking (started, completed, duration in minutes)

---

## 8. AI-Generated Content

All AI generation uses OpenAI GPT-4o-mini via a server-side proxy (`POST /api/ai/chat`). The API key is never exposed to the client.

### 8.1 AI Lesson Service (`aiLessonService.jsx`)

#### `generateLessonPlan()`
Generates a complete lesson plan structure.
- **Input**: Subject, topic, grade level, duration, previous topics
- **Output**: Lesson plan with objectives, activities, and assessment strategies

#### `generateEnhancedLessonPlan()`
Extended lesson plan with additional pedagogical detail.
- **Input**: Subject, form, topic, duration, learning style preferences, special needs
- **Output**: Enhanced plan with differentiation strategies and inclusive learning

#### `generateCompleteLessonContent()`
Generates a full set of lesson content items following the GRR model.
- **Input**: Lesson title, topic, subject, form, learning objectives, duration
- **Options**:
  - `numVideos` (default 2): Number of YouTube videos to find
  - `videoDuration`: Filter by video length
  - `includeViewingGuide` (default true): Pre/post viewing guides
  - `numQuizQuestions` (default 5): Quiz question count
  - `questionTypes`: Toggle MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, FILL_IN_THE_BLANK
  - `numActivities` (default 2): Number of learning activities
  - `includeAssignment` (default true): Include assignment with rubric
  - `includeReflectionQuestions` (default true): Include reflection
  - `includeDiscussionPrompts` (default false): Include discussion prompts
- **Output**: JSON array of content items in order:
  1. LEARNING_OUTCOMES (Introduction)
  2. KEY_CONCEPTS (Learning)
  3. VIDEO (Learning) - with real YouTube URLs matched to learning outcomes
  4. LEARNING_ACTIVITIES (Learning)
  5. QUIZ (Assessment)
  6. ASSIGNMENT (Assessment) - if enabled
  7. REFLECTION_QUESTIONS (Closure) - if enabled
  8. DISCUSSION_PROMPTS (Closure) - if enabled
  9. SUMMARY (Closure)
- **Bloom's taxonomy**: Questions progress from Remember to Apply to Evaluate
- **YouTube integration**: Searches YouTube API for videos matched to learning outcomes, injects real URLs

#### `generateStudentFacingContent()`
Generates student-visible content from a lesson plan (simplified, student-friendly language).
- **Input**: Lesson title, topic, subject, form, lesson plan text
- **Output**: Student-friendly content structure

#### `generateFlashcards()`
Creates flashcard decks from a topic.
- **Input**: Topic, subject, grade level, number of cards (1-50), difficulty (easy/medium/hard)
- **Output**: `FlashcardData` with cards array and default settings
- **Features**: Configurable card count, difficulty-appropriate language

#### `generateInteractiveVideo()`
Creates interactive video checkpoints for a given topic.
- **Input**: Topic, subject, grade level, learning outcomes, checkpoint count, checkpoint types
- **Output**: `InteractiveVideoData` with checkpoint array
- **Checkpoint types**: question, quiz, note, pause, reflection (configurable subset)
- **Note**: Does NOT find/provide the video URL itself - teacher provides the video

#### `generateInteractiveBook()`
Generates a complete interactive book structure.
- **Input**: Topic, subject, grade level, number of pages, page types (content/video/quiz)
- **Output**: `InteractiveBookData` with pages array
- **Features**: Mix of content pages, quiz pages, and video reference pages

#### `generateQuiz()`
Creates standalone quizzes with questions and answers.
- **Input**: Topic, subject, form, lesson title, learning objectives, question count, question types, difficulty
- **Output**: Quiz data with questions, options, correct answers, explanations
- **Features**: Configurable question types, Bloom's progression, misconception-based distractors

#### `generateAssignmentRubric()`
Creates grading rubrics for assignments.
- **Input**: Assignment title, description, subject, grade level, total points
- **Output**: Rubric with 4 criteria, each with points and descriptions, plus a real-world task description

---

### 8.2 Curriculum AI Service (`curriculumAIService.js`)

Uses GPT-3.5-turbo for lighter curriculum generation tasks.

#### `generateUnits()`
Generates instructional units for a curriculum topic.
- **Input**: Topic title, subject, grade level, overview
- **Output**: 3-5 units with title, SCO number, specific curriculum outcomes, duration

#### `generateActivities()`
Generates classroom activities aligned to learning outcomes.
- **Input**: Learning outcomes, grade level, subject
- **Output**: 3 hands-on activities with description, duration, materials, learning objectives

#### `generateDifferentiation()`
Generates inclusive learning / differentiation strategies.
- **Input**: Unit context, student needs
- **Output**: 3-4 strategies with title, description, target group (e.g., Visual Learners, ADHD)

#### `findResources()`
Discovers educational resources combining YouTube search and AI suggestions.
- **Input**: Search query, subject, grade level
- **Output**: Mixed array of:
  - YouTube videos (from YouTube Data API v3)
  - AI-suggested educational games and websites (with URLs, descriptions)

---

### 8.3 AI Tutor (`server.js` - POST /api/ai/tutor)

Real-time conversational AI tutor for students.

- **Model**: GPT-4o-mini with OpenAI function calling
- **Method**: Socratic (guides students to answers, never gives direct solutions)
- **Tool calls**:
  - `search_youtube_videos` - Finds educational videos relevant to the question
  - `search_web_resources` - Finds educational websites and articles
- **Context-aware**: Receives student profile, subject, class, and teacher-set boundaries
- **Persistence**: Conversations stored in `tutor_conversations` / `tutor_messages` tables
- **Controls**: Teachers enable/disable per class-subject, with per-student overrides

---

### 8.4 Auto-Tagging Service (`autoTaggingService.js`)

Automatic tag generation for content library items.

- **Method**: Keyword extraction and pattern matching (not AI model-based)
- **Sources**: Extracts tags from title, description, learning objectives, key concepts, topic
- **Auto-tags**: Content type, subject ID, form/grade level
- **Usage**: Applied when content is shared to the content library

---

## 9. AI Lesson Planner Fields

The system provides two AI lesson planner interfaces: a **Basic Planner** (`AILessonPlanner.jsx`) for quick generation and an **Enhanced Planner** (`EnhancedLessonPlannerForm.jsx`) with full pedagogical control across three tabs.

---

### 9.1 Basic AI Lesson Planner

A streamlined form for quick lesson plan generation. Uses `generateLessonPlan()` with GPT-3.5-turbo.

#### Input Fields

| Field | Type | Required | Description |
|---|---|---|---|
| **Topic** | Text | Yes | The lesson topic (e.g., "Introduction to Algebra"). Pre-filled from lesson context if available. |
| **Grade Level / Form** | Text | Yes | The form or grade level (e.g., "Form 1", "Grade 10"). Pre-filled from the class context. |
| **Duration** | Select | No | Lesson duration. Options: 30, 45 (default), 60, 90 minutes. |
| **Learning Style** | Select | No | Preferred learning style emphasis. Options: Any (default), Visual, Auditory, Kinesthetic, Reading/Writing, Mixed. |
| **Previous Topics Covered** | Rich Text (TinyMCE) | No | Prior topics that relate to this lesson. Helps AI build contextual connections and spiral curriculum references. |

**Auto-provided** (not user-editable): `subject` is passed from the class-subject context.

#### Output

Returns a JSON object with four fields that populate the lesson form:

| Output Field | Maps To | Description |
|---|---|---|
| `lesson_title` | Lesson title | An engaging, descriptive lesson title |
| `learning_objectives` | Learning objectives | 3-5 measurable Bloom's taxonomy-aligned objectives |
| `lesson_plan` | Lesson plan | Step-by-step plan: Introduction/Warm-up, Main Content, Practice/Application, Assessment, Closure/Summary |
| `homework_description` | Homework | A meaningful homework assignment with specific instructions |

---

### 9.2 Enhanced AI Lesson Planner

A comprehensive three-tab form for detailed lesson plan generation. Uses `generateEnhancedLessonPlan()` with GPT-4o-mini. Designed specifically for Caribbean secondary schools with curriculum alignment.

Form data is auto-saved to localStorage (expires after 24 hours) so teachers don't lose progress.

#### Tab 1: Basic Info

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| **Subject** | Text | Yes | Pre-filled | The academic subject (e.g., "Mathematics"). Auto-filled from class-subject context. |
| **Form** | Text | Yes | Pre-filled | The form/year group (e.g., "Form 3"). Auto-filled from class context. |
| **Class** | Text | No | Pre-filled | The specific class stream (e.g., "3A"). Auto-filled from class context. |
| **Curriculum Topic** | Select | No | - | Dropdown populated from the national curriculum structure stored in `subject_form_offerings.curriculum_structure`. Selecting a topic auto-fills the Topic, Essential Learning Outcomes, and curriculum standards. Only appears when curriculum data exists for the class-subject. |
| **Instructional Unit (SCO)** | Select | No | - | Dropdown of Specific Curriculum Outcomes within the selected topic. Selecting a unit auto-fills Topic (with SCO detail), Learning Outcomes, Prerequisite Skills (from inclusive assessment strategies), and narrows curriculum standards to the specific SCO. Disabled until a topic is selected. |
| **Topic** | Text | Yes | - | The lesson topic. Can be typed manually or auto-filled by selecting a curriculum topic/unit above. |
| **Essential Learning Outcomes** | Textarea + Select | No | - | High-level learning outcomes. A dropdown allows selecting from curriculum-defined ELOs (if curriculum data exists). Multiple selections append to the textarea. |
| **Learning Outcomes** | Textarea + Select | No | - | Specific curriculum outcomes. A dropdown shows SCOs from the curriculum (filtered by selected topic if one is chosen). Multiple selections append to the textarea. |
| **Student Count** | Number | No | 20 | Number of students in the class. Influences group activity sizing in the generated plan. |
| **Duration** | Select | No | 45 min | Lesson duration. Options: 30, 45, 60, 90 minutes. Controls timing proportions in the generated plan (e.g., Concept Development gets 50-60% of total duration). |

#### Tab 2: Teaching Strategy

| Field | Type | Options | Description |
|---|---|---|---|
| **Pedagogical Strategies** | Multi-checkbox | Inquiry-Based Learning, Project-Based Learning, Cooperative Learning, Direct Instruction, Discovery Learning, Problem-Based Learning | Select one or more teaching approaches. The AI tailors activities to use the selected strategies. |
| **Learning Styles** | Multi-checkbox | Visual, Auditory, Kinesthetic, Reading/Writing | Target specific learning modalities. The AI includes activities that address the selected styles. |
| **Learning Preferences** | Multi-checkbox | Group work, Individual work, Pairs, Whole class | Preferred classroom organization. Influences how activities are structured (group size, collaboration). |
| **Multiple Intelligences** | Multi-checkbox | Linguistic, Logical-Mathematical, Spatial, Musical, Bodily-Kinesthetic, Interpersonal, Intrapersonal, Naturalistic | Gardner's Multiple Intelligences. The AI designs activities that engage the selected intelligence types. |
| **Materials Needed** | Textarea | Free text | List of required physical and digital materials. Included in the generated plan's resources section. |
| **Prerequisite Skills** | Textarea | Free text | Skills or knowledge students need before this lesson. Auto-filled from curriculum SCO data if a unit is selected. Informs the AI's introduction/hook design. |

#### Tab 3: Additional Details

| Field | Type | Required | Description |
|---|---|---|---|
| **Special Needs Accommodations** | Checkbox | No | Toggle to enable special needs section. When checked, reveals the details textarea. |
| **Special Needs Details** | Textarea | No | Specific accommodations needed (e.g., "2 students with ADHD, 1 with visual impairment"). The AI generates a dedicated accommodations section with modifications for activities and assessments. Only visible when the checkbox above is checked. |
| **Additional Instructions** | Textarea | No | Free-form instructions for the AI (e.g., "Focus on real-world applications", "Include a debate activity", "Avoid group work today"). Any context or constraints the teacher wants the AI to consider. |
| **Reference URL** | URL | No | An external reference URL the teacher wants the AI to consider when generating the plan. |

#### Curriculum Integration

When a `classSubjectId` is provided, the Enhanced Planner automatically:

1. Fetches the curriculum structure from `subject_form_offerings` via Supabase
2. Matches by `form_number` to find the correct national curriculum offering
3. Populates the **Curriculum Topic** and **Instructional Unit** dropdowns
4. Extracts essential learning outcomes, specific curriculum outcomes, assessment strategies, learning strategies, and suggested activities
5. Passes the full curriculum standards text to the AI prompt for alignment

#### Output

Returns a structured JSON lesson plan with:

| Output Section | Description |
|---|---|
| **Lesson Header** | Subject, form, class, topic, ELOs, SCOs, duration |
| **Objectives Table** | Three-column table: Knowledge, Skills, Values |
| **Lesson Components** | Detailed timed sections with teacher scripts and student-level explanations: |
| - Prompter/Hook | 1-3 min. Teacher instructions, dialogue, student explanation, expected responses |
| - Introduction | 2-3 min. Prior knowledge connection, teacher script, student-friendly objectives |
| - Concept Development & Practice | 50-60% of duration. 3-5 sub-activities, each with: numbered teacher instructions, teacher dialogue, student-level explanations, examples, student actions, misconceptions, formative checks, timing |
| - Reflect and Share | 3-5 min. Reflection questions, sharing process, addressing misconceptions |
| **Assessment** | Formative strategies, assessment activities aligned to outcomes, rubrics/checklists |
| **Resources** | Materials organized by lesson phase |
| **Homework/Extension** | Meaningful assignment with clear instructions |
| **Special Needs Accommodations** | (Only if special needs was enabled) Modifications for activities and assessments |

The output also includes a `curriculumRef` metadata object linking back to the specific curriculum topic/unit:
- `topic_number`, `topic_title` — Which curriculum topic was used
- `sco_number`, `unit_number`, `sco_title` — Which specific SCO was targeted

This metadata is dispatched via a `lessonPlanGenerated` custom DOM event for other components (e.g., curriculum analytics) to consume.

---

## 10. Content Sections & Lesson Structure

Content items are organized into sections following the Gradual Release of Responsibility (GRR) instructional model:

| Section | Phase | Content Types Typically Used |
|---|---|---|
| **Introduction** | "I do" - Teacher models | LEARNING_OUTCOMES |
| **Learning** | "We do" / "You do together" | KEY_CONCEPTS, VIDEO, LEARNING_ACTIVITIES, PRESENTATION, FLASHCARD, INTERACTIVE_VIDEO, INTERACTIVE_BOOK |
| **Assessment** | "You do independently" | QUIZ, ASSIGNMENT |
| **Closure** | Reflect and summarize | REFLECTION_QUESTIONS, DISCUSSION_PROMPTS, SUMMARY |

Each content item has:
- `content_type` - Type identifier
- `title` - Display title
- `content_text` - Rich text / HTML content
- `content_section` - GRR section (Introduction, Learning, Assessment, Closure)
- `sequence_order` - Display order within the lesson
- `is_required` - Whether students must complete it
- `estimated_minutes` - Estimated time to complete
- `content_data` (JSONB) - Interactive content structure (for FLASHCARD, INTERACTIVE_VIDEO, INTERACTIVE_BOOK, QUIZ)
- `metadata` (JSONB) - Additional properties (for 3D models, AR content, etc.)

### Content Library

Any content item can be shared to the content library (`content_library` table) for reuse across lessons by other teachers. Library items have:
- Tags for searchability (GIN-indexed full-text search)
- Ratings and reviews (1-5 stars)
- Usage tracking (how many lessons use it)
- View counts
- Public/private visibility
- Featured/verified flags (admin-controlled)

### Lesson Templates

Complete lesson structures can be saved as templates (`lesson_templates` table) with all content items preserved for one-click reuse. Templates include ratings, favorites, usage tracking, and version control.
