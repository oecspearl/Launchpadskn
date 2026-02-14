-- LaunchPad SKN - Enable Supabase Realtime for Collaboration Tables
-- This script sets up Realtime replication and RLS policies for collaboration features

-- ============================================
-- STEP 1: Enable Realtime Publication (if not already enabled)
-- ============================================
-- Note: In Supabase, this is typically done via the Dashboard, but we can check/create it here
-- Go to Database → Replication in Supabase Dashboard and enable for these tables:
-- - collaborative_documents
-- - document_changes
-- - collaboration_participants
-- - whiteboard_elements
-- - project_tasks
-- - collaboration_sessions

-- ============================================
-- STEP 2: RLS Policies for Realtime Access
-- ============================================
-- These policies allow users to subscribe to realtime changes

-- Enable RLS on collaboration tables (if not already enabled)
ALTER TABLE collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see documents for sessions they're participating in
CREATE POLICY "Users can view documents in their sessions"
ON collaborative_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaboration_participants cp
        JOIN users u ON cp.user_id = u.user_id
        WHERE cp.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
        AND cp.is_active = true
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
    )
);

-- Policy: Users can see document changes for documents they can view
CREATE POLICY "Users can view document changes"
ON document_changes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaborative_documents cd
        JOIN collaboration_participants cp ON cd.session_id = cp.session_id
        JOIN users u ON cp.user_id = u.user_id
        WHERE cd.document_id = document_changes.document_id
        AND u.id = auth.uid()
        AND cp.is_active = true
    )
);

-- Policy: Users can see participants in sessions they're part of
-- Note: Avoid self-reference to prevent infinite recursion
CREATE POLICY "Users can view participants in their sessions"
ON collaboration_participants
FOR SELECT
USING (
    -- Users can see their own participant record
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
    -- OR they created the session
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaboration_participants.session_id
        AND u.id = auth.uid()
    )
    -- OR the session is public
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        WHERE cs.session_id = collaboration_participants.session_id
        AND cs.is_public = true
    )
);

-- Policy: Users can see whiteboard elements for whiteboards they can access
CREATE POLICY "Users can view whiteboard elements"
ON whiteboard_elements
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaborative_whiteboards cw
        JOIN collaboration_sessions cs ON cw.session_id = cs.session_id
        LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id
        LEFT JOIN users u1 ON cp.user_id = u1.user_id
        LEFT JOIN users u2 ON cs.created_by = u2.user_id
        WHERE cw.whiteboard_id = whiteboard_elements.whiteboard_id
        AND (
            u1.id = auth.uid()
            OR u2.id = auth.uid()
        )
        AND (cp.is_active = true OR u2.id = auth.uid())
    )
);

-- Policy: Users can see project tasks for projects they're members of
CREATE POLICY "Users can view project tasks"
ON project_tasks
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM group_projects gp
        LEFT JOIN project_members pm ON gp.project_id = pm.project_id
        LEFT JOIN users u1 ON pm.user_id = u1.user_id
        LEFT JOIN users u2 ON gp.team_leader_id = u2.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND (
            u1.id = auth.uid()
            OR u2.id = auth.uid()
        )
        AND (pm.is_active = true OR u2.id = auth.uid())
    )
);

-- Policy: Users can see sessions they're part of or created
-- Note: Avoid checking collaboration_participants to prevent circular dependency
CREATE POLICY "Users can view their collaboration sessions"
ON collaboration_sessions
FOR SELECT
USING (
    -- Users can see sessions they created
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_sessions.created_by
        AND u.id = auth.uid()
    )
    -- OR the session is public
    OR is_public = true
    -- OR they're in a class-subject that has access (for class-based sessions)
    OR (
        class_subject_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM class_subjects cs
            JOIN users u ON cs.teacher_id = u.user_id
            WHERE cs.class_subject_id = collaboration_sessions.class_subject_id
            AND u.id = auth.uid()
        )
    )
);

-- Policy: Users can create sessions
CREATE POLICY "Users can create collaboration sessions"
ON collaboration_sessions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_sessions.created_by
        AND u.id = auth.uid()
    )
);

-- Policy: Users can update sessions they created
CREATE POLICY "Users can update their collaboration sessions"
ON collaboration_sessions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_sessions.created_by
        AND u.id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_sessions.created_by
        AND u.id = auth.uid()
    )
);

-- Policy: Users can insert participants
CREATE POLICY "Users can join sessions"
ON collaboration_participants
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaboration_participants.session_id
        AND (u.id = auth.uid() OR cs.is_public = true)
    )
);

-- Policy: Users can update their own participant record
CREATE POLICY "Users can update their participant status"
ON collaboration_participants
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
);

-- Policy: Users can insert virtual classrooms
CREATE POLICY "Users can create virtual classrooms"
ON virtual_classrooms
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = virtual_classrooms.session_id
        AND u.id = auth.uid()
    )
);

-- Policy: Users can update virtual classrooms for their sessions
CREATE POLICY "Users can update their virtual classrooms"
ON virtual_classrooms
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = virtual_classrooms.session_id
        AND u.id = auth.uid()
    )
);

-- ============================================
-- STEP 3: Grant Realtime Access
-- ============================================
-- Note: In Supabase Dashboard, you need to:
-- 1. Go to Database → Replication
-- 2. Find each table and toggle "Enable Realtime" to ON
-- 3. This creates a publication and adds the table to it

-- Alternatively, you can use SQL (requires superuser or appropriate permissions):
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaborative_documents;
-- ALTER PUBLICATION supabase_realtime ADD TABLE document_changes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_participants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_elements;
-- ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;

-- ============================================
-- NOTES
-- ============================================
-- 1. Realtime is enabled per-table in Supabase Dashboard
-- 2. RLS policies must allow SELECT for users to receive realtime updates
-- 3. Users can only receive updates for rows they have SELECT permission on
-- 4. The frontend subscribes using: supabase.channel('table_name').on('postgres_changes', ...)

