-- ============================================================================
-- Phase 2 Migration: Content Library group
-- File: 01_content_library.sql
-- ============================================================================
-- Derived strictly from frontend usage:
--   frontend/src/services/contentLibraryService.js
--   frontend/src/services/teacherCollaborationService.js
--   frontend/src/components/Teacher/ContentLibrary.jsx
--   frontend/src/components/Teacher/LessonContentManager.jsx
--
-- Tables created (parent-before-child order):
--   content_library (parent)
--   content_library_favorites
--   content_library_ratings
--   content_library_usage
--   content_comments
--   content_requests
--   content_suggestions
--   content_collaboration
--
-- NOTE ON PRIMARY KEYS: the frontend selects/filters/joins on table-specific
-- PK names (library_id, favorite_id, comment_id, request_id, suggestion_id,
-- collaboration_id, usage_id) rather than a generic `id`. To keep the schema
-- consistent with how the frontend reads/writes these rows, the table-specific
-- column is the PRIMARY KEY (uuid DEFAULT gen_random_uuid()). See FLAGGED
-- section at the bottom of this file.
--
-- Existing tables referenced (never recreated): users(id), subjects(id),
-- forms(id), lessons(id), lesson_content(id). FKs to public.users(id) per spec.
-- This migration runs top-to-bottom in one shot. Idempotent (IF NOT EXISTS).
-- ============================================================================


