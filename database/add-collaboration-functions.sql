-- LaunchPad SKN - Real-Time Collaboration Functions
-- RPC functions for collaboration operations

-- ============================================
-- 1. Get Active Collaboration Sessions
-- ============================================
CREATE OR REPLACE FUNCTION get_active_sessions(
    class_subject_id_param BIGINT DEFAULT NULL,
    session_type_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    session_id BIGINT,
    session_type VARCHAR,
    title VARCHAR,
    description TEXT,
    class_subject_id BIGINT,
    created_by BIGINT,
    is_active BOOLEAN,
    participant_count BIGINT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.session_id,
        cs.session_type,
        cs.title,
        cs.description,
        cs.class_subject_id,
        cs.created_by,
        cs.is_active,
        COALESCE(COUNT(cp.participant_id), 0)::BIGINT as participant_count,
        cs.created_at
    FROM collaboration_sessions cs
    LEFT JOIN collaboration_participants cp ON cs.session_id = cp.session_id AND cp.is_active = true
    WHERE cs.is_active = true
      AND (class_subject_id_param IS NULL OR cs.class_subject_id = class_subject_id_param)
      AND (session_type_param IS NULL OR cs.session_type = session_type_param)
    GROUP BY cs.session_id, cs.session_type, cs.title, cs.description, cs.class_subject_id, cs.created_by, cs.is_active, cs.created_at
    ORDER BY cs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Get Session Participants
-- ============================================
CREATE OR REPLACE FUNCTION get_session_participants(session_id_param BIGINT)
RETURNS TABLE (
    participant_id BIGINT,
    user_id BIGINT,
    participant_name VARCHAR,
    role VARCHAR,
    joined_at TIMESTAMP,
    is_active BOOLEAN,
    can_edit BOOLEAN,
    video_enabled BOOLEAN,
    audio_enabled BOOLEAN,
    user_name VARCHAR,
    user_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.participant_id,
        cp.user_id,
        cp.participant_name,
        cp.role,
        cp.joined_at,
        cp.is_active,
        cp.can_edit,
        cp.video_enabled,
        cp.audio_enabled,
        u.name as user_name,
        u.email as user_email
    FROM collaboration_participants cp
    LEFT JOIN users u ON cp.user_id = u.user_id
    WHERE cp.session_id = session_id_param
    ORDER BY cp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Join Collaboration Session
-- ============================================
CREATE OR REPLACE FUNCTION join_session(
    session_id_param BIGINT,
    user_id_param BIGINT,
    role_param VARCHAR DEFAULT 'PARTICIPANT'
)
RETURNS BIGINT AS $$
DECLARE
    new_participant_id BIGINT;
BEGIN
    INSERT INTO collaboration_participants (
        session_id,
        user_id,
        role,
        joined_at,
        is_active,
        last_seen
    ) VALUES (
        session_id_param,
        user_id_param,
        role_param,
        CURRENT_TIMESTAMP,
        true,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (session_id, user_id) 
    DO UPDATE SET
        is_active = true,
        joined_at = CURRENT_TIMESTAMP,
        last_seen = CURRENT_TIMESTAMP
    RETURNING participant_id INTO new_participant_id;
    
    RETURN new_participant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Leave Collaboration Session
-- ============================================
CREATE OR REPLACE FUNCTION leave_session(
    session_id_param BIGINT,
    user_id_param BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE collaboration_participants
    SET 
        is_active = false,
        left_at = CURRENT_TIMESTAMP
    WHERE session_id = session_id_param
      AND user_id = user_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Get Document with Changes
-- ============================================
CREATE OR REPLACE FUNCTION get_document_with_changes(
    document_id_param BIGINT,
    since_version INTEGER DEFAULT 0
)
RETURNS TABLE (
    document_id BIGINT,
    title VARCHAR,
    content TEXT,
    version INTEGER,
    changes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.document_id,
        d.title,
        d.content,
        d.version,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'change_id', dc.change_id,
                    'user_id', dc.user_id,
                    'change_type', dc.change_type,
                    'position', dc.position,
                    'content', dc.content,
                    'timestamp', dc.timestamp,
                    'version', dc.version
                ) ORDER BY dc.timestamp
            ) FILTER (WHERE dc.change_id IS NOT NULL),
            '[]'::jsonb
        ) as changes
    FROM collaborative_documents d
    LEFT JOIN document_changes dc ON d.document_id = dc.document_id
        AND dc.version > since_version
    WHERE d.document_id = document_id_param
    GROUP BY d.document_id, d.title, d.content, d.version;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Get Tutoring Sessions
-- ============================================
CREATE OR REPLACE FUNCTION get_tutoring_sessions(
    tutor_id_param BIGINT DEFAULT NULL,
    student_id_param BIGINT DEFAULT NULL,
    status_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    tutoring_id BIGINT,
    session_id BIGINT,
    tutor_id BIGINT,
    tutor_name VARCHAR,
    student_id BIGINT,
    student_name VARCHAR,
    topic VARCHAR,
    session_type VARCHAR,
    scheduled_start TIMESTAMP,
    status VARCHAR,
    tutor_rating INTEGER,
    student_rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.tutoring_id,
        ts.session_id,
        ts.tutor_id,
        tutor.name as tutor_name,
        ts.student_id,
        student.name as student_name,
        ts.topic,
        ts.session_type,
        ts.scheduled_start,
        ts.status,
        ts.tutor_rating,
        ts.student_rating
    FROM tutoring_sessions ts
    LEFT JOIN users tutor ON ts.tutor_id = tutor.user_id
    LEFT JOIN users student ON ts.student_id = student.user_id
    WHERE (tutor_id_param IS NULL OR ts.tutor_id = tutor_id_param)
      AND (student_id_param IS NULL OR ts.student_id = student_id_param)
      AND (status_param IS NULL OR ts.status = status_param)
    ORDER BY ts.scheduled_start DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Get Group Projects
-- ============================================
CREATE OR REPLACE FUNCTION get_group_projects(
    class_subject_id_param BIGINT DEFAULT NULL,
    user_id_param BIGINT DEFAULT NULL,
    status_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    project_id BIGINT,
    session_id BIGINT,
    title VARCHAR,
    description TEXT,
    status VARCHAR,
    progress_percentage INTEGER,
    team_leader_id BIGINT,
    team_leader_name VARCHAR,
    member_count BIGINT,
    due_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gp.project_id,
        gp.session_id,
        gp.title,
        gp.description,
        gp.status,
        gp.progress_percentage,
        gp.team_leader_id,
        leader.name as team_leader_name,
        COUNT(pm.user_id)::BIGINT as member_count,
        gp.due_date
    FROM group_projects gp
    LEFT JOIN users leader ON gp.team_leader_id = leader.user_id
    LEFT JOIN project_members pm ON gp.project_id = pm.project_id AND pm.is_active = true
    WHERE (class_subject_id_param IS NULL OR gp.class_subject_id = class_subject_id_param)
      AND (status_param IS NULL OR gp.status = status_param)
      AND (
        user_id_param IS NULL 
        OR gp.team_leader_id = user_id_param
        OR EXISTS (
          SELECT 1 FROM project_members pm2 
          WHERE pm2.project_id = gp.project_id 
            AND pm2.user_id = user_id_param 
            AND pm2.is_active = true
        )
      )
    GROUP BY gp.project_id, leader.name
    ORDER BY gp.due_date DESC, gp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Get Project Tasks
-- ============================================
CREATE OR REPLACE FUNCTION get_project_tasks(
    project_id_param BIGINT,
    assigned_to_param BIGINT DEFAULT NULL,
    status_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    task_id BIGINT,
    title VARCHAR,
    description TEXT,
    assigned_to BIGINT,
    assigned_to_name VARCHAR,
    status VARCHAR,
    priority VARCHAR,
    due_date TIMESTAMP,
    progress_percentage INTEGER,
    created_by_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.task_id,
        pt.title,
        pt.description,
        pt.assigned_to,
        assignee.name as assigned_to_name,
        pt.status,
        pt.priority,
        pt.due_date,
        pt.progress_percentage,
        creator.name as created_by_name
    FROM project_tasks pt
    LEFT JOIN users assignee ON pt.assigned_to = assignee.user_id
    LEFT JOIN users creator ON pt.created_by = creator.user_id
    WHERE pt.project_id = project_id_param
      AND (assigned_to_param IS NULL OR pt.assigned_to = assigned_to_param)
      AND (status_param IS NULL OR pt.status = status_param)
    ORDER BY 
        CASE pt.priority
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
        END,
        pt.due_date NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Update Project Progress
-- ============================================
CREATE OR REPLACE FUNCTION update_project_progress(project_id_param BIGINT)
RETURNS INTEGER AS $$
DECLARE
    calculated_progress INTEGER;
BEGIN
    -- Calculate progress based on completed tasks
    SELECT COALESCE(
        ROUND(
            AVG(CASE 
                WHEN status = 'COMPLETED' THEN 100
                WHEN status = 'IN_REVIEW' THEN 75
                WHEN status = 'IN_PROGRESS' THEN 50
                WHEN status = 'BLOCKED' THEN 25
                ELSE 0
            END)
        ),
        0
    )::INTEGER
    INTO calculated_progress
    FROM project_tasks
    WHERE project_id = project_id_param;
    
    -- Update project progress
    UPDATE group_projects
    SET progress_percentage = calculated_progress,
        updated_at = CURRENT_TIMESTAMP
    WHERE project_id = project_id_param;
    
    RETURN calculated_progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_active_sessions IS 'Returns active collaboration sessions with participant counts';
COMMENT ON FUNCTION get_session_participants IS 'Returns all participants in a session';
COMMENT ON FUNCTION join_session IS 'Adds a user to a collaboration session';
COMMENT ON FUNCTION leave_session IS 'Removes a user from a collaboration session';
COMMENT ON FUNCTION get_document_with_changes IS 'Returns document with change history';
COMMENT ON FUNCTION get_tutoring_sessions IS 'Returns tutoring/mentoring sessions';
COMMENT ON FUNCTION get_group_projects IS 'Returns group projects with member counts';
COMMENT ON FUNCTION get_project_tasks IS 'Returns tasks for a project';
COMMENT ON FUNCTION update_project_progress IS 'Updates project progress based on task completion';

