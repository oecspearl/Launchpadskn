-- ============================================
-- CONTENT LIBRARY SYSTEM
-- Allows teachers to share and reuse content across lessons
-- ============================================

-- Main content library table
CREATE TABLE IF NOT EXISTS content_library (
    library_id BIGSERIAL PRIMARY KEY,
    
    -- Content details (copied from lesson_content)
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Enhanced content fields
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
    content_data JSONB, -- For interactive content (flashcards, quizzes, etc.)
    metadata JSONB, -- For 3D models, AR content, etc.
    prerequisite_content_ids BIGINT[], -- Array of library_id references
    
    -- Assignment-specific fields
    assignment_details_file_path TEXT,
    assignment_details_file_name VARCHAR(255),
    assignment_details_file_size BIGINT,
    assignment_details_mime_type VARCHAR(100),
    assignment_rubric_file_path TEXT,
    assignment_rubric_file_name VARCHAR(255),
    assignment_rubric_file_size BIGINT,
    assignment_rubric_mime_type VARCHAR(100),
    
    -- Library-specific metadata
    original_content_id BIGINT REFERENCES lesson_content(content_id) ON DELETE SET NULL,
    shared_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(subject_id) ON DELETE SET NULL,
    form_id BIGINT REFERENCES forms(form_id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags for searchability
    is_public BOOLEAN DEFAULT true, -- Public to all teachers or private to institution
    is_featured BOOLEAN DEFAULT false, -- Featured content shown first
    is_verified BOOLEAN DEFAULT false, -- Verified by admin
    
    -- Statistics
    view_count INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0, -- How many times it's been added to lessons
    rating_average DECIMAL(3,2) DEFAULT 0.00, -- Average rating (0-5)
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DELETED
    version INTEGER DEFAULT 1, -- For versioning
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_library_shared_by ON content_library(shared_by);
CREATE INDEX IF NOT EXISTS idx_library_subject ON content_library(subject_id);
CREATE INDEX IF NOT EXISTS idx_library_form ON content_library(form_id);
CREATE INDEX IF NOT EXISTS idx_library_status ON content_library(status);
CREATE INDEX IF NOT EXISTS idx_library_public ON content_library(is_public);
CREATE INDEX IF NOT EXISTS idx_library_featured ON content_library(is_featured);
CREATE INDEX IF NOT EXISTS idx_library_tags ON content_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_library_rating ON content_library(rating_average DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_library_use_count ON content_library(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_library_search ON content_library USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Content ratings and reviews
CREATE TABLE IF NOT EXISTS content_library_ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT NOT NULL REFERENCES content_library(library_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_helpful_count INTEGER DEFAULT 0, -- How many found this review helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_library_rating UNIQUE(library_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_library ON content_library_ratings(library_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON content_library_ratings(user_id);

-- Track content usage (when teachers add library content to lessons)
CREATE TABLE IF NOT EXISTS content_library_usage (
    usage_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT NOT NULL REFERENCES content_library(library_id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    content_id BIGINT REFERENCES lesson_content(content_id) ON DELETE SET NULL, -- The created lesson_content
    used_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_library ON content_library_usage(library_id);
CREATE INDEX IF NOT EXISTS idx_usage_lesson ON content_library_usage(lesson_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON content_library_usage(used_by);

-- Content library favorites (teachers can bookmark content)
CREATE TABLE IF NOT EXISTS content_library_favorites (
    favorite_id BIGSERIAL PRIMARY KEY,
    library_id BIGINT NOT NULL REFERENCES content_library(library_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_library_favorite UNIQUE(library_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_library ON content_library_favorites(library_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON content_library_favorites(user_id);

-- Function to update rating statistics when a rating is added/updated
CREATE OR REPLACE FUNCTION update_content_library_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE content_library
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
            FROM content_library_ratings
            WHERE library_id = COALESCE(NEW.library_id, OLD.library_id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM content_library_ratings
            WHERE library_id = COALESCE(NEW.library_id, OLD.library_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE library_id = COALESCE(NEW.library_id, OLD.library_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
DROP TRIGGER IF EXISTS trigger_update_library_ratings ON content_library_ratings;
CREATE TRIGGER trigger_update_library_ratings
    AFTER INSERT OR UPDATE OR DELETE ON content_library_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_content_library_ratings();

-- Function to update use_count when content is used
CREATE OR REPLACE FUNCTION update_content_library_use_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE content_library
    SET 
        use_count = use_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE library_id = NEW.library_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update use_count
DROP TRIGGER IF EXISTS trigger_update_library_use_count ON content_library_usage;
CREATE TRIGGER trigger_update_library_use_count
    AFTER INSERT ON content_library_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_content_library_use_count();

-- Function to update view_count
CREATE OR REPLACE FUNCTION increment_library_view_count(library_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE content_library
    SET view_count = view_count + 1
    WHERE library_id = library_id_param;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE content_library IS 'Shared content library for teachers to reuse content across lessons';
COMMENT ON TABLE content_library_ratings IS 'Ratings and reviews for library content';
COMMENT ON TABLE content_library_usage IS 'Tracks when library content is used in lessons';
COMMENT ON TABLE content_library_favorites IS 'Teacher favorites/bookmarks for library content';