-- ============================================================================
-- 1. content_library  (PARENT — defined first; shared, readable content)
-- ============================================================================
-- Columns derived from:
--   .eq('status','ACTIVE'), .eq('content_type',..), .eq('subject_id',..),
--   .eq('form_id',..), .or(title.ilike / description.ilike),
--   .contains('tags',..), .eq('is_public',..), .eq('is_featured',true),
--   .gte('rating_average',..), .order('use_count'|'rating_average'|'created_at'),
--   .select('content_type,use_count,rating_average'), shared_by (FK to users),
--   published_at, library_id (PK), rating_count (UI), view_count (rpc),
--   and the full lesson_content-mirrored field set copied in
--   addLibraryContentToLesson(...) (url, file_*, mime_type, instructions,
--   learning_outcomes, learning_activities, key_concepts, reflection_questions,
--   discussion_prompts, summary, content_section, is_required,
--   estimated_minutes, content_data, metadata, assignment_* file fields).
CREATE TABLE IF NOT EXISTS public.content_library (
  library_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- core descriptive
  title             text,
  description       text,
  content_type      text,
  status            text DEFAULT 'ACTIVE',
  tags              jsonb,                        -- .contains('tags', [...])

  -- classification / FKs to existing tables
  subject_id        uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  form_id           uuid REFERENCES public.forms(id) ON DELETE SET NULL,

  -- visibility / curation flags
  is_public         boolean DEFAULT false,
  is_featured       boolean DEFAULT false,
  is_required       boolean DEFAULT false,

  -- ratings / popularity counters
  rating_average    numeric DEFAULT 0,
  rating_count      integer DEFAULT 0,
  use_count         integer DEFAULT 0,
  view_count        integer DEFAULT 0,

  -- media / file fields (mirrors lesson_content)
  url               text,
  file_path         text,
  file_name         text,
  file_size         integer,
  mime_type         text,

  -- pedagogical content fields (mirrors lesson_content)
  instructions          text,
  learning_outcomes     jsonb,
  learning_activities   jsonb,
  key_concepts          jsonb,
  reflection_questions  jsonb,
  discussion_prompts    jsonb,
  summary               text,
  content_section       text,
  estimated_minutes     integer,
  content_data          jsonb,
  metadata              jsonb,

  -- assignment attachment fields (mirrors lesson_content)
  assignment_details_file_path  text,
  assignment_details_file_name  text,
  assignment_details_file_size  integer,
  assignment_details_mime_type  text,
  assignment_rubric_file_path   text,
  assignment_rubric_file_name   text,
  assignment_rubric_file_size   integer,
  assignment_rubric_mime_type   text,

  -- ownership / audit
  shared_by         uuid REFERENCES public.users(id) ON DELETE SET NULL, -- shared_by_user join
  published_at      timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_library_subject_id ON public.content_library(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_library_form_id    ON public.content_library(form_id);
CREATE INDEX IF NOT EXISTS idx_content_library_shared_by  ON public.content_library(shared_by);

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_library_admin_all" ON public.content_library;
CREATE POLICY "content_library_admin_all" ON public.content_library
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_library_auth_read" ON public.content_library;
CREATE POLICY "content_library_auth_read" ON public.content_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_library_owner_write" ON public.content_library;
CREATE POLICY "content_library_owner_write" ON public.content_library
  FOR ALL USING (shared_by = auth.uid()) WITH CHECK (shared_by = auth.uid());


-- ============================================================================
-- 2. content_library_favorites  (per-user rows)
-- ============================================================================
-- Derived from: .insert({library_id,user_id}), .delete().eq('library_id').eq('user_id'),
--   .select('favorite_id'), .select('*, library_content:content_library(*)'),
--   .eq('user_id',..), .order('created_at').
CREATE TABLE IF NOT EXISTS public.content_library_favorites (
  favorite_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id    uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (library_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_library_favorites_library_id ON public.content_library_favorites(library_id);
CREATE INDEX IF NOT EXISTS idx_content_library_favorites_user_id    ON public.content_library_favorites(user_id);

ALTER TABLE public.content_library_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_library_favorites_admin_all" ON public.content_library_favorites;
CREATE POLICY "content_library_favorites_admin_all" ON public.content_library_favorites
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_library_favorites_owner_all" ON public.content_library_favorites;
CREATE POLICY "content_library_favorites_owner_all" ON public.content_library_favorites
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- 3. content_library_ratings  (per-user rows, readable by others)
-- ============================================================================
-- Derived from: .upsert({library_id,user_id,rating,review,updated_at},
--   onConflict 'library_id,user_id'), .select('*, user:users(...)'),
--   .eq('library_id',..), .order('created_at').
CREATE TABLE IF NOT EXISTS public.content_library_ratings (
  rating_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id    uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rating        integer,
  review        text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (library_id, user_id)        -- onConflict: 'library_id,user_id'
);

CREATE INDEX IF NOT EXISTS idx_content_library_ratings_library_id ON public.content_library_ratings(library_id);
CREATE INDEX IF NOT EXISTS idx_content_library_ratings_user_id    ON public.content_library_ratings(user_id);

ALTER TABLE public.content_library_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_library_ratings_admin_all" ON public.content_library_ratings;
CREATE POLICY "content_library_ratings_admin_all" ON public.content_library_ratings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_library_ratings_auth_read" ON public.content_library_ratings;
CREATE POLICY "content_library_ratings_auth_read" ON public.content_library_ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_library_ratings_owner_write" ON public.content_library_ratings;
CREATE POLICY "content_library_ratings_owner_write" ON public.content_library_ratings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- 4. content_library_usage  (per-user usage records)
-- ============================================================================
-- Derived from: .insert({library_id, lesson_id, content_id, used_by}).
-- content_id here references lesson_content(content_id) (NOT content_library),
-- per addLibraryContentToLesson: content_id: lessonContent.content_id.
CREATE TABLE IF NOT EXISTS public.content_library_usage (
  usage_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id    uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  lesson_id     uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  content_id    uuid REFERENCES public.lesson_content(id) ON DELETE CASCADE, -- lessonContent.content_id
  used_by       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_library_usage_library_id ON public.content_library_usage(library_id);
CREATE INDEX IF NOT EXISTS idx_content_library_usage_lesson_id  ON public.content_library_usage(lesson_id);
CREATE INDEX IF NOT EXISTS idx_content_library_usage_content_id ON public.content_library_usage(content_id);
CREATE INDEX IF NOT EXISTS idx_content_library_usage_used_by    ON public.content_library_usage(used_by);

ALTER TABLE public.content_library_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_library_usage_admin_all" ON public.content_library_usage;
CREATE POLICY "content_library_usage_admin_all" ON public.content_library_usage
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_library_usage_owner_all" ON public.content_library_usage;
CREATE POLICY "content_library_usage_owner_all" ON public.content_library_usage
  FOR ALL USING (used_by = auth.uid()) WITH CHECK (used_by = auth.uid());


-- ============================================================================
-- 5. content_comments  (per-user rows, readable by others; self-referential)
-- ============================================================================
-- Derived from: .insert({library_id?, template_id?, user_id, comment_text,
--   created_at, updated_at}), .update({...,updated_at}).eq('comment_id'),
--   .delete().eq('comment_id'), .eq('library_id'|'template_id'),
--   parent_comment self-join (content_comments_parent_comment_id_fkey:
--   comment_id, comment_text), .order('created_at').
CREATE TABLE IF NOT EXISTS public.content_comments (
  comment_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id          uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  template_id         uuid,                       -- cross-group: lesson-plan template (no table in scope)
  parent_comment_id   uuid REFERENCES public.content_comments(comment_id) ON DELETE CASCADE,
  user_id             uuid REFERENCES public.users(id) ON DELETE CASCADE,
  comment_text        text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_library_id        ON public.content_comments(library_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_template_id       ON public.content_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent_comment_id ON public.content_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id           ON public.content_comments(user_id);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_comments_admin_all" ON public.content_comments;
CREATE POLICY "content_comments_admin_all" ON public.content_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_comments_auth_read" ON public.content_comments;
CREATE POLICY "content_comments_auth_read" ON public.content_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_comments_owner_write" ON public.content_comments;
CREATE POLICY "content_comments_owner_write" ON public.content_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- 6. content_requests  (per-user rows, readable by others)
-- ============================================================================
-- Derived from: .insert({requested_by, request_title, request_description,
--   subject_id, form_id, status, created_at, updated_at}),
--   .update({status:'FULFILLED', fulfilled_by, fulfilled_content_id,
--   fulfilled_at, updated_at}).eq('request_id'),
--   .eq('status'|'requested_by'|'subject_id'), .order('created_at'),
--   joins: requested_by_user (requested_by), fulfilled_by_user (fulfilled_by),
--   subject, form.
CREATE TABLE IF NOT EXISTS public.content_requests (
  request_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_title         text,
  request_description   text,
  status                text DEFAULT 'OPEN',
  subject_id            uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  form_id               uuid REFERENCES public.forms(id) ON DELETE SET NULL,
  requested_by          uuid REFERENCES public.users(id) ON DELETE CASCADE,
  fulfilled_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_content_id  uuid REFERENCES public.content_library(library_id) ON DELETE SET NULL,
  fulfilled_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_requests_subject_id           ON public.content_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_form_id              ON public.content_requests(form_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_requested_by         ON public.content_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_content_requests_fulfilled_by         ON public.content_requests(fulfilled_by);
CREATE INDEX IF NOT EXISTS idx_content_requests_fulfilled_content_id ON public.content_requests(fulfilled_content_id);

ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_requests_admin_all" ON public.content_requests;
CREATE POLICY "content_requests_admin_all" ON public.content_requests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_requests_auth_read" ON public.content_requests;
CREATE POLICY "content_requests_auth_read" ON public.content_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_requests_owner_write" ON public.content_requests;
CREATE POLICY "content_requests_owner_write" ON public.content_requests
  FOR ALL USING (requested_by = auth.uid()) WITH CHECK (requested_by = auth.uid());


-- ============================================================================
-- 7. content_suggestions  (per-user rows, readable by others)
-- ============================================================================
-- Derived from: .insert({library_id?, template_id?, suggested_by,
--   suggestion_type, suggestion_text, status, created_at}),
--   .update({status, reviewed_by, reviewed_at}).eq('suggestion_id'),
--   .eq('library_id'|'template_id'), .order('created_at'),
--   joins: suggested_by_user (suggested_by), reviewed_by_user (reviewed_by).
CREATE TABLE IF NOT EXISTS public.content_suggestions (
  suggestion_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id        uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  template_id       uuid,                         -- cross-group: lesson-plan template (no table in scope)
  suggestion_type   text,
  suggestion_text   text,
  status            text DEFAULT 'PENDING',
  suggested_by      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_suggestions_library_id   ON public.content_suggestions(library_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_template_id  ON public.content_suggestions(template_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_suggested_by ON public.content_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_reviewed_by  ON public.content_suggestions(reviewed_by);

ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_suggestions_admin_all" ON public.content_suggestions;
CREATE POLICY "content_suggestions_admin_all" ON public.content_suggestions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "content_suggestions_auth_read" ON public.content_suggestions;
CREATE POLICY "content_suggestions_auth_read" ON public.content_suggestions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_suggestions_owner_write" ON public.content_suggestions;
CREATE POLICY "content_suggestions_owner_write" ON public.content_suggestions
  FOR ALL USING (suggested_by = auth.uid()) WITH CHECK (suggested_by = auth.uid());


-- ============================================================================
-- 8. content_collaboration  (per-user rows)
-- ============================================================================
-- Derived from: .insert({library_id?, template_id?, collaborator_id,
--   invited_by, invited_at}), .update({is_active:false}).eq('collaboration_id'),
--   .eq('is_active',true), .eq('library_id'|'template_id'),
--   joins: collaborator (collaborator_id), invited_by_user (invited_by).
CREATE TABLE IF NOT EXISTS public.content_collaboration (
  collaboration_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id        uuid REFERENCES public.content_library(library_id) ON DELETE CASCADE,
  template_id       uuid,                         -- cross-group: lesson-plan template (no table in scope)
  collaborator_id   uuid REFERENCES public.users(id) ON DELETE CASCADE,
  invited_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active         boolean DEFAULT true,
  invited_at        timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_collaboration_library_id      ON public.content_collaboration(library_id);
CREATE INDEX IF NOT EXISTS idx_content_collaboration_template_id     ON public.content_collaboration(template_id);
CREATE INDEX IF NOT EXISTS idx_content_collaboration_collaborator_id ON public.content_collaboration(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_content_collaboration_invited_by      ON public.content_collaboration(invited_by);

ALTER TABLE public.content_collaboration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_collaboration_admin_all" ON public.content_collaboration;
CREATE POLICY "content_collaboration_admin_all" ON public.content_collaboration
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Collaboration rows are owned by either the invitee or the inviter; both may
-- read/manage their own rows.
DROP POLICY IF EXISTS "content_collaboration_owner_all" ON public.content_collaboration;
CREATE POLICY "content_collaboration_owner_all" ON public.content_collaboration
  FOR ALL
  USING (collaborator_id = auth.uid() OR invited_by = auth.uid())
  WITH CHECK (collaborator_id = auth.uid() OR invited_by = auth.uid());


-- ============================================================================
-- FLAGGED — uncertain columns / types / cross-group references
-- ============================================================================
-- 1. PRIMARY KEYS: Spec said to always add `id uuid PRIMARY KEY`, but the
--    frontend exclusively reads/writes table-specific PKs (library_id,
--    favorite_id, rating_id*, usage_id*, comment_id, request_id,
--    suggestion_id, collaboration_id). A single table cannot have two PKs, so
--    the frontend-referenced column was made the PK. (*rating_id and usage_id
--    are not directly referenced by name but added as the conventional PK; the
--    frontend never selects them.)
--
-- 2. template_id (content_comments, content_suggestions, content_collaboration):
--    CROSS-GROUP. Used as an alternative target to library_id (lesson-plan
--    templates — likely saved_lesson_plans, but the frontend never names the
--    table). Left as plain uuid, NO FK, nullable.
--
-- 3. content_library_usage.content_id: references lesson_content (set to
--    lessonContent.content_id), NOT content_library. FK points to
--    public.lesson_content(id) per the existing-tables list.
--
-- 4. fulfilled_content_id (content_requests): inferred to reference
--    content_library (a fulfilled request points at a library item). FK added
--    to content_library(library_id); could alternatively reference
--    lesson_content — VERIFY intended target.
--
-- 5. rating (content_library_ratings): typed integer (1-5 star UI). No CHECK
--    constraint added since bounds are not enforced in the frontend.
--
-- 6. rating_average typed numeric (decimal, .toFixed(1)); use_count/view_count/
--    rating_count/file_size/estimated_minutes typed integer per naming rules.
--
-- 7. tags / *_data / metadata / learning_* / key_concepts /
--    reflection_questions / discussion_prompts typed jsonb. tags is queried
--    with .contains(...) which requires a jsonb (or array) column.
--
-- 8. content_library media/pedagogical/assignment_* columns are NOT inserted
--    directly via the library UI; they are derived because
--    addLibraryContentToLesson() READS them off a content_library row
--    (libraryContent.<col>) when copying into lesson_content. They mirror the
--    lesson_content schema. Included for completeness; VERIFY against the real
--    content_library content model if it diverges from lesson_content.
--
-- 9. FK targets use public.users(id) / subjects(id) / forms(id) per the
--    provided existing-tables list, even though frontend joins select
--    user_id/subject_id/form_id as columns on those tables.
-- ============================================================================
