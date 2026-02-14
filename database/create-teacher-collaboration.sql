-- ============================================
-- TEACHER COLLABORATION SYSTEM
-- Enables teachers to collaborate on content and lessons
-- ============================================

-- Content comments and discussions
CREATE TABLE IF NOT EXISTS content_comments (
    comment_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT REFERENCES content_library(library_id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES content_comments(comment_id) ON DELETE CASCADE, -- For replies
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false, -- For question/issue resolution
    is_helpful_count INTEGER DEFAULT 0, -- How many found this helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_library ON content_comments(library_id);
CREATE INDEX IF NOT EXISTS idx_comments_template ON content_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON content_comments(parent_comment_id);

-- Content requests (teachers can request specific content)
CREATE TABLE IF NOT EXISTS content_requests (
    request_id BIGSERIAL PRIMARY KEY,
    requested_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(subject_id) ON DELETE SET NULL,
    form_id BIGINT REFERENCES forms(form_id) ON DELETE SET NULL,
    request_title VARCHAR(200) NOT NULL,
    request_description TEXT NOT NULL,
    content_type VARCHAR(50), -- Preferred content type
    tags TEXT[], -- Suggested tags
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, FULFILLED, CLOSED
    fulfilled_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    fulfilled_content_id BIGINT REFERENCES content_library(library_id) ON DELETE SET NULL,
    fulfilled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON content_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_requests_status ON content_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_subject ON content_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_requests_form ON content_requests(form_id);

-- Content collaboration (when multiple teachers work on content)
CREATE TABLE IF NOT EXISTS content_collaboration (
    collaboration_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT REFERENCES content_library(library_id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    collaborator_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'EDITOR', -- VIEWER, EDITOR, CO_OWNER
    invited_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT unique_content_collaborator UNIQUE(library_id, collaborator_id),
    CONSTRAINT unique_template_collaborator UNIQUE(template_id, collaborator_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_library ON content_collaboration(library_id);
CREATE INDEX IF NOT EXISTS idx_collab_template ON content_collaboration(template_id);
CREATE INDEX IF NOT EXISTS idx_collab_user ON content_collaboration(collaborator_id);

-- Content suggestions (teachers can suggest improvements)
CREATE TABLE IF NOT EXISTS content_suggestions (
    suggestion_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT REFERENCES content_library(library_id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    suggested_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    suggestion_type VARCHAR(50), -- IMPROVEMENT, CORRECTION, ENHANCEMENT, TAG, etc.
    suggestion_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, IMPLEMENTED
    reviewed_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestions_library ON content_suggestions(library_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_template ON content_suggestions(template_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON content_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON content_suggestions(status);

-- Function to update comment updated_at
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment updates
DROP TRIGGER IF EXISTS trigger_update_comment_timestamp ON content_comments;
CREATE TRIGGER trigger_update_comment_timestamp
    BEFORE UPDATE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_timestamp();

-- Comments
COMMENT ON TABLE content_comments IS 'Comments and discussions on library content and templates';
COMMENT ON TABLE content_requests IS 'Teachers can request specific content to be created';
COMMENT ON TABLE content_collaboration IS 'Multi-teacher collaboration on content';
COMMENT ON TABLE content_suggestions IS 'Suggestions for improving content';

