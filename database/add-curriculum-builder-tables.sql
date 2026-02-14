-- LaunchPad SKN - Interactive Curriculum Builder Support
-- This script creates tables for resource library, templates, and collaborative editing

-- ============================================
-- 1. RESOURCE LIBRARY
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_resources (
    resource_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- 'VIDEO', 'LINK', 'GAME', 'WORKSHEET', 'DOCUMENT', 'ACTIVITY', 'ASSESSMENT'
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    tags TEXT[], -- Array of tags for searching
    subject_id BIGINT REFERENCES subjects(subject_id),
    form_id BIGINT REFERENCES forms(form_id),
    learning_outcomes TEXT[], -- Array of learning outcomes this resource supports
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false, -- Can be shared across institutions
    usage_count INTEGER DEFAULT 0, -- Track how often it's used
    rating DECIMAL(3,2) DEFAULT 0, -- Average rating (0-5)
    rating_count INTEGER DEFAULT 0
);

CREATE INDEX idx_resources_type ON curriculum_resources(resource_type);
CREATE INDEX idx_resources_subject ON curriculum_resources(subject_id);
CREATE INDEX idx_resources_tags ON curriculum_resources USING GIN(tags);
CREATE INDEX idx_resources_public ON curriculum_resources(is_public);

-- ============================================
-- 2. CURRICULUM TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_templates (
    template_id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(subject_id),
    form_id BIGINT REFERENCES forms(form_id),
    curriculum_structure JSONB NOT NULL, -- Full curriculum structure
    is_public BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[]
);

CREATE INDEX idx_templates_subject ON curriculum_templates(subject_id);
CREATE INDEX idx_templates_form ON curriculum_templates(form_id);
CREATE INDEX idx_templates_public ON curriculum_templates(is_public);
CREATE INDEX idx_templates_structure ON curriculum_templates USING GIN(curriculum_structure);

-- ============================================
-- 3. CURRICULUM RESOURCE LINKS
-- ============================================
-- Links resources to specific curriculum items (topics, units, SCOs)
CREATE TABLE IF NOT EXISTS curriculum_resource_links (
    link_id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES curriculum_resources(resource_id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL, -- 'TOPIC', 'UNIT', 'SCO', 'ACTIVITY'
    link_path TEXT NOT NULL, -- JSON path to the curriculum item (e.g., "topics[0].units[1]")
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(offering_id, resource_id, link_path)
);

CREATE INDEX idx_resource_links_offering ON curriculum_resource_links(offering_id);
CREATE INDEX idx_resource_links_resource ON curriculum_resource_links(resource_id);

-- ============================================
-- 4. COLLABORATIVE EDITING SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_editing_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    created_by BIGINT REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_offering ON curriculum_editing_sessions(offering_id);
CREATE INDEX idx_sessions_active ON curriculum_editing_sessions(is_active);

-- Active editors in a session
CREATE TABLE IF NOT EXISTS curriculum_session_editors (
    editor_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES curriculum_editing_sessions(session_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cursor_position TEXT, -- JSON path where user is currently editing
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_editors_session ON curriculum_session_editors(session_id);
CREATE INDEX idx_editors_user ON curriculum_session_editors(user_id);

-- ============================================
-- 5. CURRICULUM CHANGE HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_change_history (
    change_id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    changed_by BIGINT REFERENCES users(user_id),
    change_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'REORDER'
    change_path TEXT NOT NULL, -- JSON path to changed item
    old_value JSONB,
    new_value JSONB,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_offering ON curriculum_change_history(offering_id);
CREATE INDEX idx_history_user ON curriculum_change_history(changed_by);
CREATE INDEX idx_history_date ON curriculum_change_history(created_at DESC);

-- ============================================
-- 6. AI SUGGESTIONS CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_ai_suggestions (
    suggestion_id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT REFERENCES subject_form_offerings(offering_id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL, -- 'TOPIC', 'UNIT', 'SCO', 'ACTIVITY'
    context_path TEXT NOT NULL, -- JSON path to context
    learning_outcome TEXT,
    suggestion_type VARCHAR(50) NOT NULL, -- 'ACTIVITY', 'RESOURCE', 'ASSESSMENT'
    suggestion_data JSONB NOT NULL, -- The actual suggestion
    confidence_score DECIMAL(3,2), -- 0-1 confidence score
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP
);

CREATE INDEX idx_suggestions_offering ON curriculum_ai_suggestions(offering_id);
CREATE INDEX idx_suggestions_context ON curriculum_ai_suggestions(context_type, context_path);
CREATE INDEX idx_suggestions_used ON curriculum_ai_suggestions(used);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE curriculum_resources IS 'Reusable resources that can be linked to curriculum items';
COMMENT ON TABLE curriculum_templates IS 'Saved curriculum templates for reuse';
COMMENT ON TABLE curriculum_resource_links IS 'Links between resources and specific curriculum items';
COMMENT ON TABLE curriculum_editing_sessions IS 'Active collaborative editing sessions';
COMMENT ON TABLE curriculum_session_editors IS 'Users currently editing a curriculum';
COMMENT ON TABLE curriculum_change_history IS 'Audit trail of all curriculum changes';
COMMENT ON TABLE curriculum_ai_suggestions IS 'Cached AI-generated suggestions for curriculum items';

