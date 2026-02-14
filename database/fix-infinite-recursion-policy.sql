-- LaunchPad SKN - Fix Infinite Recursion in RLS Policies
-- This fixes the infinite recursion errors in collaboration policies

-- ============================================
-- Drop ALL existing policies first (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON collaboration_participants;
DROP POLICY IF EXISTS "Users can view documents in their sessions" ON collaborative_documents;
DROP POLICY IF EXISTS "Users can view document changes" ON document_changes;
DROP POLICY IF EXISTS "Users can view whiteboard elements" ON whiteboard_elements;
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can view their collaboration sessions" ON collaboration_sessions;

-- ============================================
-- Fix 1: collaboration_participants policy
-- ============================================
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

-- ============================================
-- Fix 2: collaboration_sessions policy
-- ============================================
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
    -- OR they're the teacher for the class-subject
    OR (
        class_subject_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM class_subjects cs
            JOIN users u ON cs.teacher_id = u.user_id
            WHERE cs.class_subject_id = collaboration_sessions.class_subject_id
            AND u.id = auth.uid()
        )
    )
    -- OR they're a student in the class
    OR (
        class_subject_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM class_subjects cs
            JOIN student_class_assignments sca ON cs.class_id = sca.class_id
            JOIN users u ON sca.student_id = u.user_id
            WHERE cs.class_subject_id = collaboration_sessions.class_subject_id
            AND u.id = auth.uid()
        )
    )
);

-- ============================================
-- Recreate other policies without circular dependencies
-- ============================================

-- Policy: Users can see documents for sessions they can access
CREATE POLICY "Users can view documents in their sessions"
ON collaborative_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        WHERE cs.session_id = collaborative_documents.session_id
        AND cs.is_public = true
    )
    OR (
        EXISTS (
            SELECT 1 FROM collaboration_sessions cs
            JOIN class_subjects csub ON cs.class_subject_id = csub.class_subject_id
            JOIN users u ON csub.teacher_id = u.user_id
            WHERE cs.session_id = collaborative_documents.session_id
            AND u.id = auth.uid()
        )
    )
);

-- Policy: Users can see document changes for documents they can view
CREATE POLICY "Users can view document changes"
ON document_changes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM collaborative_documents cd
        JOIN collaboration_sessions cs ON cd.session_id = cs.session_id
        JOIN users u ON cs.created_by = u.user_id
        WHERE cd.document_id = document_changes.document_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaborative_documents cd
        JOIN collaboration_sessions cs ON cd.session_id = cs.session_id
        WHERE cd.document_id = document_changes.document_id
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
        JOIN users u ON cs.created_by = u.user_id
        WHERE cw.whiteboard_id = whiteboard_elements.whiteboard_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaborative_whiteboards cw
        JOIN collaboration_sessions cs ON cw.session_id = cs.session_id
        WHERE cw.whiteboard_id = whiteboard_elements.whiteboard_id
        AND cs.is_public = true
    )
);

-- Policy: Users can see project tasks for projects they can access
CREATE POLICY "Users can view project tasks"
ON project_tasks
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM group_projects gp
        JOIN collaboration_sessions cs ON gp.session_id = cs.session_id
        JOIN users u ON cs.created_by = u.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM group_projects gp
        JOIN project_members pm ON gp.project_id = pm.project_id
        JOIN users u ON pm.user_id = u.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND u.id = auth.uid()
        AND pm.is_active = true
    )
    OR EXISTS (
        SELECT 1 FROM group_projects gp
        JOIN users u ON gp.team_leader_id = u.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND u.id = auth.uid()
    )
);
