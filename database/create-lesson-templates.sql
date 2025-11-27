-- ============================================
-- LESSON TEMPLATES SYSTEM
-- Allows teachers to save and reuse complete lesson structures
-- ============================================

-- Main lesson templates table
CREATE TABLE IF NOT EXISTS lesson_templates (
    template_id BIGSERIAL PRIMARY KEY,
    
    -- Template metadata
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(subject_id) ON DELETE SET NULL,
    form_id BIGINT REFERENCES forms(form_id) ON DELETE SET NULL,
    topic VARCHAR(200),
    
    -- Lesson structure (copied from lessons table)
    lesson_title VARCHAR(200),
    learning_objectives TEXT,
    lesson_plan TEXT,
    homework_description TEXT,
    
    -- Template settings
    estimated_duration INTEGER, -- in minutes
    content_count INTEGER DEFAULT 0, -- number of content items
    
    -- Sharing and visibility
    created_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[], -- Array of tags for searchability
    
    -- Statistics
    use_count INTEGER DEFAULT 0, -- How many times it's been used
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DELETED
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Template content items (stores the structure of content, not actual files)
CREATE TABLE IF NOT EXISTS lesson_template_content (
    template_content_id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    
    -- Content structure (references to content_library or structure only)
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url TEXT,
    
    -- Content metadata (for reference, not actual files)
    library_content_id BIGINT REFERENCES content_library(library_id) ON DELETE SET NULL, -- If from library
    original_content_id BIGINT, -- Reference to original lesson_content if copied
    
    -- Content structure fields
    instructions TEXT,
    learning_outcomes TEXT,
    learning_activities TEXT,
    key_concepts TEXT,
    reflection_questions TEXT,
    discussion_prompts TEXT,
    summary TEXT,
    content_section VARCHAR(100),
    is_required BOOLEAN DEFAULT true,
    estimated_minutes INTEGER,
    sequence_order INTEGER DEFAULT 0,
    
    -- Content data (for interactive content)
    content_data JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template ratings and reviews
CREATE TABLE IF NOT EXISTS lesson_template_ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_template_rating UNIQUE(template_id, user_id)
);

-- Track template usage
CREATE TABLE IF NOT EXISTS lesson_template_usage (
    usage_id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    used_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template favorites
CREATE TABLE IF NOT EXISTS lesson_template_favorites (
    favorite_id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES lesson_templates(template_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_template_favorite UNIQUE(template_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON lesson_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_subject ON lesson_templates(subject_id);
CREATE INDEX IF NOT EXISTS idx_templates_form ON lesson_templates(form_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON lesson_templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_public ON lesson_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON lesson_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON lesson_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON lesson_templates(rating_average DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON lesson_templates(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_search ON lesson_templates USING GIN(to_tsvector('english', template_name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_template_content_template ON lesson_template_content(template_id);
CREATE INDEX IF NOT EXISTS idx_template_content_sequence ON lesson_template_content(template_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_template_content_library ON lesson_template_content(library_content_id);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON lesson_template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON lesson_template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_lesson ON lesson_template_usage(lesson_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_template ON lesson_template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON lesson_template_favorites(user_id);

-- Function to update template rating statistics
CREATE OR REPLACE FUNCTION update_lesson_template_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lesson_templates
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
            FROM lesson_template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM lesson_template_ratings
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE template_id = COALESCE(NEW.template_id, OLD.template_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
DROP TRIGGER IF EXISTS trigger_update_template_ratings ON lesson_template_ratings;
CREATE TRIGGER trigger_update_template_ratings
    AFTER INSERT OR UPDATE OR DELETE ON lesson_template_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_template_ratings();

-- Function to update use_count
CREATE OR REPLACE FUNCTION update_lesson_template_use_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lesson_templates
    SET 
        use_count = use_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE template_id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update use_count
DROP TRIGGER IF EXISTS trigger_update_template_use_count ON lesson_template_usage;
CREATE TRIGGER trigger_update_template_use_count
    AFTER INSERT ON lesson_template_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_template_use_count();

-- Function to update content_count
CREATE OR REPLACE FUNCTION update_template_content_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lesson_templates
        SET content_count = content_count + 1
        WHERE template_id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lesson_templates
        SET content_count = GREATEST(content_count - 1, 0)
        WHERE template_id = OLD.template_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update content_count
DROP TRIGGER IF EXISTS trigger_update_template_content_count ON lesson_template_content;
CREATE TRIGGER trigger_update_template_content_count
    AFTER INSERT OR DELETE ON lesson_template_content
    FOR EACH ROW
    EXECUTE FUNCTION update_template_content_count();

-- Function to increment view_count
CREATE OR REPLACE FUNCTION increment_template_view_count(template_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE lesson_templates
    SET view_count = view_count + 1
    WHERE template_id = template_id_param;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE lesson_templates IS 'Reusable lesson templates that teachers can save and share';
COMMENT ON TABLE lesson_template_content IS 'Content items structure for lesson templates';
COMMENT ON TABLE lesson_template_ratings IS 'Ratings and reviews for lesson templates';
COMMENT ON TABLE lesson_template_usage IS 'Tracks when templates are used to create lessons';
COMMENT ON TABLE lesson_template_favorites IS 'Teacher favorites/bookmarks for templates';

