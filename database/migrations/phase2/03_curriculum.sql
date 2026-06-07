-- ============================================================================
-- Phase 2 Migration: Curriculum Builder Group
-- File: 03_curriculum.sql
-- ----------------------------------------------------------------------------
-- Creates the missing tables backing the Interactive Curriculum Builder feature.
-- Schemas are DERIVED from how the frontend uses each table (column names from
-- .select/.insert/.update/.eq/.in/.gte/.order/.upsert calls and embedded joins).
--
-- Source files inspected:
--   components/Admin/CurriculumTemplateManager.jsx     -> curriculum_templates
--   components/Admin/ResourceLibrary.jsx               -> curriculum_resources
--   components/Admin/InteractiveCurriculumBuilder.jsx  -> curriculum_resource_links,
--                                                         curriculum_change_history,
--                                                         curriculum_editing_sessions,
--                                                         curriculum_session_editors
--   components/Admin/AISuggestionPanel.jsx             -> curriculum_ai_suggestions
--   components/Admin/GapAnalysis.jsx                   -> curriculum_gaps
--   services/curriculumAnalyticsService.js             -> curriculum_analytics_snapshots
--
-- Conventions (per task spec, OVERRIDES legacy BIGINT reference migrations):
--   * Every table: id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now()
--   * id / *_id            -> uuid
--   * *_at                 -> timestamptz
--   * *_date               -> date
--   * is_* / used / *_count, *_number, *_score, *_total, *_percentage, *_hours -> boolean/integer/numeric
--   * *_data / metadata / snapshot / *_structure / suggestions / tags -> jsonb
--   * everything else      -> text
--
-- Existing tables (NEVER recreated): users(id), subjects(id), curriculum_subjects(id),
--   curriculum_frameworks(id), forms(id), etc.
--
-- ===== FLAGGED UNCERTAINTIES (see also inline FLAG comments) ================
--   1. subject_id  -> AMBIGUOUS. Frontend reads `offering.subject_id` where
--      `offering` is a row of `subject_form_offerings` (a teaching offering), and
--      filters resources/templates by that value. That points at the operational
--      `subjects(id)` table, NOT `curriculum_subjects(id)`. The legacy reference
--      migration (add-curriculum-builder-tables.sql) also FK'd subject_id ->
--      subjects(subject_id). However the task default for ambiguity is
--      curriculum_subjects(id). RESOLUTION: referenced subjects(id) because the
--      usage is operational-offering-driven. FLAGGED for confirmation.
--   2. offering_id -> references `subject_form_offerings`, which is NOT in the
--      existing/group table list. Created as a plain uuid (no FK) + comment.
--   3. form_id     -> references `forms`, which IS listed as existing. FK added.
--   4. class_subject_id (curriculum_analytics_snapshots) -> references a
--      `class_subjects` table that is NOT in the existing/group list. Plain uuid
--      + comment. FLAGGED.
--   5. PK/type model: legacy migrations use BIGINT identity PKs; this migration
--      uses uuid per the task spec. Mixing will conflict if the legacy tables
--      already exist. CREATE TABLE IF NOT EXISTS will SKIP creation if a legacy
--      table is present, so verify the live schema before relying on these types.
-- ============================================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- PARENTS FIRST
-- ============================================================================

