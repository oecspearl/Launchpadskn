-- Parent Portal: Create parent_student_links table
-- Enables many-to-many relationship between parent and student users

CREATE TABLE IF NOT EXISTS parent_student_links (
    link_id BIGSERIAL PRIMARY KEY,
    parent_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL DEFAULT 'PARENT',
    is_primary_contact BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    linked_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_user_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_active ON parent_student_links(is_active);

COMMENT ON TABLE parent_student_links IS 'Links parent/guardian users to their student children';
COMMENT ON COLUMN parent_student_links.relationship IS 'PARENT, GUARDIAN, GRANDPARENT, OTHER';
