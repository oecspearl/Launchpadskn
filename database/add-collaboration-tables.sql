-- LaunchPad SKN - Real-Time Collaboration System
-- Tables for collaborative documents, virtual classrooms, whiteboards, tutoring, and group projects

-- ============================================
-- 1. COLLABORATION SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    session_type VARCHAR(50) NOT NULL, -- DOCUMENT, CLASSROOM, WHITEBOARD, TUTORING, PROJECT
    title VARCHAR(200) NOT NULL,
    description TEXT,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    
    -- Session Settings
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 50,
    allow_anonymous BOOLEAN DEFAULT false,
    
    -- Timing
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Settings
    settings JSONB, -- Flexible settings per session type
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_type ON collaboration_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_class_subject ON collaboration_sessions(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON collaboration_sessions(is_active);

-- ============================================
-- 2. SESSION PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_participants (
    participant_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id),
    participant_name VARCHAR(200), -- For anonymous users
    role VARCHAR(50) DEFAULT 'PARTICIPANT', -- OWNER, MODERATOR, PARTICIPANT, OBSERVER
    
    -- Status
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Permissions
    can_edit BOOLEAN DEFAULT true,
    can_share BOOLEAN DEFAULT false,
    can_moderate BOOLEAN DEFAULT false,
    
    -- Video/Audio
    video_enabled BOOLEAN DEFAULT false,
    audio_enabled BOOLEAN DEFAULT false,
    screen_sharing BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB,
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON collaboration_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON collaboration_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_active ON collaboration_participants(is_active);

-- ============================================
-- 3. COLLABORATIVE DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS collaborative_documents (
    document_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT, -- Initial content or snapshot
    content_type VARCHAR(50) DEFAULT 'TEXT', -- TEXT, RICH_TEXT, CODE, MARKDOWN
    
    -- Version Control
    version INTEGER DEFAULT 1,
    last_edited_by BIGINT REFERENCES users(user_id),
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Collaboration
    is_editable BOOLEAN DEFAULT true,
    allow_comments BOOLEAN DEFAULT true,
    allow_suggestions BOOLEAN DEFAULT true,
    
    -- Real-time State (for operational transforms)
    operational_transform_state JSONB, -- Yjs, ShareJS, or similar state
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_session ON collaborative_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON collaborative_documents(content_type);

-- ============================================
-- 4. DOCUMENT CHANGES (Change Log)
-- ============================================
CREATE TABLE IF NOT EXISTS document_changes (
    change_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES collaborative_documents(document_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id),
    change_type VARCHAR(50), -- INSERT, DELETE, FORMAT, MOVE
    position INTEGER, -- Character position or range
    content TEXT, -- Changed content
    change_data JSONB, -- Full change details for operational transform
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER
);

CREATE INDEX IF NOT EXISTS idx_changes_document ON document_changes(document_id);
CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON document_changes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_changes_user ON document_changes(user_id);

-- ============================================
-- 5. DOCUMENT COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS document_comments (
    comment_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES collaborative_documents(document_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id),
    position INTEGER, -- Character position in document
    content TEXT NOT NULL,
    
    -- Threading
    parent_comment_id BIGINT REFERENCES document_comments(comment_id),
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_by BIGINT REFERENCES users(user_id),
    resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON document_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON document_comments(is_resolved);

-- ============================================
-- 6. VIRTUAL CLASSROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS virtual_classrooms (
    classroom_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    
    -- Video Conferencing
    video_provider VARCHAR(50) DEFAULT 'JITSI', -- JITSI, ZOOM, CUSTOM_WEBRTC
    meeting_url TEXT,
    meeting_id VARCHAR(200),
    meeting_password VARCHAR(100),
    
    -- Settings
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    chat_enabled BOOLEAN DEFAULT true,
    raise_hand_enabled BOOLEAN DEFAULT true,
    polls_enabled BOOLEAN DEFAULT true,
    
    -- Breakout Rooms
    breakout_rooms_enabled BOOLEAN DEFAULT false,
    max_breakout_rooms INTEGER DEFAULT 10,
    
    -- Status
    is_live BOOLEAN DEFAULT false,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classrooms_session ON virtual_classrooms(session_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_live ON virtual_classrooms(is_live);

-- ============================================
-- 7. BREAKOUT ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS breakout_rooms (
    room_id BIGSERIAL PRIMARY KEY,
    classroom_id BIGINT NOT NULL REFERENCES virtual_classrooms(classroom_id) ON DELETE CASCADE,
    room_name VARCHAR(200) NOT NULL,
    room_number INTEGER,
    
    -- Settings
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_breakout_classroom ON breakout_rooms(classroom_id);
CREATE INDEX IF NOT EXISTS idx_breakout_active ON breakout_rooms(is_active);

-- ============================================
-- 8. BREAKOUT ROOM PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS breakout_room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES breakout_rooms(room_id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES collaboration_participants(participant_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    UNIQUE(room_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_breakout_participants_room ON breakout_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_breakout_participants_participant ON breakout_room_participants(participant_id);

-- ============================================
-- 9. COLLABORATIVE WHITEBOARDS
-- ============================================
CREATE TABLE IF NOT EXISTS collaborative_whiteboards (
    whiteboard_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    
    -- Canvas State
    canvas_data JSONB, -- Full canvas state (shapes, drawings, text, etc.)
    canvas_version INTEGER DEFAULT 1,
    
    -- Settings
    background_color VARCHAR(20) DEFAULT '#FFFFFF',
    grid_enabled BOOLEAN DEFAULT false,
    snap_to_grid BOOLEAN DEFAULT false,
    
    -- Tools
    available_tools JSONB, -- Array of available tools
    
    -- Metadata
    last_edited_by BIGINT REFERENCES users(user_id),
    last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_session ON collaborative_whiteboards(session_id);

-- ============================================
-- 10. WHITEBOARD ELEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS whiteboard_elements (
    element_id BIGSERIAL PRIMARY KEY,
    whiteboard_id BIGINT NOT NULL REFERENCES collaborative_whiteboards(whiteboard_id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL, -- SHAPE, TEXT, DRAWING, IMAGE, STICKY_NOTE
    element_data JSONB NOT NULL, -- Element properties (position, size, color, etc.)
    
    -- Version Control
    version INTEGER DEFAULT 1,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_elements_whiteboard ON whiteboard_elements(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_elements_type ON whiteboard_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_elements_deleted ON whiteboard_elements(deleted_at);

-- ============================================
-- 11. TUTORING/MENTORING SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tutoring_sessions (
    tutoring_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    
    -- Participants
    tutor_id BIGINT NOT NULL REFERENCES users(user_id),
    student_id BIGINT NOT NULL REFERENCES users(user_id),
    
    -- Subject/Topic
    subject_id BIGINT REFERENCES subjects(subject_id),
    topic VARCHAR(200),
    learning_objectives TEXT,
    
    -- Session Details
    session_type VARCHAR(50) DEFAULT 'TUTORING', -- TUTORING, MENTORING, PEER_STUDY
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    cancellation_reason TEXT,
    
    -- Feedback
    tutor_feedback TEXT,
    student_feedback TEXT,
    tutor_rating INTEGER CHECK (tutor_rating BETWEEN 1 AND 5),
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    
    -- Resources
    resources_used JSONB, -- Array of resources used during session
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_session ON tutoring_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_tutor ON tutoring_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_student ON tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_status ON tutoring_sessions(status);

-- ============================================
-- 12. GROUP PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS group_projects (
    project_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES collaboration_sessions(session_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Project Details
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    project_type VARCHAR(50), -- ASSIGNMENT, PRESENTATION, RESEARCH, PORTFOLIO
    due_date TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, IN_PROGRESS, REVIEW, COMPLETED, SUBMITTED
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Team
    team_leader_id BIGINT REFERENCES users(user_id),
    max_team_size INTEGER DEFAULT 5,
    
    -- Resources
    resources JSONB, -- Array of resource links/files
    deliverables JSONB, -- Array of deliverables
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_session ON group_projects(session_id);
CREATE INDEX IF NOT EXISTS idx_projects_class_subject ON group_projects(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON group_projects(status);

-- ============================================
-- 13. PROJECT TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS project_tasks (
    task_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES group_projects(project_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Assignment
    assigned_to BIGINT REFERENCES users(user_id),
    created_by BIGINT REFERENCES users(user_id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'TODO', -- TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Dates
    due_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Progress
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Dependencies
    depends_on_task_id BIGINT REFERENCES project_tasks(task_id),
    
    -- Metadata
    tags JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON project_tasks(priority);

-- ============================================
-- 14. PROJECT MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES group_projects(project_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    role VARCHAR(50) DEFAULT 'MEMBER', -- LEADER, MEMBER, OBSERVER
    
    -- Contribution
    tasks_completed INTEGER DEFAULT 0,
    hours_contributed DECIMAL(5,2) DEFAULT 0.00,
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_active ON project_members(is_active);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE collaboration_sessions IS 'Main table for all collaboration sessions';
COMMENT ON TABLE collaboration_participants IS 'Participants in collaboration sessions';
COMMENT ON TABLE collaborative_documents IS 'Collaborative documents with real-time editing';
COMMENT ON TABLE document_changes IS 'Change log for document operational transforms';
COMMENT ON TABLE document_comments IS 'Comments and annotations on documents';
COMMENT ON TABLE virtual_classrooms IS 'Virtual classroom sessions with video conferencing';
COMMENT ON TABLE breakout_rooms IS 'Breakout rooms within virtual classrooms';
COMMENT ON TABLE collaborative_whiteboards IS 'Shared digital whiteboards';
COMMENT ON TABLE whiteboard_elements IS 'Individual elements on whiteboards';
COMMENT ON TABLE tutoring_sessions IS 'Peer-to-peer tutoring and mentoring sessions';
COMMENT ON TABLE group_projects IS 'Group project workspaces';
COMMENT ON TABLE project_tasks IS 'Tasks within group projects';
COMMENT ON TABLE project_members IS 'Members of group projects';

