-- ============================================
-- QUIZ SYSTEM DATABASE SCHEMA
-- ============================================
-- This migration creates tables for in-app quiz/assessment creation
-- Supports multiple question types, auto-grading, and student responses

-- ============================================
-- 1. QUIZZES TABLE
-- ============================================
-- Stores quiz metadata linked to lesson content
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES lesson_content(content_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit_minutes INTEGER, -- Optional time limit
    total_points DECIMAL(10,2) DEFAULT 0,
    passing_score DECIMAL(5,2), -- Percentage required to pass
    allow_multiple_attempts BOOLEAN DEFAULT false,
    max_attempts INTEGER DEFAULT 1,
    show_results_immediately BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_answers BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    due_date TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_content ON quizzes(content_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_published ON quizzes(is_published, published_at);

-- ============================================
-- 2. QUIZ QUESTIONS TABLE
-- ============================================
-- Stores individual questions for each quiz
CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL, -- MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING, FILL_BLANK
    question_text TEXT NOT NULL,
    question_order INTEGER DEFAULT 0, -- For ordering questions
    points DECIMAL(10,2) DEFAULT 1.00,
    explanation TEXT, -- Explanation shown after answering
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_questions_order ON quiz_questions(quiz_id, question_order);

-- ============================================
-- 3. QUIZ ANSWER OPTIONS TABLE
-- ============================================
-- Stores answer options for multiple choice, true/false, matching questions
CREATE TABLE IF NOT EXISTS quiz_answer_options (
    option_id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    option_order INTEGER DEFAULT 0, -- For ordering options
    points DECIMAL(10,2) DEFAULT 0, -- Partial credit for matching questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_options_question ON quiz_answer_options(question_id);
CREATE INDEX idx_options_correct ON quiz_answer_options(question_id, is_correct);

-- ============================================
-- 4. QUIZ CORRECT ANSWERS TABLE
-- ============================================
-- Stores correct answers for short answer, fill-in-the-blank, essay questions
CREATE TABLE IF NOT EXISTS quiz_correct_answers (
    answer_id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    correct_answer TEXT NOT NULL, -- For short answer, fill-in-the-blank
    case_sensitive BOOLEAN DEFAULT false, -- For text matching
    accept_partial BOOLEAN DEFAULT false, -- Accept partial matches
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_correct_answers_question ON quiz_correct_answers(question_id);

-- ============================================
-- 5. STUDENT QUIZ ATTEMPTS TABLE
-- ============================================
-- Tracks each student's attempt at a quiz
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
    attempt_id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent_seconds INTEGER, -- Time taken to complete
    total_points_earned DECIMAL(10,2) DEFAULT 0,
    percentage_score DECIMAL(5,2),
    is_passed BOOLEAN,
    is_graded BOOLEAN DEFAULT false, -- For essay questions that need manual grading
    graded_by BIGINT REFERENCES users(user_id),
    graded_at TIMESTAMP,
    feedback TEXT, -- Teacher feedback
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_quiz_attempt UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE INDEX idx_attempts_quiz ON student_quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_student ON student_quiz_attempts(student_id);
CREATE INDEX idx_attempts_submitted ON student_quiz_attempts(quiz_id, submitted_at);

-- ============================================
-- 6. STUDENT QUIZ RESPONSES TABLE
-- ============================================
-- Stores individual student answers to each question
CREATE TABLE IF NOT EXISTS student_quiz_responses (
    response_id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES student_quiz_attempts(attempt_id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    response_text TEXT, -- For short answer, essay, fill-in-the-blank
    selected_option_id BIGINT REFERENCES quiz_answer_options(option_id), -- For multiple choice, true/false
    points_earned DECIMAL(10,2) DEFAULT 0,
    is_correct BOOLEAN,
    is_graded BOOLEAN DEFAULT false, -- For essay questions
    feedback TEXT, -- Teacher feedback for this question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_responses_attempt ON student_quiz_responses(attempt_id);
CREATE INDEX idx_responses_question ON student_quiz_responses(question_id);
CREATE INDEX idx_responses_option ON student_quiz_responses(selected_option_id);

-- ============================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_quiz_responses_updated_at BEFORE UPDATE ON student_quiz_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. FUNCTION TO CALCULATE QUIZ TOTAL POINTS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_quiz_total_points(quiz_id_param BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total
    FROM quiz_questions
    WHERE quiz_id = quiz_id_param;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE quizzes IS 'Stores quiz metadata linked to lesson content';
COMMENT ON TABLE quiz_questions IS 'Stores individual questions for quizzes';
COMMENT ON TABLE quiz_answer_options IS 'Stores answer options for multiple choice and matching questions';
COMMENT ON TABLE quiz_correct_answers IS 'Stores correct answers for text-based questions';
COMMENT ON TABLE student_quiz_attempts IS 'Tracks each student attempt at a quiz';
COMMENT ON TABLE student_quiz_responses IS 'Stores individual student answers to quiz questions';

COMMENT ON COLUMN quizzes.time_limit_minutes IS 'Optional time limit in minutes (NULL = no limit)';
COMMENT ON COLUMN quizzes.passing_score IS 'Percentage required to pass (NULL = no passing requirement)';
COMMENT ON COLUMN quiz_questions.question_type IS 'MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING, FILL_BLANK';
COMMENT ON COLUMN quiz_answer_options.is_correct IS 'True if this option is a correct answer';
COMMENT ON COLUMN quiz_correct_answers.case_sensitive IS 'Whether text matching should be case-sensitive';
COMMENT ON COLUMN student_quiz_attempts.is_graded IS 'True if all questions (including essays) have been graded';

