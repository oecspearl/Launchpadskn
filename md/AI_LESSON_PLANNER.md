# AI Lesson Planner - Fields & Workflow

This document describes the fields, workflow, and output of the AI Lesson Planner system in LaunchPad SKN.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Basic AI Lesson Planner](#2-basic-ai-lesson-planner)
3. [Enhanced AI Lesson Planner](#3-enhanced-ai-lesson-planner)
4. [Curriculum Integration](#4-curriculum-integration)
5. [AI Generation Details](#5-ai-generation-details)
6. [Plan Display & Editing](#6-plan-display--editing)
7. [End-to-End Workflow](#7-end-to-end-workflow)
8. [From Plan to Lesson Content](#8-from-plan-to-lesson-content)
9. [Data Structures](#9-data-structures)

---

## 1. Overview

The AI Lesson Planner system provides two interfaces for generating lesson plans:

| Planner | Component | AI Function | Model | Use Case |
|---|---|---|---|---|
| **Basic** | `AILessonPlanner.jsx` | `generateLessonPlan()` | GPT-3.5-turbo | Quick, lightweight lesson plan generation |
| **Enhanced** | `EnhancedLessonPlannerForm.jsx` | `generateEnhancedLessonPlan()` | GPT-3.5-turbo (temp 0.3) | Comprehensive plans with curriculum alignment, pedagogical strategies, and special needs support |

Both planners are accessed from the **Lesson Planning** page (`LessonPlanning.jsx`) at route `/teacher/class-subjects/:classSubjectId/lessons`.

### Access Methods

- **Modal view (recommended)**: Click "Show AI Planner" to open a split-screen modal with the Enhanced Planner on the left and a live preview on the right
- **Inline accordion**: The Enhanced Planner also appears in an accordion within the lesson creation form when creating a new lesson

---

## 2. Basic AI Lesson Planner

A streamlined, single-panel form for quick lesson plan generation.

### Input Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| **Topic** | Text | Yes | From context | The lesson topic (e.g., "Introduction to Algebra"). Pre-filled from the lesson context if available. |
| **Grade Level / Form** | Text | Yes | From context | The form or grade level (e.g., "Form 1", "Grade 10"). Pre-filled from the class context. |
| **Duration** | Dropdown | No | 45 min | Lesson duration. Options: 30, 45, 60, 90 minutes. |
| **Learning Style** | Dropdown | No | Any | Preferred learning style emphasis. Options: Any, Visual, Auditory, Kinesthetic, Reading/Writing, Mixed. |
| **Previous Topics Covered** | Rich Text (TinyMCE) | No | Empty | Prior topics that relate to this lesson. Helps the AI build contextual connections and spiral curriculum references. Supports formatting (bold, italic, lists). |

**Auto-provided** (not user-editable): `subject` is passed from the class-subject context.

### Output Fields

Returns a JSON object with four fields that directly populate the lesson form:

| Output Field | Maps To | Description |
|---|---|---|
| `lesson_title` | Lesson Title | An engaging, descriptive lesson title |
| `learning_objectives` | Learning Objectives | 3-5 measurable, Bloom's taxonomy-aligned objectives |
| `lesson_plan` | Lesson Plan | Step-by-step plan: Introduction/Warm-up, Main Content, Practice/Application, Assessment, Closure/Summary |
| `homework_description` | Homework | A meaningful homework assignment with specific instructions |

---

## 3. Enhanced AI Lesson Planner

A comprehensive three-tab form designed specifically for Caribbean secondary schools. Form data is auto-saved to localStorage (expires after 24 hours) so teachers don't lose progress between sessions.

### Tab 1: Basic Info

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| **Subject** | Text | Yes | Pre-filled | The academic subject (e.g., "Mathematics"). Auto-filled from class-subject context. |
| **Form** | Text | Yes | Pre-filled | The form/year group (e.g., "Form 3"). Auto-filled from class context. |
| **Class** | Text | No | Pre-filled | The specific class stream (e.g., "3A"). Auto-filled from class context. |
| **Curriculum Topic** | Dropdown | No | - | Populated from the national curriculum structure stored in `subject_form_offerings.curriculum_structure`. Selecting a topic auto-fills the Topic field, Essential Learning Outcomes, and curriculum standards passed to the AI. Only appears when curriculum data exists for the class-subject. |
| **Instructional Unit (SCO)** | Dropdown | No | - | Specific Curriculum Outcomes within the selected topic. Selecting a unit auto-fills Topic (with SCO detail), Learning Outcomes, and Prerequisite Skills (from inclusive assessment strategies). Also narrows the curriculum standards context to the specific SCO, its assessment strategies, learning strategies, and suggested activities. Disabled until a topic is selected. |
| **Topic** | Text | Yes | - | The lesson topic. Can be typed manually or auto-filled by selecting a curriculum topic/unit above. When auto-filled from a unit, the format is: `"Topic Title -- SCO Description"`. |
| **Essential Learning Outcomes** | Textarea + Dropdown | No | - | High-level learning outcomes for the topic. A dropdown (when curriculum data exists) allows selecting from curriculum-defined ELOs. Multiple selections append to the textarea, building up a list. |
| **Learning Outcomes** | Textarea + Dropdown | No | - | Specific curriculum outcomes (SCOs). A dropdown shows SCOs from the curriculum, filtered by selected topic if one is chosen. Multiple selections append to the textarea. |
| **Student Count** | Number | No | 20 | Number of students in the class. Influences group activity sizing and classroom organization in the generated plan. |
| **Duration** | Dropdown | No | 45 min | Lesson duration. Options: 30, 45, 60, 90 minutes. Controls timing proportions in the generated plan (e.g., Concept Development gets 50-60% of total duration). |

### Tab 2: Teaching Strategy

| Field | Type | Options | Description |
|---|---|---|---|
| **Pedagogical Strategies** | Multi-checkbox | Inquiry-Based Learning, Project-Based Learning, Cooperative Learning, Direct Instruction, Discovery Learning, Problem-Based Learning | Select one or more teaching approaches. The AI tailors activities to use the selected strategies. If none selected, the AI uses appropriate strategies based on topic and student needs. |
| **Learning Styles** | Multi-checkbox | Visual, Auditory, Kinesthetic, Reading/Writing | Target specific learning modalities. The AI includes activities that address the selected styles. If none selected, the AI caters to multiple styles. |
| **Learning Preferences** | Multi-checkbox | Group work, Individual work, Pairs, Whole class | Preferred classroom organization. Influences how activities are structured (group size, collaboration format). If none selected, the AI uses a mix. |
| **Multiple Intelligences** | Multi-checkbox | Linguistic, Logical-Mathematical, Spatial, Musical, Bodily-Kinesthetic, Interpersonal, Intrapersonal, Naturalistic | Gardner's Multiple Intelligences framework. The AI designs activities that engage the selected intelligence types. If none selected, the AI addresses various intelligences. |
| **Materials Needed** | Textarea | Free text | List of required physical and digital materials/resources. Included in the generated plan's Resources section and referenced in activity instructions. |
| **Prerequisite Skills** | Textarea | Free text | Skills or knowledge students need before this lesson. Auto-filled from curriculum SCO assessment strategies if a unit is selected. Informs the AI's Introduction/Hook design and prior knowledge connections. |

### Tab 3: Additional Details

| Field | Type | Required | Description |
|---|---|---|---|
| **Special Needs Accommodations** | Checkbox | No | Toggle to enable special needs support. When checked, reveals the details textarea below. |
| **Special Needs Details** | Textarea | No | Specific accommodations needed (e.g., "2 students with ADHD, 1 with visual impairment"). When provided, the AI generates a dedicated accommodations section with modifications for each activity and assessment. Only visible when the checkbox above is checked. |
| **Additional Instructions** | Textarea | No | Free-form instructions for the AI. Examples: "Focus on real-world applications", "Include a debate activity", "Avoid group work today", "Use local SKN examples". Any context or constraints the teacher wants the AI to consider. |
| **Reference URL** | URL | No | An external reference URL (e.g., a textbook resource, educational website) that the teacher wants the AI to consider when generating the plan. |

### Enhanced Planner Output

The Enhanced Planner generates a structured JSON lesson plan with these sections:

| Output Section | Content |
|---|---|
| **Lesson Header** | Subject, Form, Class, Topic, Essential Learning Outcomes, Specific Learning Outcomes, Duration |
| **Objectives Table** | Three-column table: Knowledge (what students will know), Skills (what they can do), Values (attitudes to develop) |
| **Lesson Components** | Detailed timed sections (see below) |
| **Assessment** | Formative strategies, assessment activities aligned to outcomes, rubrics/checklists, checkpoint questions at each phase |
| **Resources** | Materials organized by lesson phase (Introduction, Concept Development, Reflection, Digital resources) |
| **Homework/Extension** | Assignment with student-friendly explanation, step-by-step instructions, and extension activities for advanced students |
| **Special Needs Accommodations** | (Only if enabled) Modifications for activities and assessments |

#### Lesson Components Detail

Each lesson component includes teacher scripts, student-level explanations, and step-by-step instructions:

| Component | Timing | Key Fields |
|---|---|---|
| **Prompter/Hook** | 1-3 min | `teacher_instructions`, `teacher_dialogue`, `student_explanation`, `student_actions`, `expected_responses` |
| **Introduction** | 2-3 min | `teacher_instructions`, `teacher_dialogue`, `student_explanation`, `connection_to_prior_knowledge` |
| **Concept Development & Practice** | 50-60% of duration | 3-5 `sub_activities`, each with: `name`, `timing`, `teacher_instructions`, `teacher_dialogue`, `student_explanation`, `examples`, `student_actions`, `practice_exercises`, `common_misconceptions`, `formative_checkpoint`, `learning_style_integration`. Plus `transitions` between activities. |
| **Reflect and Share** | 3-5 min | `reflection_questions`, `sharing_process`, `student_language_guide`, `addressing_questions` |
| **Closure** | 2-3 min | `teacher_instructions`, `teacher_dialogue`, `student_explanation`, `connection_to_next_lesson` |

The output also includes a `curriculumRef` metadata object:
- `topic_number`, `topic_title` - Which curriculum topic was used
- `sco_number`, `unit_number`, `sco_title` - Which specific SCO was targeted

This metadata is dispatched via a `lessonPlanGenerated` custom DOM event for other components (e.g., curriculum analytics tracking) to consume.

---

## 4. Curriculum Integration

When a `classSubjectId` is provided, the Enhanced Planner automatically integrates with the national curriculum.

### Auto-Fetch Flow

1. On mount, queries `class_subjects` to get `subject_offering_id` and `form_number`
2. Queries `subject_form_offerings` to find the matching curriculum offering
3. Extracts `curriculum_structure` (JSONB) containing topics and instructional units
4. Populates the **Curriculum Topic** dropdown with available topics
5. Each topic contains `instructionalUnits` with SCOs, assessment strategies, learning strategies, and suggested activities

### What Auto-Fill Does

| User Action | Fields Auto-Filled |
|---|---|
| Select a **Curriculum Topic** | Topic name, Essential Learning Outcomes (from topic ELOs), full curriculum standards text |
| Select an **Instructional Unit (SCO)** | Topic (with SCO description), Learning Outcomes (specific SCO text), Prerequisite Skills (from inclusive assessment strategies), focused curriculum standards (narrowed to specific SCO including assessment strategies, learning strategies, and suggested activities) |
| Select an **Essential Learning Outcome** (dropdown) | Appends selected ELO to the Essential Learning Outcomes textarea |
| Select a **Learning Outcome** (dropdown) | Appends selected SCO to the Learning Outcomes textarea |

### Curriculum Context Passed to AI

The curriculum standards text is assembled and passed to the AI prompt. It includes:
- Topic numbers and titles
- Essential learning outcomes per topic
- Specific curriculum outcomes (SCOs) with SCO numbers
- Assessment strategies and learning strategies per SCO
- Suggested activities from the curriculum framework
- Any curriculum_framework or learning_outcomes text from the offering

This ensures the AI generates plans that are aligned with the official SKN national curriculum.

---

## 5. AI Generation Details

### Basic Planner (`generateLessonPlan`)

| Parameter | Value |
|---|---|
| **Model** | GPT-3.5-turbo |
| **Temperature** | 0.7 |
| **Max tokens** | 2000 |
| **Endpoint** | `POST /api/ai/chat` (server-side proxy) |
| **System prompt** | Expert educational lesson planner; respond with only valid JSON |
| **Required input** | subject, topic, gradeLevel, duration |

The prompt requests a simple 4-field JSON response (lesson_title, learning_objectives, lesson_plan, homework_description) with a step-by-step plan covering: Introduction/Warm-up, Main Content, Practice/Application, Assessment, Closure/Summary.

### Enhanced Planner (`generateEnhancedLessonPlan`)

| Parameter | Value |
|---|---|
| **Model** | GPT-3.5-turbo |
| **Temperature** | 0.3 (lower for more consistent, factual output) |
| **Max tokens** | 4096 |
| **Endpoint** | `POST /api/ai/chat` (server-side proxy) |
| **System prompt** | Expert educational lesson planner; respond with only valid JSON |
| **Required input** | subject, form, topic, duration |

The prompt is 230+ lines and explicitly instructs the AI to:
- Use ONLY the provided information (no invented content)
- Follow structured lesson plan format for Caribbean secondary education
- Write all student-facing content at the appropriate form/grade reading level
- Provide teacher dialogue scripts for each activity
- Break down complex concepts into simple, step-by-step explanations
- Address common misconceptions
- Include formative assessment checkpoints throughout
- Apply Bloom's Taxonomy progression
- Integrate selected pedagogical strategies, learning styles, and multiple intelligences
- Keep activities practical and classroom-executable

### Response Processing

Both planners handle AI responses with multiple fallback strategies:
1. Extract JSON from markdown code blocks (` ```json { ... } ``` `)
2. Find the first JSON object match in the response text
3. Parse the entire response as JSON directly
4. Fallback: construct a minimal lesson plan from raw text extraction

The Enhanced Planner also converts structured `lesson_plan` objects into formatted strings using `formatStructuredLessonPlan()` for display.

---

## 6. Plan Display & Editing

After generation, the plan is displayed in **LessonPlanOutput.jsx** with a three-tab interface.

### Tab 1: Preview

Renders the plan using `StructuredLessonPlanDisplay.jsx`, which:
- Parses section headers (uppercase text surrounded by `===`)
- Identifies lesson components by colon-terminated titles
- Extracts detail items by emoji prefixes (timing, teacher instructions, student content, assessment)
- Displays each section as a collapsible card with:
  - Section icon and badge count
  - Color-coded detail items (blue for timing, orange for teacher, green for student, red for assessment)
  - All sections collapsed by default for easy scanning

### Tab 2: Edit

A full TinyMCE rich text editor allowing:
- Manual editing of all generated content
- Formatting (headers, bold, italic, lists, tables)
- Adding or removing sections
- Rewriting any part of the plan

### Tab 3: Details

Editable metadata fields:
- Lesson Title
- Subject
- Form
- Topic

### Action Buttons

| Button | Action |
|---|---|
| **Copy** | Copies the edited plan content to clipboard |
| **Download** | Downloads as a `.txt` file named `lesson-plan-{title}-{timestamp}.txt` |
| **Save** | Populates the main lesson form with the plan data and closes the modal |

---

## 7. End-to-End Workflow

### Step 1: Access Lesson Planning
Teacher navigates to `/teacher/class-subjects/:classSubjectId/lessons`. The page loads with class/subject context (subject name, form, class).

### Step 2: Open the AI Planner
Click "Show AI Planner" to open the split-screen modal:
- **Left panel** (col-lg-5): EnhancedLessonPlannerForm (scrollable, full height)
- **Right panel** (col-lg-7): LessonPlanOutput (live preview)

### Step 3: Fill the Form
- Select a curriculum topic/unit (optional but recommended for alignment)
- Enter or confirm the topic name
- Add learning outcomes (manually or from curriculum dropdowns)
- Set student count and duration
- Select pedagogical strategies, learning styles, preferences, intelligences
- Add materials, prerequisite skills, special needs details
- Provide any additional instructions

### Step 4: Generate the Plan
Click "Generate Lesson Plan". The system:
1. Validates required fields (subject, form, topic, duration)
2. Assembles the curriculum standards context
3. Sends the request to OpenAI via the server proxy
4. Receives and parses the structured JSON response
5. Dispatches a `lessonPlanGenerated` custom event

### Step 5: Preview & Edit
The LessonPlanOutput receives the event and displays:
- Formatted preview with collapsible sections
- Full editing capability via TinyMCE
- Metadata editing (title, subject, form, topic)

### Step 6: Save to Lesson
Click "Save" in the plan output. The plan data populates the lesson form:
- `lesson_title` - From the generated plan
- `topic` - From the form/generated plan
- `learning_objectives` - From the generated plan
- `lesson_plan` - Full formatted plan text
- `homework_description` - From the generated plan

The modal closes and the teacher returns to the lesson creation form.

### Step 7: Complete the Lesson
Teacher fills in remaining required fields:
- Lesson date
- Start time and end time
- Location (optional)
- Homework due date (optional)
- Status (SCHEDULED, COMPLETED, CANCELLED)

Click "Save Lesson" to create the lesson in the database.

### Step 8: Add Lesson Content (Optional)
After the lesson is created, the teacher can navigate to the **Lesson Content Manager** to generate full interactive content (see Section 8).

---

## 8. From Plan to Lesson Content

After a lesson is created with an AI-generated plan, the teacher can generate complete interactive content via the **Lesson Content Manager** (`LessonContentManager.jsx`).

### Content Generation Options

The "Generate AI Content" button in LessonContentManager uses `generateCompleteLessonContent()` which accepts:

| Option | Type | Default | Description |
|---|---|---|---|
| **Number of Videos** | Number | 2 | YouTube videos to discover and embed. Uses `searchVideosByOutcomes()` to find videos matching learning objectives. |
| **Video Duration** | Select | Any | Filter videos by length. |
| **Include Viewing Guide** | Boolean | true | Generate pre/post viewing questions for each video. |
| **Quiz Question Count** | Number | 5 | Number of quiz questions to generate. |
| **Question Types** | Checkboxes | MC + T/F | Enable/disable: Multiple Choice, True/False, Short Answer, Fill in the Blank. |
| **Number of Activities** | Number | 2 | Learning activities (guided-to-independent progression). |
| **Include Assignment** | Boolean | true | Generate an assignment with rubric (4 criteria, 100 points). |
| **Include Reflection Questions** | Boolean | true | Generate "I can" self-assessment and metacognitive questions. |
| **Include Discussion Prompts** | Boolean | false | Generate open-ended critical thinking questions. |

### Generated Content Items

The AI generates content items in this order, following the GRR (Gradual Release of Responsibility) model:

| Order | Content Type | Section | Description |
|---|---|---|---|
| 1 | `LEARNING_OUTCOMES` | Introduction | Essential question, 3-5 Bloom's objectives, guiding questions, prior knowledge connections |
| 2 | `KEY_CONCEPTS` | Learning | Core concepts with definitions, examples, vocabulary, formative check |
| 3 | `VIDEO` (x N) | Learning | YouTube videos with real URLs, descriptions, and optional viewing guides |
| 4 | `LEARNING_ACTIVITIES` | Learning | Guided-to-independent activities tied to outcomes with step-by-step instructions |
| 5 | `QUIZ` | Assessment | Questions with Bloom's progression (Remember to Evaluate), misconception-based distractors |
| 6 | `ASSIGNMENT` | Assessment | Real-world task with steps, 100 points, 4-criteria rubric |
| 7 | `REFLECTION_QUESTIONS` | Closure | "I can" self-assessment per outcome + metacognitive questions |
| 8 | `DISCUSSION_PROMPTS` | Closure | 3 open-ended critical thinking questions |
| 9 | `SUMMARY` | Closure | Key takeaways tied to outcomes, revisits essential question |

### YouTube Video Integration

The content generator searches for real YouTube videos before calling the AI:
1. Calls `searchVideosByOutcomes()` with learning objectives to find outcome-matched videos
2. Falls back to `searchEducationalVideos()` with topic/subject keywords
3. Searches for 2x the requested video count to provide options
4. Passes discovered video URLs to the AI prompt so it references real URLs (never invented ones)
5. Results include 30-minute server-side caching to reduce API calls

### Saving Content

When the teacher clicks "Save All" after reviewing generated content:
1. Each content item is prepared with: `lesson_id`, `content_type`, `title`, `content_text`, `content_section`, `sequence_order`, `is_required`, `estimated_minutes`
2. Type-specific fields are included:
   - QUIZ: `quiz_questions` array with question type, options, correct answers, explanations, points
   - ASSIGNMENT: `assignment_description`, `total_points`, `rubric_criteria`
   - VIDEO: `url`, `description`
3. Each item is inserted into the `lesson_content` table via `supabaseService.addLessonContent()`
4. Content list is refreshed after save

---

## 9. Data Structures

### Lesson Plan (AI Output)

```
{
  lesson_title: string,
  learning_objectives: string,
  lesson_plan: string | {
    "1. LESSON HEADER": { Subject, Form, Class, Topic, ELOs, SCOs, Duration },
    "2. OBJECTIVES TABLE": { columns: [{ Knowledge, Skills, Values }] },
    "3. LESSON COMPONENTS": {
      "Prompter/Hook": { timing, description, teacher_instructions, teacher_dialogue,
                         student_explanation, student_actions, expected_responses },
      "Introduction": { timing, description, teacher_instructions, teacher_dialogue,
                        student_explanation, connection_to_prior_knowledge },
      "Concept Development and Practice": {
        timing, description,
        sub_activities: [{
          name, timing, teacher_instructions, teacher_dialogue,
          student_explanation, examples, student_actions,
          practice_exercises, common_misconceptions,
          formative_checkpoint, learning_style_integration
        }],
        transitions
      },
      "Time to Reflect and Share": { timing, reflection_questions, sharing_process,
                                      student_language_guide, addressing_questions },
      "Closure": { timing, teacher_instructions, teacher_dialogue,
                   student_explanation, connection_to_next_lesson }
    },
    "4. ASSESSMENT": { formative_strategies, assessment_activities,
                       assessment_tools, checkpoint_questions },
    "5. RESOURCES": { Introduction, "Concept Development and Practice",
                      "Time to Reflect and Share", digital_resources },
    "6. HOMEWORK/EXTENSION": { Description, student_explanation,
                                step_by_step_instructions, extension_activities }
  },
  homework_description: string,
  materials_list: string,
  assessment_strategies: string,
  student_content: string,
  metadata: { subject, form, class, topic, duration, studentCount, generatedAt }
}
```

### Lesson (Database Record)

```
{
  lesson_id: BIGSERIAL (auto),
  class_subject_id: BIGINT (FK),
  lesson_date: DATE,
  start_time: TIME,
  end_time: TIME,
  lesson_title: VARCHAR(200),
  topic: VARCHAR(200),
  learning_objectives: TEXT,
  lesson_plan: TEXT,
  location: VARCHAR(100),
  homework_description: TEXT,
  homework_due_date: DATE,
  status: VARCHAR(20),     -- SCHEDULED | COMPLETED | CANCELLED
  session_id: BIGINT,      -- Optional, for virtual classrooms
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Content Item (Database Record)

```
{
  content_id: BIGSERIAL (auto),
  lesson_id: BIGINT (FK),
  content_type: VARCHAR(50),
  title: VARCHAR(200),
  content_text: TEXT,
  description: TEXT,
  url: TEXT,                   -- For external links/videos
  file_path: TEXT,             -- For uploaded files
  content_section: VARCHAR(50), -- Introduction | Learning | Assessment | Closure
  sequence_order: INTEGER,
  is_required: BOOLEAN,
  estimated_minutes: INTEGER,
  content_data: JSONB,         -- Interactive content structure (flashcards, etc.)
  metadata: JSONB,             -- Quiz questions, rubric criteria, etc.
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Curriculum Reference (Event Metadata)

```
{
  topic_number: integer,   -- Curriculum topic number
  topic_title: string,     -- Curriculum topic title
  sco_number: string,      -- SCO number (e.g., "1.1", "2.3")
  unit_number: integer,    -- Unit number within topic
  sco_title: string        -- Specific Curriculum Outcome title (truncated to 200 chars)
}
```

### lessonPlanGenerated Event Detail

```
{
  lessonPlan: string | object,    -- The generated plan content
  lessonTitle: string,            -- Plan title
  subject: string,                -- Subject name
  form: string,                   -- Form/grade level
  topic: string,                  -- Lesson topic
  curriculumRef: { ... },         -- Curriculum reference (see above)
  metadata: {
    ...formData,                  -- All form fields
    curriculumRef: { ... },       -- Curriculum reference
    generatedAt: ISO timestamp    -- Generation timestamp
  }
}
```
