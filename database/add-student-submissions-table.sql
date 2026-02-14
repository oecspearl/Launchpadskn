-- Student Submissions Table
-- This table stores student submissions for assessments/assignments

CREATE TABLE IF NOT EXISTS student_submissions (
    submission_id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES subject_assessments(assessment_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_assessment_submission UNIQUE(assessment_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_assessment ON student_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON student_submissions(submitted_at);

-- Add RLS policies (if using Row Level Security)
-- Allow students to view their own submissions
-- Allow teachers to view all submissions for assessments they teach

