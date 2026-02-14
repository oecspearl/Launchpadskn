-- LaunchPad SKN - Fix Collaboration RLS Policies
-- This adds INSERT and UPDATE policies that were missing

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create collaboration sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can update their collaboration sessions" ON collaboration_sessions;
DROP POLICY IF EXISTS "Users can join sessions" ON collaboration_participants;
DROP POLICY IF EXISTS "Users can update their participant status" ON collaboration_participants;
DROP POLICY IF EXISTS "Users can create virtual classrooms" ON virtual_classrooms;
DROP POLICY IF EXISTS "Users can update their virtual classrooms" ON virtual_classrooms;

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

-- Policy: Users can insert participants (join sessions)
CREATE POLICY "Users can join sessions"
ON collaboration_participants
FOR INSERT
WITH CHECK (
    -- Users can join as themselves
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
    -- OR session creator can add participants
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaboration_participants.session_id
        AND u.id = auth.uid()
    )
    -- OR session is public and they're joining as themselves
    OR (
        EXISTS (
            SELECT 1 FROM collaboration_sessions cs
            WHERE cs.session_id = collaboration_participants.session_id
            AND cs.is_public = true
        )
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = collaboration_participants.user_id
            AND u.id = auth.uid()
        )
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

-- Policy: Users can insert documents
CREATE POLICY "Users can create documents"
ON collaborative_documents
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_participants cp
        JOIN users u ON cp.user_id = u.user_id
        WHERE cp.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
        AND cp.can_edit = true
    )
);

-- Policy: Users can update documents they can view
CREATE POLICY "Users can update documents"
ON collaborative_documents
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM collaboration_participants cp
        JOIN users u ON cp.user_id = u.user_id
        WHERE cp.session_id = collaborative_documents.session_id
        AND u.id = auth.uid()
        AND cp.can_edit = true
        AND cp.is_active = true
    )
);

-- Policy: Users can insert document changes
CREATE POLICY "Users can add document changes"
ON document_changes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaborative_documents cd
        JOIN collaboration_sessions cs ON cd.session_id = cs.session_id
        LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id
        LEFT JOIN users u1 ON cs.created_by = u1.user_id
        LEFT JOIN users u2 ON cp.user_id = u2.user_id
        WHERE cd.document_id = document_changes.document_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND cp.can_edit = true AND cp.is_active = true)
        )
    )
);

-- Policy: Users can insert whiteboards
CREATE POLICY "Users can create whiteboards"
ON collaborative_whiteboards
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaborative_whiteboards.session_id
        AND u.id = auth.uid()
    )
);

-- Policy: Users can update whiteboards
CREATE POLICY "Users can update whiteboards"
ON collaborative_whiteboards
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id
        LEFT JOIN users u1 ON cs.created_by = u1.user_id
        LEFT JOIN users u2 ON cp.user_id = u2.user_id
        WHERE cs.session_id = collaborative_whiteboards.session_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND cp.can_edit = true AND cp.is_active = true)
        )
    )
);

-- Policy: Users can insert whiteboard elements
CREATE POLICY "Users can add whiteboard elements"
ON whiteboard_elements
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaborative_whiteboards cw
        JOIN collaboration_sessions cs ON cw.session_id = cs.session_id
        LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id
        LEFT JOIN users u1 ON cs.created_by = u1.user_id
        LEFT JOIN users u2 ON cp.user_id = u2.user_id
        WHERE cw.whiteboard_id = whiteboard_elements.whiteboard_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND cp.can_edit = true AND cp.is_active = true)
        )
    )
);

-- Policy: Users can update whiteboard elements
CREATE POLICY "Users can update whiteboard elements"
ON whiteboard_elements
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM collaborative_whiteboards cw
        JOIN collaboration_sessions cs ON cw.session_id = cs.session_id
        LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id
        LEFT JOIN users u1 ON cs.created_by = u1.user_id
        LEFT JOIN users u2 ON cp.user_id = u2.user_id
        WHERE cw.whiteboard_id = whiteboard_elements.whiteboard_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND cp.can_edit = true AND cp.is_active = true)
        )
    )
);

-- Policy: Users can insert group projects
CREATE POLICY "Users can create group projects"
ON group_projects
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = group_projects.session_id
        AND u.id = auth.uid()
    )
);

-- Policy: Users can update projects they're part of
CREATE POLICY "Users can update group projects"
ON group_projects
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = group_projects.team_leader_id
        AND u.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM project_members pm
        JOIN users u ON pm.user_id = u.user_id
        WHERE pm.project_id = group_projects.project_id
        AND u.id = auth.uid()
        AND pm.is_active = true
    )
);

-- Policy: Users can insert project tasks
CREATE POLICY "Users can create project tasks"
ON project_tasks
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_projects gp
        LEFT JOIN project_members pm ON gp.project_id = pm.project_id
        LEFT JOIN users u1 ON gp.team_leader_id = u1.user_id
        LEFT JOIN users u2 ON pm.user_id = u2.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND pm.is_active = true)
        )
    )
);

-- Policy: Users can update project tasks
CREATE POLICY "Users can update project tasks"
ON project_tasks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM group_projects gp
        LEFT JOIN project_members pm ON gp.project_id = pm.project_id
        LEFT JOIN users u1 ON gp.team_leader_id = u1.user_id
        LEFT JOIN users u2 ON pm.user_id = u2.user_id
        LEFT JOIN users u3 ON project_tasks.assigned_to = u3.user_id
        WHERE gp.project_id = project_tasks.project_id
        AND (
            u1.id = auth.uid()
            OR (u2.id = auth.uid() AND pm.is_active = true)
            OR (u3.id = auth.uid() AND project_tasks.assigned_to IS NOT NULL)
        )
    )
);

-- Policy: Users can insert project members
CREATE POLICY "Users can add project members"
ON project_members
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_projects gp
        LEFT JOIN users u1 ON gp.team_leader_id = u1.user_id
        LEFT JOIN users u2 ON project_members.user_id = u2.user_id
        WHERE gp.project_id = project_members.project_id
        AND (
            u1.id = auth.uid()
            OR u2.id = auth.uid()  -- Users can add themselves
        )
    )
);

