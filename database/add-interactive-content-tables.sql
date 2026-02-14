-- LaunchPad SKN - Advanced Interactive Content System
-- Tables for adaptive learning, gamification, social learning, virtual labs, and AR/VR

-- ============================================
-- 1. ADAPTIVE LEARNING PATHS
-- ============================================
CREATE TABLE IF NOT EXISTS adaptive_learning_paths (
    path_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Path Configuration
    path_name VARCHAR(200) NOT NULL,
    path_type VARCHAR(50) DEFAULT 'PERFORMANCE_BASED', -- PERFORMANCE_BASED, INTEREST_BASED, MIXED
    current_stage INTEGER DEFAULT 1,
    total_stages INTEGER DEFAULT 1,
    
    -- Performance Tracking
    overall_progress DECIMAL(5,2) DEFAULT 0.00 CHECK (overall_progress BETWEEN 0 AND 100),
    average_performance DECIMAL(5,2) DEFAULT 0.00,
    mastery_level VARCHAR(50) DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    
    -- Adaptive Rules
    adaptation_rules JSONB, -- Rules for path adjustments
    difficulty_level VARCHAR(20) DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD, EXPERT
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_paths_student ON adaptive_learning_paths(student_id);
CREATE INDEX IF NOT EXISTS idx_paths_class_subject ON adaptive_learning_paths(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_paths_active ON adaptive_learning_paths(is_active);

-- ============================================
-- 2. LEARNING PATH STAGES
-- ============================================
CREATE TABLE IF NOT EXISTS learning_path_stages (
    stage_id BIGSERIAL PRIMARY KEY,
    path_id BIGINT NOT NULL REFERENCES adaptive_learning_paths(path_id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL,
    
    -- Stage Content
    stage_name VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50), -- LESSON, QUIZ, ASSIGNMENT, PROJECT, SIMULATION
    content_id BIGINT, -- Reference to lesson, quiz, etc.
    
    -- Prerequisites
    prerequisites JSONB, -- Array of required stage IDs or competencies
    required_score DECIMAL(5,2), -- Minimum score to proceed
    
    -- Adaptive Properties
    difficulty_adjustment VARCHAR(20), -- EASIER, SAME, HARDER
    alternative_content JSONB, -- Alternative content if student struggles
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    
    -- Timing
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(path_id, stage_number)
);

CREATE INDEX IF NOT EXISTS idx_stages_path ON learning_path_stages(path_id);
CREATE INDEX IF NOT EXISTS idx_stages_completed ON learning_path_stages(is_completed);

-- ============================================
-- 3. GAMIFICATION SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS student_gamification (
    gamification_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Points
    total_points INTEGER DEFAULT 0,
    current_points INTEGER DEFAULT 0,
    points_this_week INTEGER DEFAULT 0,
    points_this_month INTEGER DEFAULT 0,
    
    -- Level System
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    experience_to_next_level INTEGER DEFAULT 100,
    
    -- Streaks
    current_streak INTEGER DEFAULT 0, -- Days of consecutive activity
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    -- Statistics
    lessons_completed INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    assignments_submitted INTEGER DEFAULT 0,
    perfect_scores INTEGER DEFAULT 0,
    
    -- Rankings
    class_rank INTEGER,
    school_rank INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_gamification_student ON student_gamification(student_id);
CREATE INDEX IF NOT EXISTS idx_gamification_class_subject ON student_gamification(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points ON student_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON student_gamification(current_level DESC);

-- ============================================
-- 4. BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
    badge_id BIGSERIAL PRIMARY KEY,
    badge_code VARCHAR(100) UNIQUE NOT NULL,
    badge_name VARCHAR(200) NOT NULL,
    description TEXT,
    badge_type VARCHAR(50), -- ACHIEVEMENT, MILESTONE, SPECIAL, EVENT
    category VARCHAR(50), -- ACADEMIC, SOCIAL, CREATIVITY, LEADERSHIP
    
    -- Visual
    icon_url TEXT,
    icon_color VARCHAR(20),
    rarity VARCHAR(20) DEFAULT 'COMMON', -- COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
    
    -- Requirements
    requirements JSONB, -- Criteria for earning badge
    points_reward INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active);

-- ============================================
-- 5. STUDENT BADGES (Earned)
-- ============================================
CREATE TABLE IF NOT EXISTS student_badges (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Earning Details
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    earned_for VARCHAR(200), -- What they did to earn it
    points_earned INTEGER DEFAULT 0,
    
    -- Display
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER,
    
    UNIQUE(student_id, badge_id, class_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_earned ON student_badges(earned_at DESC);

-- ============================================
-- 6. LEADERBOARDS
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboards (
    leaderboard_id BIGSERIAL PRIMARY KEY,
    leaderboard_name VARCHAR(200) NOT NULL,
    leaderboard_type VARCHAR(50) NOT NULL, -- CLASS, SCHOOL, GLOBAL, SUBJECT, WEEKLY, MONTHLY
    scope_id BIGINT, -- class_id, subject_id, etc. depending on type
    
    -- Time Period
    period_type VARCHAR(20), -- DAILY, WEEKLY, MONTHLY, YEARLY, ALL_TIME
    period_start DATE,
    period_end DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    display_public BOOLEAN DEFAULT true,
    
    -- Settings
    ranking_criteria VARCHAR(50) DEFAULT 'POINTS', -- POINTS, LEVEL, STREAK, PERFECT_SCORES
    max_rankings INTEGER DEFAULT 100,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_active ON leaderboards(is_active);

-- ============================================
-- 7. LEADERBOARD ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    entry_id BIGSERIAL PRIMARY KEY,
    leaderboard_id BIGINT NOT NULL REFERENCES leaderboards(leaderboard_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Ranking
    rank_position INTEGER NOT NULL,
    score INTEGER NOT NULL, -- Points, level, etc.
    
    -- Additional Metrics
    additional_metrics JSONB,
    
    -- Timestamp
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leaderboard_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_entries_student ON leaderboard_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_entries_rank ON leaderboard_entries(rank_position);

-- ============================================
-- 8. ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id BIGSERIAL PRIMARY KEY,
    achievement_code VARCHAR(100) UNIQUE NOT NULL,
    achievement_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- ACADEMIC, SOCIAL, MILESTONE, SPECIAL
    
    -- Requirements
    requirements JSONB NOT NULL, -- Criteria for unlocking
    points_reward INTEGER DEFAULT 0,
    badge_id BIGINT REFERENCES badges(badge_id),
    
    -- Progress Tracking
    is_trackable BOOLEAN DEFAULT true,
    progress_type VARCHAR(50), -- COUNT, PERCENTAGE, SCORE, TIME
    
    -- Visual
    icon_url TEXT,
    unlocked_message TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- ============================================
-- 9. STUDENT ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS student_achievements (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id BIGINT NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    
    -- Progress
    progress_value INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP,
    
    -- Context
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, achievement_id, class_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement ON student_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_unlocked ON student_achievements(is_unlocked);

-- ============================================
-- 10. DISCUSSION FORUMS
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_forums (
    forum_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    forum_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Settings
    is_public BOOLEAN DEFAULT false,
    allow_anonymous BOOLEAN DEFAULT false,
    moderation_enabled BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    
    -- Statistics
    total_topics INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forums_class_subject ON discussion_forums(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_forums_public ON discussion_forums(is_public);

-- ============================================
-- 11. FORUM TOPICS
-- ============================================
CREATE TABLE IF NOT EXISTS forum_topics (
    topic_id BIGSERIAL PRIMARY KEY,
    forum_id BIGINT NOT NULL REFERENCES discussion_forums(forum_id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    
    -- Topic Details
    topic_title VARCHAR(300) NOT NULL,
    topic_content TEXT NOT NULL,
    topic_type VARCHAR(50) DEFAULT 'DISCUSSION', -- DISCUSSION, QUESTION, ANNOUNCEMENT, POLL
    
    -- Status
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Poll (if topic_type is POLL)
    poll_options JSONB,
    poll_votes JSONB,
    
    -- Last Activity
    last_reply_at TIMESTAMP,
    last_reply_by BIGINT REFERENCES users(user_id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_forum ON forum_topics(forum_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_by ON forum_topics(created_by);
CREATE INDEX IF NOT EXISTS idx_topics_pinned ON forum_topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_topics_last_reply ON forum_topics(last_reply_at DESC);

-- ============================================
-- 12. FORUM POSTS (Replies)
-- ============================================
CREATE TABLE IF NOT EXISTS forum_posts (
    post_id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES forum_topics(topic_id) ON DELETE CASCADE,
    parent_post_id BIGINT REFERENCES forum_posts(post_id), -- For nested replies
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    
    -- Content
    post_content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    
    -- Status
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Best Answer (for Q&A forums)
    is_best_answer BOOLEAN DEFAULT false,
    marked_best_by BIGINT REFERENCES users(user_id),
    marked_best_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_topic ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON forum_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON forum_posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON forum_posts(created_at DESC);

-- ============================================
-- 13. PEER REVIEW ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS peer_review_assignments (
    review_assignment_id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES subject_assessments(assessment_id),
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Review Configuration
    review_name VARCHAR(200) NOT NULL,
    review_type VARCHAR(50) DEFAULT 'PEER', -- PEER, SELF, INSTRUCTOR
    min_reviews_per_submission INTEGER DEFAULT 2,
    max_reviews_per_submission INTEGER DEFAULT 3,
    
    -- Criteria
    review_criteria JSONB, -- Array of criteria with weights
    rubric JSONB, -- Detailed rubric
    
    -- Timing
    submission_deadline TIMESTAMP,
    review_deadline TIMESTAMP,
    results_release_date TIMESTAMP,
    
    -- Settings
    anonymous_reviews BOOLEAN DEFAULT true,
    allow_rebuttal BOOLEAN DEFAULT false,
    auto_assign BOOLEAN DEFAULT true,
    
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_class_subject ON peer_review_assignments(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_deadline ON peer_review_assignments(review_deadline);

-- ============================================
-- 14. PEER REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS peer_reviews (
    review_id BIGSERIAL PRIMARY KEY,
    review_assignment_id BIGINT NOT NULL REFERENCES peer_review_assignments(review_assignment_id) ON DELETE CASCADE,
    submission_id BIGINT, -- Reference to student submission
    reviewer_id BIGINT NOT NULL REFERENCES users(user_id),
    reviewee_id BIGINT NOT NULL REFERENCES users(user_id),
    
    -- Review Content
    review_content TEXT,
    scores JSONB, -- Scores for each criterion
    overall_score DECIMAL(5,2),
    feedback TEXT,
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    is_submitted BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP,
    
    -- Quality Check
    is_helpful BOOLEAN, -- Reviewee's feedback on review quality
    helpful_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_assignment_id, submission_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_assignment ON peer_reviews(review_assignment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON peer_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON peer_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_completed ON peer_reviews(is_completed);

-- ============================================
-- 15. VIRTUAL LABS/SIMULATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS virtual_labs (
    lab_id BIGSERIAL PRIMARY KEY,
    lab_name VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(subject_id),
    
    -- Lab Type
    lab_type VARCHAR(50) NOT NULL, -- SCIENCE, MATH, CHEMISTRY, PHYSICS, BIOLOGY
    simulation_type VARCHAR(50), -- INTERACTIVE, ANIMATION, 3D_MODEL, VR
    
    -- Content
    lab_content JSONB, -- Lab configuration, parameters, etc.
    initial_state JSONB, -- Starting state of simulation
    learning_objectives TEXT,
    
    -- Settings
    is_interactive BOOLEAN DEFAULT true,
    allow_reset BOOLEAN DEFAULT true,
    time_limit_minutes INTEGER,
    
    -- Resources
    instructions_url TEXT,
    video_url TEXT,
    model_url TEXT, -- 3D model or simulation file
    
    -- Metadata
    difficulty_level VARCHAR(20),
    estimated_duration_minutes INTEGER,
    
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labs_subject ON virtual_labs(subject_id);
CREATE INDEX IF NOT EXISTS idx_labs_type ON virtual_labs(lab_type);

-- ============================================
-- 16. LAB SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS lab_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    lab_id BIGINT NOT NULL REFERENCES virtual_labs(lab_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Session State
    session_state JSONB, -- Current state of the lab session
    actions_log JSONB, -- Log of all actions taken
    
    -- Progress
    is_completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    score DECIMAL(5,2),
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Results
    results JSONB, -- Lab results, measurements, observations
    observations TEXT,
    conclusions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_sessions_lab ON lab_sessions(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_student ON lab_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_lab_sessions_completed ON lab_sessions(is_completed);

-- ============================================
-- 17. AR/VR CONTENT
-- ============================================
CREATE TABLE IF NOT EXISTS arvr_content (
    content_id BIGSERIAL PRIMARY KEY,
    content_name VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- 3D_MODEL, AR_OVERLAY, VR_EXPERIENCE, FIELD_TRIP
    
    -- Subject/Class
    subject_id BIGINT REFERENCES subjects(subject_id),
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Content Details
    content_url TEXT, -- URL to 3D model, AR marker, VR scene
    model_format VARCHAR(50), -- GLTF, OBJ, FBX, USDZ, etc.
    platform VARCHAR(50), -- WEBXR, ARKIT, ARCORE, CUSTOM
    
    -- AR/VR Settings
    ar_marker_url TEXT, -- For AR marker-based content
    vr_scene_config JSONB, -- VR scene configuration
    interaction_mode VARCHAR(50), -- VIEW_ONLY, INTERACTIVE, GUIDED_TOUR
    
    -- 3D Model Properties
    model_properties JSONB, -- Scale, rotation, position, animations
    annotations JSONB, -- 3D annotations and labels
    
    -- Field Trip Specific
    location_name VARCHAR(200),
    location_coordinates JSONB, -- Latitude, longitude for location-based AR
    virtual_tour_url TEXT,
    
    -- Metadata
    difficulty_level VARCHAR(20),
    estimated_duration_minutes INTEGER,
    learning_objectives TEXT,
    
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arvr_subject ON arvr_content(subject_id);
CREATE INDEX IF NOT EXISTS idx_arvr_type ON arvr_content(content_type);
CREATE INDEX IF NOT EXISTS idx_arvr_class_subject ON arvr_content(class_subject_id);

-- ============================================
-- 18. AR/VR SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS arvr_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES arvr_content(content_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Session State
    session_state JSONB, -- Current state, camera position, etc.
    interactions_log JSONB, -- Log of interactions
    
    -- Progress
    is_completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INTEGER DEFAULT 0,
    
    -- Observations
    observations TEXT,
    notes TEXT,
    screenshots JSONB, -- Array of screenshot URLs
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arvr_sessions_content ON arvr_sessions(content_id);
CREATE INDEX IF NOT EXISTS idx_arvr_sessions_student ON arvr_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_arvr_sessions_completed ON arvr_sessions(is_completed);

-- ============================================
-- 19. POINTS TRANSACTIONS (Gamification)
-- ============================================
CREATE TABLE IF NOT EXISTS points_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    
    -- Transaction Details
    points_amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- LESSON_COMPLETE, QUIZ_PASS, ASSIGNMENT_SUBMIT, BADGE_EARNED, ACHIEVEMENT, BONUS
    source_type VARCHAR(50), -- LESSON, QUIZ, ASSIGNMENT, BADGE, ACHIEVEMENT, etc.
    source_id BIGINT, -- ID of the source (lesson_id, quiz_id, etc.)
    
    -- Description
    description TEXT,
    reason TEXT,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_student ON points_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON points_transactions(created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE adaptive_learning_paths IS 'Personalized learning paths that adapt based on student performance';
COMMENT ON TABLE learning_path_stages IS 'Individual stages within a learning path';
COMMENT ON TABLE student_gamification IS 'Gamification data for students (points, levels, streaks)';
COMMENT ON TABLE badges IS 'Available badges that students can earn';
COMMENT ON TABLE student_badges IS 'Badges earned by students';
COMMENT ON TABLE leaderboards IS 'Leaderboard configurations';
COMMENT ON TABLE leaderboard_entries IS 'Student entries in leaderboards';
COMMENT ON TABLE achievements IS 'Achievement definitions';
COMMENT ON TABLE student_achievements IS 'Student achievement progress and unlocks';
COMMENT ON TABLE discussion_forums IS 'Discussion forums for social learning';
COMMENT ON TABLE forum_topics IS 'Topics/threads in discussion forums';
COMMENT ON TABLE forum_posts IS 'Posts/replies in forum topics';
COMMENT ON TABLE peer_review_assignments IS 'Peer review assignment configurations';
COMMENT ON TABLE peer_reviews IS 'Individual peer reviews';
COMMENT ON TABLE virtual_labs IS 'Virtual lab and simulation definitions';
COMMENT ON TABLE lab_sessions IS 'Student lab session records';
COMMENT ON TABLE arvr_content IS 'AR/VR content including 3D models and virtual field trips';
COMMENT ON TABLE arvr_sessions IS 'Student AR/VR session records';
COMMENT ON TABLE points_transactions IS 'History of points earned/spent by students';

