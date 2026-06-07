-- =====================================================================
-- Phase 2 Migration: Student features + misc group
-- =====================================================================
-- Creates missing tables whose schemas are DERIVED from frontend usage in:
--   frontend/src/components/Student/AssignmentSubmission.jsx   (student_submissions)
--   frontend/src/services/interactiveContentService.js        (adaptive_learning_paths, student_badges)
--   frontend/src/components/InteractiveContent/AdaptiveLearningPaths.jsx (adaptive_learning_paths)
--   frontend/src/services/studentInformationService.js        (student_transfers, student_accommodations)
--   frontend/src/components/Admin/TransferManagement.jsx       (student_transfers)
--   frontend/src/components/Admin/SpecialNeedsTracking.jsx     (student_accommodations)
--   frontend/src/services/tutorService.js                      (student_accommodations)
--   frontend/src/services/classService.js                      (class_instructors)
--   frontend/src/components/Teacher/LessonContentManager.jsx   (quiz_options)
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
-- DROP POLICY IF EXISTS before each CREATE POLICY. Parent-before-child.
-- Runnable in one shot.
--
-- IMPORTANT FLAGS (see bottom of file and report):
--  * quiz_options is a near-DUPLICATE of existing quiz_answer_options.
--  * student_accommodations OVERLAPS existing student_special_needs.
--  * Per task instructions every table gets `id uuid PRIMARY KEY`. The
--    FRONTEND, however, reads/filters on working keys (submission_id,
--    transfer_id, accommodation_id, path_id). Those working-key columns
--    are ALSO included (UNIQUE) so the app keeps functioning.
--  * Spec lists users(id) as PK; FKs target public.users(id) per
--    instructions. Some embeds select users(user_id) -- verify PK name.
-- =====================================================================

-- Helper functions is_admin() / get_user_role() already exist in the live DB.
-- This migration intentionally does NOT redefine them (avoid altering shared RLS helpers).

-- =====================================================================
-- 1. student_submissions
--    Frontend: AssignmentSubmission.jsx
--    select('*'); .eq('assessment_id'), .eq('student_id'),
--    .eq('submission_id'); insert/update of:
--      assessment_id, student_id, submission_text, file_url,
--      file_path, file_name, submitted_at
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_submissions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key the frontend filters on (.eq('submission_id', ...))
    submission_id   uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    assessment_id   uuid REFERENCES public.subject_assessments(id) ON DELETE CASCADE, -- *_id -> uuid; FLAG: frontend parseInt()s this
    student_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,               -- owner -> CASCADE
    submission_text text,                                                             -- text
    file_url        text,                                                             -- text
    file_path       text,                                                             -- path -> jsonb? here a storage path string -> text (FLAG)
    file_name       text,                                                             -- text
    submitted_at    timestamptz,                                                      -- *_at -> timestamptz
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_submissions_submission_id ON public.student_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_assessment_id ON public.student_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_student_id    ON public.student_submissions(student_id);