-- ----------------------------------------------------------------------------
-- curriculum_templates
--   Insert: template_name, description, subject_id, form_id, curriculum_structure,
--           is_public, created_by, tags
--   Select: *, ordered by usage_count; filtered .or(is_public.eq.true, created_by.eq.X)
--   Delete: .eq('template_id', ...) .eq('created_by', ...)
--   RPC increment_template_usage(template_id) bumps usage_count
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_templates (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id          uuid DEFAULT gen_random_uuid(),         -- frontend keys/filters on template_id
    template_name        text,
    description          text,
    subject_id           uuid REFERENCES public.subjects(id),    -- FLAG: see uncertainty #1 (subjects vs curriculum_subjects)
    form_id              uuid REFERENCES public.forms(id),       -- FLAG: see uncertainty #3
    curriculum_structure jsonb,                                  -- *_structure -> jsonb
    is_public            boolean DEFAULT false,
    usage_count          integer DEFAULT 0,                      -- *_count -> integer; ordered desc
    tags                 jsonb DEFAULT '[]'::jsonb,              -- array of tag strings
    created_by           uuid REFERENCES public.users(id) ON DELETE CASCADE, -- ownership
    created_at           timestamptz DEFAULT now(),
    updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_templates_subject_id ON public.curriculum_templates(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_form_id    ON public.curriculum_templates(form_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_created_by ON public.curriculum_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_template_id ON public.curriculum_templates(template_id);

-- ----------------------------------------------------------------------------
-- curriculum_resources
--   Insert: ...resourceData (title, description, resource_type, url, tags),
--           created_by, subject_id
--   Select: *, ordered by usage_count; .or(subject_id.eq.X, is_public.eq.true)
--   Read fields: resource_id, title, description, resource_type, url, tags,
--                rating, usage_count, is_public
--   RPC increment_resource_usage(resource_id) bumps usage_count
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_resources (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id   uuid DEFAULT gen_random_uuid(),            -- frontend keys/links on resource_id
    title         text,
    description   text,
    resource_type text,                                      -- VIDEO|LINK|GAME|WORKSHEET|DOCUMENT|ACTIVITY|ASSESSMENT
    url           text,
    tags          jsonb DEFAULT '[]'::jsonb,
    rating        numeric DEFAULT 0,                         -- resource.rating.toFixed(1)
    usage_count   integer DEFAULT 0,                         -- ordered desc
    is_public     boolean DEFAULT false,
    subject_id    uuid REFERENCES public.subjects(id),       -- FLAG: see uncertainty #1
    created_by    uuid REFERENCES public.users(id) ON DELETE CASCADE, -- ownership
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_resources_subject_id  ON public.curriculum_resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_created_by  ON public.curriculum_resources(created_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_resource_id ON public.curriculum_resources(resource_id);

-- ----------------------------------------------------------------------------
-- curriculum_editing_sessions
--   Select: *, .eq('offering_id', ...) .eq('is_active', true) (reads session_id)
--   Insert: offering_id, created_by (returns session_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_editing_sessions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  uuid DEFAULT gen_random_uuid(),             -- frontend uses session_id as the session key
    offering_id uuid,                                       -- FLAG: references subject_form_offerings (not in group/existing list) -> plain uuid, no FK (uncertainty #2)
    is_active   boolean DEFAULT true,
    created_by  uuid REFERENCES public.users(id) ON DELETE CASCADE, -- ownership
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_editing_sessions_offering_id ON public.curriculum_editing_sessions(offering_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_editing_sessions_created_by  ON public.curriculum_editing_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_editing_sessions_session_id  ON public.curriculum_editing_sessions(session_id);

-- ============================================================================
-- CHILDREN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- curriculum_resource_links
--   Insert: offering_id, resource_id, link_path, created_by
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_resource_links (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id uuid,                                       -- FLAG: subject_form_offerings (uncertainty #2) -> plain uuid, no FK
    resource_id uuid REFERENCES public.curriculum_resources(id) ON DELETE CASCADE,
    link_path   text,
    created_by  uuid REFERENCES public.users(id) ON DELETE CASCADE, -- ownership
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_resource_links_offering_id ON public.curriculum_resource_links(offering_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_resource_links_resource_id ON public.curriculum_resource_links(resource_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_resource_links_created_by  ON public.curriculum_resource_links(created_by);

-- ----------------------------------------------------------------------------
-- curriculum_session_editors
--   Upsert: session_id, user_id, last_seen  (onConflict session_id,user_id)
--   Update: last_seen .eq(session_id).eq(user_id)
--   Select: user_id, last_seen, users!..._user_id_fkey(...)  .eq(session_id)
--           .gte('last_seen', ...)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_session_editors (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.curriculum_editing_sessions(id) ON DELETE CASCADE,
    user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE, -- ownership/presence
    last_seen  timestamptz,                                 -- *_seen acts as a timestamp; .gte() compared to ISO time
    created_at timestamptz DEFAULT now(),
    CONSTRAINT curriculum_session_editors_session_user_key UNIQUE (session_id, user_id) -- supports onConflict 'session_id,user_id'
);

CREATE INDEX IF NOT EXISTS idx_curriculum_session_editors_session_id ON public.curriculum_session_editors(session_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_session_editors_user_id    ON public.curriculum_session_editors(user_id);

-- ----------------------------------------------------------------------------
-- curriculum_change_history
--   Insert: offering_id, changed_by, change_type, change_path, old_value,
--           new_value, change_description
--   Select: *, users!..._changed_by_fkey(...) .eq(offering_id) .order(created_at desc)
--   Read fields: change_id, created_at, change_type, change_path, change_description
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_change_history (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    change_id          uuid DEFAULT gen_random_uuid(),       -- frontend keys list on change_id
    offering_id        uuid,                                 -- FLAG: subject_form_offerings (uncertainty #2) -> plain uuid, no FK
    change_type        text,                                 -- CREATE|UPDATE|DELETE|REORDER|AI_GENERATE|AI_ADD|AI_UPDATE
    change_path        text,
    old_value          jsonb,                                -- arbitrary structured snapshot of prior value
    new_value          jsonb,                                -- arbitrary structured snapshot of new value
    change_description  text,
    changed_by         uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit -> SET NULL
    created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_change_history_offering_id ON public.curriculum_change_history(offering_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_change_history_changed_by  ON public.curriculum_change_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_change_history_change_id   ON public.curriculum_change_history(change_id);

-- ----------------------------------------------------------------------------
-- curriculum_ai_suggestions
--   Insert: offering_id, context_type, context_path, learning_outcome,
--           suggestion_type, suggestion_data, confidence_score
--   Select: *, .eq(offering_id).eq(context_type).eq(context_path).eq('used', false)
--           .order('confidence_score' desc)
--   Update: used = true, used_at  .eq('suggestion_id', ...)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_ai_suggestions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id     uuid DEFAULT gen_random_uuid(),        -- frontend keys/filters on suggestion_id
    offering_id       uuid,                                  -- FLAG: subject_form_offerings (uncertainty #2) -> plain uuid, no FK
    context_type      text,                                  -- TOPIC|UNIT|SCO
    context_path      text,                                  -- e.g. topics[0].instructionalUnits[1]
    learning_outcome  text,
    suggestion_type   text,                                  -- UNIT_GENERATION|ACTIVITY|RESOURCE|DIFFERENTIATION|ASSESSMENT
    suggestion_data   jsonb,                                 -- *_data -> jsonb
    confidence_score  numeric DEFAULT 0,                     -- *_score -> numeric; ordered desc
    used              boolean DEFAULT false,
    used_at           timestamptz,
    created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_ai_suggestions_offering_id   ON public.curriculum_ai_suggestions(offering_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_ai_suggestions_suggestion_id ON public.curriculum_ai_suggestions(suggestion_id);

-- ----------------------------------------------------------------------------
-- curriculum_gaps
--   Update: resolved = true, resolved_at, resolved_by  .eq('gap_id', ...)
--   Read fields (from get_gap_analysis RPC rows / table): gap_id, severity,
--     gap_type, topic_number, unit_number, sco_number, description,
--     recommended_action, identified_at, resolved
--   class_subject_id ties a gap to a class subject (uncertainty #4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_gaps (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id              uuid DEFAULT gen_random_uuid(),       -- frontend keys/filters on gap_id
    class_subject_id    uuid,                                 -- FLAG: references class_subjects (not in group/existing list) -> plain uuid, no FK (uncertainty #4)
    severity            text,                                 -- CRITICAL|HIGH|MEDIUM|LOW
    gap_type            text,                                 -- NOT_COVERED|PARTIALLY_COVERED|NO_ASSESSMENT|LOW_ACHIEVEMENT
    topic_number        integer,                              -- *_number -> integer
    unit_number         integer,
    sco_number          text,                                 -- displayed as a label (e.g. "1.2"), not numeric
    description         text,
    recommended_action  text,
    resolved            boolean DEFAULT false,
    identified_at       timestamptz DEFAULT now(),
    resolved_at         timestamptz,
    resolved_by         uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit -> SET NULL
    created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_gaps_class_subject_id ON public.curriculum_gaps(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_gaps_resolved_by      ON public.curriculum_gaps(resolved_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_gaps_gap_id           ON public.curriculum_gaps(gap_id);

-- ----------------------------------------------------------------------------
-- curriculum_analytics_snapshots
--   Upsert: class_subject_id, snapshot_date, coverage_percentage, topics_covered,
--           topics_total, units_covered, units_total, scos_covered, scos_total,
--           planned_hours_total, actual_hours_total, average_achievement_percentage,
--           gaps_count, snapshot_data  (onConflict class_subject_id,snapshot_date)
--   Select: *, .eq('class_subject_id', ...) .order('snapshot_date' desc) .limit(1)
--           optionally .eq('snapshot_date', ...)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_analytics_snapshots (
    id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_subject_id               uuid,                      -- FLAG: references class_subjects (not in group/existing list) -> plain uuid, no FK (uncertainty #4)
    snapshot_date                  date,                      -- *_date -> date
    coverage_percentage            numeric DEFAULT 0,         -- *_percentage -> numeric
    topics_covered                 integer DEFAULT 0,
    topics_total                   integer DEFAULT 0,
    units_covered                  integer DEFAULT 0,
    units_total                    integer DEFAULT 0,
    scos_covered                   integer DEFAULT 0,
    scos_total                     integer DEFAULT 0,
    planned_hours_total            numeric DEFAULT 0,         -- *_hours -> numeric (fractional hours)
    actual_hours_total             numeric DEFAULT 0,
    average_achievement_percentage numeric DEFAULT 0,
    gaps_count                     integer DEFAULT 0,         -- *_count -> integer
    snapshot_data                  jsonb,                     -- snapshot/*_data -> jsonb
    created_at                     timestamptz DEFAULT now(),
    updated_at                     timestamptz DEFAULT now(),
    CONSTRAINT curriculum_analytics_snapshots_class_subject_date_key
        UNIQUE (class_subject_id, snapshot_date) -- supports onConflict 'class_subject_id,snapshot_date'
);

CREATE INDEX IF NOT EXISTS idx_curriculum_analytics_snapshots_class_subject_id ON public.curriculum_analytics_snapshots(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_analytics_snapshots_snapshot_date    ON public.curriculum_analytics_snapshots(snapshot_date);

-- ============================================================================
-- ROW LEVEL SECURITY
--   is_admin()       -> true for admin / super_admin
--   get_user_role()  -> current user's role string
--   auth.uid()       -> current authenticated user id
-- Policy set per table:
--   <t>_admin_all  : admins full access
--   <t>_staff_rw   : curriculum authoring staff full access
--   <t>_auth_read  : (templates/resources only) any signed-in user may SELECT
-- ============================================================================

-- ---- curriculum_templates --------------------------------------------------
ALTER TABLE public.curriculum_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_templates_admin_all" ON public.curriculum_templates;
CREATE POLICY "curriculum_templates_admin_all" ON public.curriculum_templates
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_templates_staff_rw" ON public.curriculum_templates;
CREATE POLICY "curriculum_templates_staff_rw" ON public.curriculum_templates
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

DROP POLICY IF EXISTS "curriculum_templates_auth_read" ON public.curriculum_templates;
CREATE POLICY "curriculum_templates_auth_read" ON public.curriculum_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---- curriculum_resources --------------------------------------------------
ALTER TABLE public.curriculum_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_resources_admin_all" ON public.curriculum_resources;
CREATE POLICY "curriculum_resources_admin_all" ON public.curriculum_resources
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_resources_staff_rw" ON public.curriculum_resources;
CREATE POLICY "curriculum_resources_staff_rw" ON public.curriculum_resources
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

DROP POLICY IF EXISTS "curriculum_resources_auth_read" ON public.curriculum_resources;
CREATE POLICY "curriculum_resources_auth_read" ON public.curriculum_resources
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---- curriculum_editing_sessions -------------------------------------------
ALTER TABLE public.curriculum_editing_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_editing_sessions_admin_all" ON public.curriculum_editing_sessions;
CREATE POLICY "curriculum_editing_sessions_admin_all" ON public.curriculum_editing_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_editing_sessions_staff_rw" ON public.curriculum_editing_sessions;
CREATE POLICY "curriculum_editing_sessions_staff_rw" ON public.curriculum_editing_sessions
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_resource_links ---------------------------------------------
ALTER TABLE public.curriculum_resource_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_resource_links_admin_all" ON public.curriculum_resource_links;
CREATE POLICY "curriculum_resource_links_admin_all" ON public.curriculum_resource_links
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_resource_links_staff_rw" ON public.curriculum_resource_links;
CREATE POLICY "curriculum_resource_links_staff_rw" ON public.curriculum_resource_links
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_session_editors --------------------------------------------
ALTER TABLE public.curriculum_session_editors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_session_editors_admin_all" ON public.curriculum_session_editors;
CREATE POLICY "curriculum_session_editors_admin_all" ON public.curriculum_session_editors
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_session_editors_staff_rw" ON public.curriculum_session_editors;
CREATE POLICY "curriculum_session_editors_staff_rw" ON public.curriculum_session_editors
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_change_history ---------------------------------------------
ALTER TABLE public.curriculum_change_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_change_history_admin_all" ON public.curriculum_change_history;
CREATE POLICY "curriculum_change_history_admin_all" ON public.curriculum_change_history
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_change_history_staff_rw" ON public.curriculum_change_history;
CREATE POLICY "curriculum_change_history_staff_rw" ON public.curriculum_change_history
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_ai_suggestions ---------------------------------------------
ALTER TABLE public.curriculum_ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_ai_suggestions_admin_all" ON public.curriculum_ai_suggestions;
CREATE POLICY "curriculum_ai_suggestions_admin_all" ON public.curriculum_ai_suggestions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_ai_suggestions_staff_rw" ON public.curriculum_ai_suggestions;
CREATE POLICY "curriculum_ai_suggestions_staff_rw" ON public.curriculum_ai_suggestions
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_gaps -------------------------------------------------------
ALTER TABLE public.curriculum_gaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_gaps_admin_all" ON public.curriculum_gaps;
CREATE POLICY "curriculum_gaps_admin_all" ON public.curriculum_gaps
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_gaps_staff_rw" ON public.curriculum_gaps;
CREATE POLICY "curriculum_gaps_staff_rw" ON public.curriculum_gaps
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ---- curriculum_analytics_snapshots ----------------------------------------
ALTER TABLE public.curriculum_analytics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_analytics_snapshots_admin_all" ON public.curriculum_analytics_snapshots;
CREATE POLICY "curriculum_analytics_snapshots_admin_all" ON public.curriculum_analytics_snapshots
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "curriculum_analytics_snapshots_staff_rw" ON public.curriculum_analytics_snapshots;
CREATE POLICY "curriculum_analytics_snapshots_staff_rw" ON public.curriculum_analytics_snapshots
    FOR ALL USING (get_user_role() IN ('admin','super_admin','school_admin','instructor'))
    WITH CHECK (get_user_role() IN ('admin','super_admin','school_admin','instructor'));

-- ============================================================================
-- END 03_curriculum.sql
-- ============================================================================
