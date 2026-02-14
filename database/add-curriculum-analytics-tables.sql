-- LaunchPad SKN - Curriculum Analytics Support
-- This script creates tables for tracking curriculum coverage, time allocation, and outcome achievement

-- ============================================
-- 1. CURRICULUM COVERAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_coverage (
    coverage_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    topic_number INTEGER, -- Topic number from curriculum structure
    topic_title VARCHAR(255),
    unit_number INTEGER, -- Unit number within topic
    sco_number VARCHAR(50), -- SCO number (e.g., "1.1", "2.3")
    sco_title TEXT, -- Specific Curriculum Outcome title
    status VARCHAR(50) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED
    coverage_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0-100
    first_taught_date DATE, -- When this SCO was first taught
    last_taught_date DATE, -- When this SCO was last taught
    lessons_count INTEGER DEFAULT 0, -- Number of lessons covering this SCO
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_subject_id, topic_number, unit_number, sco_number)
);

CREATE INDEX idx_coverage_class_subject ON curriculum_coverage(class_subject_id);
CREATE INDEX idx_coverage_status ON curriculum_coverage(status);
CREATE INDEX idx_coverage_topic ON curriculum_coverage(topic_number, unit_number);

-- ============================================
-- 2. TIME ALLOCATION TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_time_allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR(50),
    planned_hours DECIMAL(5,2) DEFAULT 0.00, -- Planned time in hours
    actual_hours DECIMAL(5,2) DEFAULT 0.00, -- Actual time spent in hours
    planned_minutes INTEGER DEFAULT 0, -- Planned time in minutes
    actual_minutes INTEGER DEFAULT 0, -- Actual time spent in minutes
    academic_year VARCHAR(20),
    term INTEGER, -- 1, 2, or 3
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_subject_id, topic_number, unit_number, sco_number, academic_year, term)
);

CREATE INDEX idx_allocation_class_subject ON curriculum_time_allocation(class_subject_id);
CREATE INDEX idx_allocation_year_term ON curriculum_time_allocation(academic_year, term);

-- ============================================
-- 3. OUTCOME ACHIEVEMENT TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_outcome_achievement (
    achievement_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR(50),
    achievement_status VARCHAR(50) DEFAULT 'NOT_ASSESSED', -- NOT_ASSESSED, DEVELOPING, ACHIEVED, EXCEEDED
    achievement_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0-100
    assessment_count INTEGER DEFAULT 0, -- Number of assessments for this SCO
    last_assessed_date DATE,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_subject_id, student_id, topic_number, unit_number, sco_number)
);

CREATE INDEX idx_achievement_class_subject ON curriculum_outcome_achievement(class_subject_id);
CREATE INDEX idx_achievement_student ON curriculum_outcome_achievement(student_id);
CREATE INDEX idx_achievement_status ON curriculum_outcome_achievement(achievement_status);

-- ============================================
-- 4. LESSON-SCO MAPPING
-- ============================================
-- Links lessons to specific SCOs they cover
CREATE TABLE IF NOT EXISTS lesson_sco_mapping (
    mapping_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR(50),
    coverage_focus TEXT, -- What aspect of the SCO was covered
    time_spent_minutes INTEGER DEFAULT 0, -- Time spent on this SCO in this lesson
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mapping_lesson ON lesson_sco_mapping(lesson_id);
CREATE INDEX idx_mapping_sco ON lesson_sco_mapping(topic_number, unit_number, sco_number);

-- ============================================
-- 5. CURRICULUM GAP ANALYSIS
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_gaps (
    gap_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR(50),
    gap_type VARCHAR(50), -- NOT_COVERED, PARTIALLY_COVERED, NO_ASSESSMENT, LOW_ACHIEVEMENT
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT,
    recommended_action TEXT,
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by BIGINT REFERENCES users(user_id),
    UNIQUE(class_subject_id, topic_number, unit_number, sco_number, gap_type)
);

CREATE INDEX idx_gaps_class_subject ON curriculum_gaps(class_subject_id);
CREATE INDEX idx_gaps_resolved ON curriculum_gaps(resolved);
CREATE INDEX idx_gaps_severity ON curriculum_gaps(severity);

-- ============================================
-- 6. ANALYTICS SNAPSHOTS
-- ============================================
-- Store periodic snapshots of analytics for historical tracking
CREATE TABLE IF NOT EXISTS curriculum_analytics_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    coverage_percentage DECIMAL(5,2) DEFAULT 0.00, -- Overall curriculum coverage
    topics_covered INTEGER DEFAULT 0,
    topics_total INTEGER DEFAULT 0,
    units_covered INTEGER DEFAULT 0,
    units_total INTEGER DEFAULT 0,
    scos_covered INTEGER DEFAULT 0,
    scos_total INTEGER DEFAULT 0,
    planned_hours_total DECIMAL(8,2) DEFAULT 0.00,
    actual_hours_total DECIMAL(8,2) DEFAULT 0.00,
    average_achievement_percentage DECIMAL(5,2) DEFAULT 0.00,
    students_achieved INTEGER DEFAULT 0,
    students_total INTEGER DEFAULT 0,
    gaps_count INTEGER DEFAULT 0,
    snapshot_data JSONB, -- Full snapshot data in JSON format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_subject_id, snapshot_date)
);

CREATE INDEX idx_snapshots_class_subject ON curriculum_analytics_snapshots(class_subject_id);
CREATE INDEX idx_snapshots_date ON curriculum_analytics_snapshots(snapshot_date DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE curriculum_coverage IS 'Tracks which curriculum topics/units/SCOs have been covered per class';
COMMENT ON TABLE curriculum_time_allocation IS 'Tracks planned vs actual time spent on curriculum items';
COMMENT ON TABLE curriculum_outcome_achievement IS 'Tracks individual student achievement of curriculum outcomes';
COMMENT ON TABLE lesson_sco_mapping IS 'Maps lessons to specific SCOs they cover';
COMMENT ON TABLE curriculum_gaps IS 'Identifies gaps in curriculum coverage or achievement';
COMMENT ON TABLE curriculum_analytics_snapshots IS 'Periodic snapshots of curriculum analytics for historical tracking';