-- =====================================================================
-- 2. student_badges
--    Frontend: interactiveContentService.js (checkAndAwardBadge)
--    insert of: student_id, badge_id, class_subject_id, earned_at
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_badges (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,         -- owner -> CASCADE
    badge_id         uuid,                                                       -- *_id -> uuid; FLAG: references badges table (out of group)
    class_subject_id uuid REFERENCES public.class_subjects(id) ON DELETE CASCADE, -- class_subject_id -> class_subjects(id)
    earned_at        timestamptz,                                                -- *_at -> timestamptz
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student_id       ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id         ON public.student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_class_subject_id ON public.student_badges(class_subject_id);

-- =====================================================================
-- 3. adaptive_learning_paths
--    Frontend: interactiveContentService.js (createLearningPath),
--              AdaptiveLearningPaths.jsx
--    insert merges: student_id, class_subject_id, is_active,
--      path_name, path_type, difficulty_level
--    reads: path_id, current_stage, total_stages, is_active
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.adaptive_learning_paths (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key the frontend reads (learningPath.path_id, stage query key)
    path_id          uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    student_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,          -- owner -> CASCADE
    class_subject_id uuid REFERENCES public.class_subjects(id) ON DELETE CASCADE, -- class_subject_id -> class_subjects(id)
    path_name        text,                                                        -- text
    path_type        text,                                                        -- text (e.g. PERFORMANCE_BASED)
    difficulty_level text,                                                        -- text (e.g. MEDIUM)
    is_active        boolean DEFAULT true,                                        -- is_* -> boolean
    current_stage    integer DEFAULT 0,                                           -- stage/number -> integer
    total_stages     integer DEFAULT 0,                                           -- stage/number -> integer
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_learning_paths_path_id          ON public.adaptive_learning_paths(path_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_learning_paths_student_id       ON public.adaptive_learning_paths(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_learning_paths_class_subject_id ON public.adaptive_learning_paths(class_subject_id);

-- =====================================================================
-- 4. student_accommodations
--    Frontend: studentInformationService.js (create/update),
--              SpecialNeedsTracking.jsx, tutorService.js
--    update sets updated_at; .eq('accommodation_id', ...)
--    reads/selects: accommodation_type, description, title, frequency,
--      is_active, student_id
--    FLAG: OVERLAPS existing student_special_needs.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_accommodations (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key the frontend filters on (.eq('accommodation_id', ...))
    accommodation_id   uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    student_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,  -- owner -> CASCADE
    accommodation_type text,                                                -- text
    title              text,                                                -- text
    description        text,                                                -- text
    frequency          text,                                                -- text
    is_active          boolean DEFAULT true,                                -- is_* -> boolean
    created_at         timestamptz DEFAULT now(),
    updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_accommodations_accommodation_id ON public.student_accommodations(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_student_accommodations_student_id       ON public.student_accommodations(student_id);

-- =====================================================================
-- 5. student_transfers
--    Frontend: studentInformationService.js (create/update),
--              TransferManagement.jsx
--    insert merges: transfer_type, transfer_date, academic_year, reason,
--      transfer_status, student_id, requested_by
--    update sets updated_at; .eq('transfer_id', ...)
--    NOTE: from_class_id / to_class_id named in spec FK list -> classes(id).
--          Display reads from_*/to_* names from an RPC join, not columns.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_transfers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key the frontend filters on (.eq('transfer_id', ...))
    transfer_id     uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    student_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,  -- owner -> CASCADE
    transfer_type   text,                                                -- text (OUTGOING/INCOMING)
    transfer_date   date,                                                -- date -> date
    academic_year   text,                                                -- text
    reason          text,                                                -- text
    transfer_status text DEFAULT 'PENDING',                              -- text (PENDING/APPROVED/...)
    requested_by    uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit -> SET NULL
    from_class_id   uuid REFERENCES public.classes(id) ON DELETE SET NULL, -- spec FK: classes(id) (FLAG: not seen in grep)
    to_class_id     uuid REFERENCES public.classes(id) ON DELETE SET NULL, -- spec FK: classes(id) (FLAG: not seen in grep)
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_transfers_transfer_id ON public.student_transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_student_transfers_student_id  ON public.student_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transfers_requested_by ON public.student_transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_student_transfers_from_class_id ON public.student_transfers(from_class_id);
CREATE INDEX IF NOT EXISTS idx_student_transfers_to_class_id   ON public.student_transfers(to_class_id);

-- =====================================================================
-- 6. class_instructors
--    Frontend: classService.js
--    select('class_id'); .eq('instructor_id'), .eq('class_id'),
--      .eq('is_active'); insert of: class_id, instructor_id, role, is_active
--    embed: instructor:users(...)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.class_instructors (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id      uuid REFERENCES public.classes(id) ON DELETE CASCADE, -- class_id -> classes(id)
    instructor_id uuid REFERENCES public.users(id) ON DELETE CASCADE,   -- user-ish -> users(id), CASCADE
    role          text DEFAULT 'instructor',                            -- text
    is_active     boolean DEFAULT true,                                 -- is_* -> boolean
    created_at    timestamptz DEFAULT now(),
    UNIQUE (class_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_class_instructors_class_id      ON public.class_instructors(class_id);
CREATE INDEX IF NOT EXISTS idx_class_instructors_instructor_id ON public.class_instructors(instructor_id);

-- =====================================================================
-- 7. quiz_options
--    Frontend: LessonContentManager.jsx
--    insert of: question_id, option_text, is_correct, option_order
--    FLAG: near-DUPLICATE of existing quiz_answer_options.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.quiz_options (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE, -- question_id -> quiz_questions(id)
    option_text  text,                                                        -- text
    is_correct   boolean DEFAULT false,                                       -- correct/is_* -> boolean
    option_order integer,                                                     -- order -> integer
    created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON public.quiz_options(question_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- ---- student_submissions (student owns; staff read) ----
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_submissions_admin_all" ON public.student_submissions;
CREATE POLICY "student_submissions_admin_all" ON public.student_submissions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "student_submissions_student_rw" ON public.student_submissions;
CREATE POLICY "student_submissions_student_rw" ON public.student_submissions
    FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "student_submissions_staff_read" ON public.student_submissions;
CREATE POLICY "student_submissions_staff_read" ON public.student_submissions
    FOR SELECT USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- student_badges (student owns; staff read) ----
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_badges_admin_all" ON public.student_badges;
CREATE POLICY "student_badges_admin_all" ON public.student_badges
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "student_badges_student_rw" ON public.student_badges;
CREATE POLICY "student_badges_student_rw" ON public.student_badges
    FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "student_badges_staff_read" ON public.student_badges;
CREATE POLICY "student_badges_staff_read" ON public.student_badges
    FOR SELECT USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- adaptive_learning_paths (student owns; staff read) ----
ALTER TABLE public.adaptive_learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adaptive_learning_paths_admin_all" ON public.adaptive_learning_paths;
CREATE POLICY "adaptive_learning_paths_admin_all" ON public.adaptive_learning_paths
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "adaptive_learning_paths_student_rw" ON public.adaptive_learning_paths;
CREATE POLICY "adaptive_learning_paths_student_rw" ON public.adaptive_learning_paths
    FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "adaptive_learning_paths_staff_read" ON public.adaptive_learning_paths;
CREATE POLICY "adaptive_learning_paths_staff_read" ON public.adaptive_learning_paths
    FOR SELECT USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- student_accommodations (staff-managed) ----
ALTER TABLE public.student_accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_accommodations_admin_all" ON public.student_accommodations;
CREATE POLICY "student_accommodations_admin_all" ON public.student_accommodations
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "student_accommodations_staff_rw" ON public.student_accommodations;
CREATE POLICY "student_accommodations_staff_rw" ON public.student_accommodations
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- student_transfers (staff-managed) ----
ALTER TABLE public.student_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_transfers_admin_all" ON public.student_transfers;
CREATE POLICY "student_transfers_admin_all" ON public.student_transfers
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "student_transfers_staff_rw" ON public.student_transfers;
CREATE POLICY "student_transfers_staff_rw" ON public.student_transfers
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- class_instructors (staff-managed) ----
ALTER TABLE public.class_instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_instructors_admin_all" ON public.class_instructors;
CREATE POLICY "class_instructors_admin_all" ON public.class_instructors
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "class_instructors_staff_rw" ON public.class_instructors;
CREATE POLICY "class_instructors_staff_rw" ON public.class_instructors
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- quiz_options (authenticated read; staff write) ----
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_options_admin_all" ON public.quiz_options;
CREATE POLICY "quiz_options_admin_all" ON public.quiz_options
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "quiz_options_auth_read" ON public.quiz_options;
CREATE POLICY "quiz_options_auth_read" ON public.quiz_options
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "quiz_options_staff_write" ON public.quiz_options;
CREATE POLICY "quiz_options_staff_write" ON public.quiz_options
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- =====================================================================
-- FLAGGED UNCERTAINTIES / DUPLICATIONS
-- =====================================================================
-- 1. DUPLICATION: quiz_options vs existing quiz_answer_options. The
--    frontend writes options (question_id, option_text, is_correct,
--    option_order) to BOTH names depending on code path. Created here to
--    match LessonContentManager.jsx usage; consolidate to one table.
-- 2. OVERLAP: student_accommodations vs existing student_special_needs.
--    student_special_needs already stores need_type/diagnosis/
--    accommodations; student_accommodations stores discrete typed rows
--    (accommodation_type/title/frequency). Both are read by tutorService.
--    Reconcile the data model.
-- 3. WORKING KEYS: submission_id, transfer_id, accommodation_id, path_id
--    are added (UNIQUE) alongside the spec-required `id` because the
--    frontend filters/reads those names. Decide on a single PK.
-- 4. student_submissions.assessment_id: frontend does parseInt(assessmentId)
--    and inserts an integer, but spec maps assessment_id ->
--    subject_assessments(id) as uuid. Typed uuid here; verify id type.
-- 5. student_submissions.file_path: a storage path STRING (not structured
--    content), so typed text rather than jsonb.
-- 6. student_badges.badge_id: references an out-of-group badges table
--    (not in the existing-tables list) -> plain uuid, no FK.
-- 7. student_transfers.from_class_id / to_class_id: present in the spec FK
--    list (classes(id)) but NOT observed in the frontend grep; the UI shows
--    from_*/to_* names via an RPC join. Included as nullable FKs.
-- =====================================================================
