-- =============================================================================
-- Phase 2 Migration 04: Collaboration + Virtual Classroom group
-- =============================================================================
-- Creates the tables backing the real-time collaboration and virtual classroom
-- features. Schemas are DERIVED from frontend usage:
--   frontend/src/services/collaborationService.js
--   frontend/src/services/interactiveContentService.js
--   frontend/src/components/Collaboration/*
--   frontend/src/components/InteractiveContent/*
--
-- Tables created (parent-before-child):
--   collaborative_documents, collaborative_whiteboards, collaboration_sessions,
--   document_changes, breakout_rooms, virtual_classrooms, arvr_sessions,
--   lab_sessions, tutoring_sessions
--
-- Existing tables (referenced, never recreated):
--   users(id), classes(id), class_subjects(id), subjects(id), lessons(id),
--   forms(id), institutions(id), arvr_content(id), tutor_conversations(id)
--
-- Conventions:
--   * Every table has: id uuid PK DEFAULT gen_random_uuid(), created_at timestamptz.
--   * updated_at added where the frontend writes it.
--   * User-ish FKs -> users(id): ownership cols CASCADE, audit cols SET NULL.
--   * RLS enabled on all tables: admin_all (is_admin()) + auth_rw
--     (auth.uid() IS NOT NULL) so these interactive/session features work for
--     any signed-in user.
--
-- NOTE: The frontend often references `<table>.session_id` and `<table>.document_id`
-- as the entity's own surrogate key (e.g. `.eq('document_id', ...)`, returned
-- `doc.session_id`). To keep `id` canonical while preserving frontend lookups,
-- each such table includes BOTH the canonical `id` and a separate uuid column
-- matching the name the frontend filters/joins on, defaulted to gen_random_uuid().
--
-- FLAGGED uncertainties (see end of file for full notes):
--   * collaboration_sessions vs virtual_classrooms for `session_id` FK target.
--   * scheduled_start / scheduled_end typed as timestamptz (datetime-local input).
-- =============================================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PARENT: collaboration_sessions
--   Source: collaborationService.createSession() payloads
--     session_type, title, description, class_subject_id, created_by
--   Frontend returns session.session_id and filters child rows by session_id.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        uuid NOT NULL DEFAULT gen_random_uuid(), -- frontend-facing key (session.session_id)
    session_type      text,                                    -- 'DOCUMENT' | 'WHITEBOARD' | 'CLASSROOM' | 'TUTORING'
    title             text,
    description       text,
    status            text,
    participant_count integer DEFAULT 0,                       -- doc.session.participant_count in UI
    is_active         boolean DEFAULT true,
    started_at        timestamptz,
    ended_at          timestamptz,
    class_subject_id  uuid REFERENCES public.class_subjects(id) ON DELETE SET NULL,
    created_by        uuid REFERENCES public.users(id) ON DELETE CASCADE, -- session owner
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS collaboration_sessions_session_id_key
    ON public.collaboration_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_class_subject_id
    ON public.collaboration_sessions (class_subject_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_created_by
    ON public.collaboration_sessions (created_by);

-- =============================================================================
-- PARENT: collaborative_documents
--   Source: collaborationService.getDocument/createDocument/updateDocument
--     filtered by document_id and session_id; payload: session_id, title,
--     content, content_type, last_edited_by, last_edited_at, updated_at.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.collaborative_documents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     uuid NOT NULL DEFAULT gen_random_uuid(), -- frontend-facing key (doc.document_id)
    session_id      uuid REFERENCES public.collaboration_sessions (session_id) ON DELETE CASCADE,
    title           text,
    content         text,
    content_type    text,                                    -- 'TEXT' | 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
    last_edited_by  uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit
    last_edited_at  timestamptz,
    created_by      uuid REFERENCES public.users(id) ON DELETE CASCADE,  -- owner
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS collaborative_documents_document_id_key
    ON public.collaborative_documents (document_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_documents_session_id
    ON public.collaborative_documents (session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_documents_last_edited_by
    ON public.collaborative_documents (last_edited_by);
CREATE INDEX IF NOT EXISTS idx_collaborative_documents_created_by
    ON public.collaborative_documents (created_by);

-- =============================================================================
-- PARENT: virtual_classrooms
--   Source: collaborationService.createVirtualClassroom/getVirtualClassroom
--     filtered by session_id; payload: session_id, meeting_url, meeting_id,
--     recording_enabled, breakout_rooms_enabled.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.virtual_classrooms (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id             uuid REFERENCES public.collaboration_sessions (session_id) ON DELETE CASCADE,
    meeting_url            text,
    meeting_id             text,
    recording_enabled      boolean DEFAULT false,
    recording_url          text,
    breakout_rooms_enabled boolean DEFAULT false,
    is_active              boolean DEFAULT true,
    host_id                uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit
    max_participants       integer,
    started_at             timestamptz,
    ended_at               timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_virtual_classrooms_session_id
    ON public.virtual_classrooms (session_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classrooms_host_id
    ON public.virtual_classrooms (host_id);

-- =============================================================================
-- CHILD: collaborative_whiteboards
--   Source: collaborationService.getWhiteboard/createWhiteboard/updateWhiteboard
--     filtered by session_id and whiteboard_id; payload: session_id, title,
--     canvas_data, updated_at; UI reads whiteboard_id, last_edited_at.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.collaborative_whiteboards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    whiteboard_id   uuid NOT NULL DEFAULT gen_random_uuid(), -- frontend-facing key (whiteboard.whiteboard_id)
    session_id      uuid REFERENCES public.collaboration_sessions (session_id) ON DELETE CASCADE,
    title           text,
    canvas_data     jsonb DEFAULT '{}'::jsonb,               -- { elements: [] }
    last_edited_by  uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit
    last_edited_at  timestamptz,
    created_by      uuid REFERENCES public.users(id) ON DELETE CASCADE,  -- owner
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS collaborative_whiteboards_whiteboard_id_key
    ON public.collaborative_whiteboards (whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_whiteboards_session_id
    ON public.collaborative_whiteboards (session_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_whiteboards_last_edited_by
    ON public.collaborative_whiteboards (last_edited_by);
CREATE INDEX IF NOT EXISTS idx_collaborative_whiteboards_created_by
    ON public.collaborative_whiteboards (created_by);

-- =============================================================================
-- CHILD: document_changes
--   Source: collaborationService.getDocumentChanges/addDocumentChange
--     filtered by document_id, .gt('version', ...), .order('timestamp').
--     Payload (changeData) is a passthrough object; inferring OT change fields.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.document_changes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  uuid REFERENCES public.collaborative_documents (document_id) ON DELETE CASCADE,
    version      integer,                                  -- filtered via .gt('version', sinceVersion)
    change_type  text,
    change_data  jsonb DEFAULT '{}'::jsonb,
    "position"   integer,
    user_id      uuid REFERENCES public.users(id) ON DELETE SET NULL, -- audit (who made the change)
    "timestamp"  timestamptz DEFAULT now(),               -- ordered via .order('timestamp')
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_changes_document_id
    ON public.document_changes (document_id);
CREATE INDEX IF NOT EXISTS idx_document_changes_user_id
    ON public.document_changes (user_id);

-- =============================================================================
-- CHILD: breakout_rooms
--   Source: collaborationService.createBreakoutRoom (roomData passthrough).
--     No explicit columns surfaced; inferring standard breakout-room fields.
--     Parent is virtual_classrooms (breakout_rooms_enabled toggles them).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.breakout_rooms (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    virtual_classroom_id uuid REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
    session_id           uuid REFERENCES public.collaboration_sessions (session_id) ON DELETE CASCADE,
    room_name            text,
    meeting_url          text,
    meeting_id           text,
    max_participants     integer,
    is_active            boolean DEFAULT true,
    created_by           uuid REFERENCES public.users(id) ON DELETE CASCADE, -- owner
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakout_rooms_virtual_classroom_id
    ON public.breakout_rooms (virtual_classroom_id);
CREATE INDEX IF NOT EXISTS idx_breakout_rooms_session_id
    ON public.breakout_rooms (session_id);
CREATE INDEX IF NOT EXISTS idx_breakout_rooms_created_by
    ON public.breakout_rooms (created_by);

-- =============================================================================
-- CHILD: lab_sessions
--   Source: interactiveContentService.createLabSession/updateLabSession
--     filtered by session_id; payload: lab_id, student_id, class_subject_id,
--     session_state, actions_log; updates: is_completed, completed_at,
--     completion_percentage, updated_at.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lab_sessions (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id            uuid NOT NULL DEFAULT gen_random_uuid(), -- frontend-facing key (labSession.session_id)
    lab_id                uuid,                                    -- references a virtual lab (no table in scope) -- FLAG: target table unknown
    student_id            uuid REFERENCES public.users(id) ON DELETE CASCADE, -- owner
    class_subject_id      uuid REFERENCES public.class_subjects(id) ON DELETE SET NULL,
    session_state         jsonb DEFAULT '{}'::jsonb,
    actions_log           jsonb DEFAULT '[]'::jsonb,
    is_completed          boolean DEFAULT false,
    completion_percentage integer DEFAULT 0,
    completed_at          timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lab_sessions_session_id_key
    ON public.lab_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_lab_id
    ON public.lab_sessions (lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_student_id
    ON public.lab_sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_class_subject_id
    ON public.lab_sessions (class_subject_id);

-- =============================================================================
-- CHILD: arvr_sessions
--   Source: interactiveContentService.createARVRSession/updateARVRSession
--     filtered by session_id; payload: content_id, student_id, class_subject_id,
--     session_state, interactions_log; updates: last_accessed, is_completed,
--     completed_at, completion_percentage, updated_at.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.arvr_sessions (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id            uuid NOT NULL DEFAULT gen_random_uuid(), -- frontend-facing key (contentSession.session_id)
    content_id            uuid REFERENCES public.arvr_content(id) ON DELETE SET NULL,
    student_id            uuid REFERENCES public.users(id) ON DELETE CASCADE, -- owner
    class_subject_id      uuid REFERENCES public.class_subjects(id) ON DELETE SET NULL,
    session_state         jsonb DEFAULT '{}'::jsonb,
    interactions_log      jsonb DEFAULT '[]'::jsonb,
    is_completed          boolean DEFAULT false,
    completion_percentage integer DEFAULT 0,
    completed_at          timestamptz,
    last_accessed         timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS arvr_sessions_session_id_key
    ON public.arvr_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_arvr_sessions_content_id
    ON public.arvr_sessions (content_id);
CREATE INDEX IF NOT EXISTS idx_arvr_sessions_student_id
    ON public.arvr_sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_arvr_sessions_class_subject_id
    ON public.arvr_sessions (class_subject_id);

-- =============================================================================
-- CHILD: tutoring_sessions
--   Source: collaborationService.createTutoringSession; UI reads tutor_rating,
--     student_rating, status. Payload: session_id, tutor_id, student_id, topic,
--     session_type, scheduled_start, learning_objectives, status.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          uuid REFERENCES public.collaboration_sessions (session_id) ON DELETE CASCADE,
    tutor_id            uuid REFERENCES public.users(id) ON DELETE CASCADE,    -- owner
    student_id          uuid REFERENCES public.users(id) ON DELETE CASCADE,    -- owner
    topic               text,
    session_type        text,
    status              text,                                  -- 'SCHEDULED' | ...
    scheduled_start     timestamptz,                           -- FLAG: datetime-local input -> timestamptz
    scheduled_end       timestamptz,                           -- FLAG: datetime-local input -> timestamptz
    learning_objectives text,
    notes               text,
    tutor_rating        integer,
    student_rating      integer,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_session_id
    ON public.tutoring_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_id
    ON public.tutoring_sessions (tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student_id
    ON public.tutoring_sessions (student_id);

-- =============================================================================
-- ROW LEVEL SECURITY
--   Helper functions assumed to exist: is_admin(), get_user_role(), auth.uid().
--   Policy pattern per table:
--     * <t>_admin_all : full access for admins.
--     * <t>_auth_rw   : full access for any authenticated user (these are
--                       interactive/session features that must work for
--                       signed-in users).
-- =============================================================================

-- collaboration_sessions
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collaboration_sessions_admin_all" ON public.collaboration_sessions;
CREATE POLICY "collaboration_sessions_admin_all" ON public.collaboration_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "collaboration_sessions_auth_rw" ON public.collaboration_sessions;
CREATE POLICY "collaboration_sessions_auth_rw" ON public.collaboration_sessions
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- collaborative_documents
ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collaborative_documents_admin_all" ON public.collaborative_documents;
CREATE POLICY "collaborative_documents_admin_all" ON public.collaborative_documents
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "collaborative_documents_auth_rw" ON public.collaborative_documents;
CREATE POLICY "collaborative_documents_auth_rw" ON public.collaborative_documents
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- virtual_classrooms
ALTER TABLE public.virtual_classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "virtual_classrooms_admin_all" ON public.virtual_classrooms;
CREATE POLICY "virtual_classrooms_admin_all" ON public.virtual_classrooms
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "virtual_classrooms_auth_rw" ON public.virtual_classrooms;
CREATE POLICY "virtual_classrooms_auth_rw" ON public.virtual_classrooms
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- collaborative_whiteboards
ALTER TABLE public.collaborative_whiteboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collaborative_whiteboards_admin_all" ON public.collaborative_whiteboards;
CREATE POLICY "collaborative_whiteboards_admin_all" ON public.collaborative_whiteboards
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "collaborative_whiteboards_auth_rw" ON public.collaborative_whiteboards;
CREATE POLICY "collaborative_whiteboards_auth_rw" ON public.collaborative_whiteboards
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- document_changes
ALTER TABLE public.document_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_changes_admin_all" ON public.document_changes;
CREATE POLICY "document_changes_admin_all" ON public.document_changes
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "document_changes_auth_rw" ON public.document_changes;
CREATE POLICY "document_changes_auth_rw" ON public.document_changes
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- breakout_rooms
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breakout_rooms_admin_all" ON public.breakout_rooms;
CREATE POLICY "breakout_rooms_admin_all" ON public.breakout_rooms
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "breakout_rooms_auth_rw" ON public.breakout_rooms;
CREATE POLICY "breakout_rooms_auth_rw" ON public.breakout_rooms
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- lab_sessions
ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_sessions_admin_all" ON public.lab_sessions;
CREATE POLICY "lab_sessions_admin_all" ON public.lab_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "lab_sessions_auth_rw" ON public.lab_sessions;
CREATE POLICY "lab_sessions_auth_rw" ON public.lab_sessions
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- arvr_sessions
ALTER TABLE public.arvr_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arvr_sessions_admin_all" ON public.arvr_sessions;
CREATE POLICY "arvr_sessions_admin_all" ON public.arvr_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "arvr_sessions_auth_rw" ON public.arvr_sessions;
CREATE POLICY "arvr_sessions_auth_rw" ON public.arvr_sessions
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- tutoring_sessions
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tutoring_sessions_admin_all" ON public.tutoring_sessions;
CREATE POLICY "tutoring_sessions_admin_all" ON public.tutoring_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "tutoring_sessions_auth_rw" ON public.tutoring_sessions;
CREATE POLICY "tutoring_sessions_auth_rw" ON public.tutoring_sessions
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- FLAGGED UNCERTAINTIES
-- =============================================================================
-- 1. session_id FK target (collaboration_sessions vs virtual_classrooms):
--    The frontend creates a collaboration_sessions row FIRST, then passes the
--    returned session.session_id into child rows (documents, whiteboards,
--    virtual_classrooms, breakout_rooms, tutoring_sessions). Therefore session_id
--    on these children references collaboration_sessions(session_id), NOT
--    virtual_classrooms. lab_sessions/arvr_sessions instead use session_id as
--    their OWN surrogate key (the frontend reads back labSession.session_id /
--    contentSession.session_id and filters updates on it), so those are local
--    DEFAULT gen_random_uuid() keys with NO FK. -> Resolved as above; flagging
--    in case business intent differs.
--
-- 2. start_time / end_time vs time-of-day: No literal start_time/end_time columns
--    appear. tutoring_sessions.scheduled_start comes from a datetime-local-style
--    input bound to a full timestamp, so typed as timestamptz (NOT clock-time
--    `time`). scheduled_end inferred. Flagging in case these are meant as
--    wall-clock times.
--
-- 3. lab_sessions.lab_id: references a "virtual lab" entity fetched via the
--    get_virtual_labs() RPC. No lab table is in the provided existing-tables set,
--    so lab_id is a plain uuid with no FK. -> verify/attach FK once the labs
--    table is known.
--
-- 4. *.session_id / *.document_id / *.whiteboard_id surrogate columns: kept as
--    separate uuid columns (in addition to canonical `id`) because the frontend
--    filters and returns these exact names. If you prefer `id` to BE these keys,
--    rename and drop the duplicates.
-- =============================================================================
