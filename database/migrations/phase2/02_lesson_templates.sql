-- =====================================================================
-- Phase 2 Migration: Lesson Templates group
-- =====================================================================
-- Creates missing tables for the Lesson Templates feature, with schemas
-- DERIVED from frontend usage in:
--   frontend/src/services/lessonTemplateService.js
--   frontend/src/components/Teacher/LessonTemplateLibrary.jsx
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
-- DROP POLICY IF EXISTS before each CREATE POLICY. Parent-before-child.
--
-- IMPORTANT FLAGS (see bottom of file and report):
--  * Per task instructions every table gets `id uuid PRIMARY KEY
--    DEFAULT gen_random_uuid()`. The FRONTEND, however, reads working
--    keys named template_id / favorite_id (BIGSERIAL in the existing
--    legacy create-lesson-templates.sql). These working-key columns are
--    ALSO included so the app keeps functioning. Reconcile before use.
--  * Spec says users(id); frontend embeds select users(user_id, ...).
--    FKs target public.users(id) per instructions -- verify PK name.
-- =====================================================================

-- Helper functions is_admin() / get_user_role() already exist in the live DB.
-- This migration intentionally does NOT redefine them (avoid altering shared RLS helpers).

-- =====================================================================
-- 1. lesson_templates  (PARENT -- created first)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.lesson_templates (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key referenced throughout the frontend (template.template_id,
    -- .eq('template_id', ...), embedded joins). Kept unique for FK targets.
    template_id         uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    template_name       text,
    description         text,
    topic               text,
    lesson_title        text,
    learning_objectives text,
    lesson_plan         text,
    homework_description text,
    status              text DEFAULT 'ACTIVE',          -- .eq('status','ACTIVE')
    subject_id          uuid REFERENCES public.subjects(id),
    form_id             uuid,                            -- FLAG: forms(id) exists; embeds forms(form_id). plain uuid + FK below
    is_public           boolean DEFAULT true,            -- is_* -> boolean
    is_featured         boolean DEFAULT false,           -- is_* -> boolean
    estimated_duration  integer,                         -- duration -> integer
    use_count           integer DEFAULT 0,               -- count -> integer
    view_count          integer DEFAULT 0,               -- count -> integer
    content_count       integer DEFAULT 0,               -- count -> integer
    rating_count        integer DEFAULT 0,               -- count -> integer
    rating_average      numeric DEFAULT 0,               -- rating + decimal (.toFixed/.gte) -> numeric
    tags                jsonb DEFAULT '[]'::jsonb,        -- tags -> jsonb (.contains, array)
    created_by          uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit creator -> SET NULL
    published_at        timestamptz,                     -- *_at -> timestamptz
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- form_id references forms(id) (existing table). Added as explicit FK.
ALTER TABLE public.lesson_templates
    DROP CONSTRAINT IF EXISTS lesson_templates_form_id_fkey;
ALTER TABLE public.lesson_templates
    ADD CONSTRAINT lesson_templates_form_id_fkey
    FOREIGN KEY (form_id) REFERENCES public.forms(id);

CREATE INDEX IF NOT EXISTS idx_lesson_templates_template_id  ON public.lesson_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_subject_id   ON public.lesson_templates(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_form_id      ON public.lesson_templates(form_id);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_created_by   ON public.lesson_templates(created_by);

-- =====================================================================
-- 2. lesson_template_content  (CHILD of lesson_templates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.lesson_template_content (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id          uuid NOT NULL REFERENCES public.lesson_templates(template_id) ON DELETE CASCADE,
    content_type         text,
    title                text,
    description          text,
    url                  text,
    original_content_id  uuid,                           -- *_id -> uuid; FLAG: references lesson_content (out of group)
    library_content_id   uuid,                           -- *_id -> uuid; FLAG: references content_library (out of group)
    instructions         text,
    learning_outcomes    text,
    learning_activities  text,
    key_concepts         text,
    reflection_questions text,
    discussion_prompts   text,
    summary              text,
    content_section      text,
    is_required          boolean DEFAULT false,          -- is_* -> boolean
    estimated_minutes    integer,                        -- number -> integer
    sequence_order       integer DEFAULT 0,              -- order -> integer
    content_data         jsonb,                          -- *_data -> jsonb
    metadata             jsonb,                          -- metadata -> jsonb
    created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_template_content_template_id ON public.lesson_template_content(template_id);

-- =====================================================================
-- 3. lesson_template_favorites  (per-user; CHILD of lesson_templates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.lesson_template_favorites (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Working key selected by the frontend (.select('favorite_id'))
    favorite_id  uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    template_id  uuid NOT NULL REFERENCES public.lesson_templates(template_id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at   timestamptz DEFAULT now(),
    UNIQUE (template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_template_favorites_template_id ON public.lesson_template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_lesson_template_favorites_user_id     ON public.lesson_template_favorites(user_id);

-- =====================================================================
-- 4. lesson_template_ratings  (per-user; CHILD of lesson_templates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.lesson_template_ratings (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id  uuid NOT NULL REFERENCES public.lesson_templates(template_id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating       integer,                                -- rating (integer 1-5 in upsert)
    review       text,
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz DEFAULT now(),              -- updated_at used in upsert
    UNIQUE (template_id, user_id)                        -- onConflict: 'template_id,user_id'
);

CREATE INDEX IF NOT EXISTS idx_lesson_template_ratings_template_id ON public.lesson_template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_lesson_template_ratings_user_id     ON public.lesson_template_ratings(user_id);

-- =====================================================================
-- 5. lesson_template_usage  (per-user; CHILD of lesson_templates)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.lesson_template_usage (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id  uuid NOT NULL REFERENCES public.lesson_templates(template_id) ON DELETE CASCADE,
    lesson_id    uuid,                                   -- *_id -> uuid; FLAG: references lessons(id) (existing, but PK name unverified)
    used_by      uuid REFERENCES public.users(id) ON DELETE CASCADE, -- user-ish -> users
    created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_template_usage_template_id ON public.lesson_template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_lesson_template_usage_lesson_id   ON public.lesson_template_usage(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_template_usage_used_by     ON public.lesson_template_usage(used_by);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- ---- lesson_templates: shared teacher content -----------------------
ALTER TABLE public.lesson_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_templates_admin_all" ON public.lesson_templates;
CREATE POLICY "lesson_templates_admin_all" ON public.lesson_templates
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "lesson_templates_auth_read" ON public.lesson_templates;
CREATE POLICY "lesson_templates_auth_read" ON public.lesson_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lesson_templates_owner_write" ON public.lesson_templates;
CREATE POLICY "lesson_templates_owner_write" ON public.lesson_templates
    FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ---- lesson_template_content: shared teacher content ----------------
ALTER TABLE public.lesson_template_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_template_content_admin_all" ON public.lesson_template_content;
CREATE POLICY "lesson_template_content_admin_all" ON public.lesson_template_content
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "lesson_template_content_auth_read" ON public.lesson_template_content;
CREATE POLICY "lesson_template_content_auth_read" ON public.lesson_template_content
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Owner write tied to the parent template's creator (no creator col on content).
DROP POLICY IF EXISTS "lesson_template_content_owner_write" ON public.lesson_template_content;
CREATE POLICY "lesson_template_content_owner_write" ON public.lesson_template_content
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lesson_templates t
            WHERE t.template_id = lesson_template_content.template_id
              AND t.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lesson_templates t
            WHERE t.template_id = lesson_template_content.template_id
              AND t.created_by = auth.uid()
        )
    );

-- ---- lesson_template_favorites: per-user ----------------------------
ALTER TABLE public.lesson_template_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_template_favorites_admin_all" ON public.lesson_template_favorites;
CREATE POLICY "lesson_template_favorites_admin_all" ON public.lesson_template_favorites
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "lesson_template_favorites_owner_all" ON public.lesson_template_favorites;
CREATE POLICY "lesson_template_favorites_owner_all" ON public.lesson_template_favorites
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---- lesson_template_ratings: per-user (+ auth_read) ----------------
ALTER TABLE public.lesson_template_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_template_ratings_admin_all" ON public.lesson_template_ratings;
CREATE POLICY "lesson_template_ratings_admin_all" ON public.lesson_template_ratings
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "lesson_template_ratings_auth_read" ON public.lesson_template_ratings;
CREATE POLICY "lesson_template_ratings_auth_read" ON public.lesson_template_ratings
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lesson_template_ratings_owner_all" ON public.lesson_template_ratings;
CREATE POLICY "lesson_template_ratings_owner_all" ON public.lesson_template_ratings
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---- lesson_template_usage: per-user --------------------------------
ALTER TABLE public.lesson_template_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_template_usage_admin_all" ON public.lesson_template_usage;
CREATE POLICY "lesson_template_usage_admin_all" ON public.lesson_template_usage
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "lesson_template_usage_owner_all" ON public.lesson_template_usage;
CREATE POLICY "lesson_template_usage_owner_all" ON public.lesson_template_usage
    FOR ALL USING (used_by = auth.uid()) WITH CHECK (used_by = auth.uid());

-- =====================================================================
-- FLAGGED UNCERTAINTIES
-- ---------------------------------------------------------------------
-- 1. PK convention conflict: legacy create-lesson-templates.sql uses
--    BIGSERIAL template_id/favorite_id/etc. This migration follows the
--    task spec (uuid `id`) AND keeps uuid template_id/favorite_id working
--    keys. If the legacy bigserial tables already exist, IF NOT EXISTS
--    skips creation and the frontend keeps its integer keys -- reconcile.
-- 2. users PK: spec says users(id); frontend embeds users(user_id,...)
--    and reads user?.user_id. FKs here target users(id). Verify the real
--    PK column name before applying.
-- 3. form_id -> forms(id): forms is an existing table; FK added.
-- 4. lesson_id (usage) -> lessons(id) exists, but the frontend uses
--    lesson_id integer-style keys (lesson.lesson_id). Left as plain uuid
--    (no FK) to avoid type/PK mismatch. Add FK once PK type confirmed.
-- 5. original_content_id / library_content_id reference lesson_content /
--    content_library (outside this group). Left as plain uuid + comment.
-- 6. rating_average uses numeric (decimal, .toFixed/.gte); rating uses
--    integer. Adjust precision if needed.
-- =====================================================================
