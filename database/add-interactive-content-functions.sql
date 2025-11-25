-- LaunchPad SKN - Advanced Interactive Content Functions
-- RPC functions for adaptive learning, gamification, social learning, virtual labs, and AR/VR

-- ============================================
-- 1. Get Student Learning Path
-- ============================================
CREATE OR REPLACE FUNCTION get_student_learning_path(
    student_id_param BIGINT,
    class_subject_id_param BIGINT DEFAULT NULL
)
RETURNS TABLE (
    path_id BIGINT,
    path_name VARCHAR,
    path_type VARCHAR,
    current_stage INTEGER,
    total_stages INTEGER,
    overall_progress DECIMAL,
    average_performance DECIMAL,
    mastery_level VARCHAR,
    difficulty_level VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        alp.path_id,
        alp.path_name,
        alp.path_type,
        alp.current_stage,
        alp.total_stages,
        alp.overall_progress,
        alp.average_performance,
        alp.mastery_level,
        alp.difficulty_level,
        alp.is_active
    FROM adaptive_learning_paths alp
    WHERE alp.student_id = student_id_param
      AND (class_subject_id_param IS NULL OR alp.class_subject_id = class_subject_id_param)
      AND alp.is_active = true
    ORDER BY alp.started_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Get Learning Path Stages
-- ============================================
CREATE OR REPLACE FUNCTION get_learning_path_stages(path_id_param BIGINT)
RETURNS TABLE (
    stage_id BIGINT,
    stage_number INTEGER,
    stage_name VARCHAR,
    description TEXT,
    content_type VARCHAR,
    content_id BIGINT,
    is_completed BOOLEAN,
    score DECIMAL,
    attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lps.stage_id,
        lps.stage_number,
        lps.stage_name,
        lps.description,
        lps.content_type,
        lps.content_id,
        lps.is_completed,
        lps.score,
        lps.attempts
    FROM learning_path_stages lps
    WHERE lps.path_id = path_id_param
    ORDER BY lps.stage_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Update Learning Path Progress
-- ============================================
CREATE OR REPLACE FUNCTION update_learning_path_progress(
    path_id_param BIGINT,
    stage_id_param BIGINT,
    score_param DECIMAL,
    performance_param DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    total_stages INTEGER;
    completed_stages INTEGER;
    new_progress DECIMAL;
    avg_performance DECIMAL;
BEGIN
    -- Update stage
    UPDATE learning_path_stages
    SET 
        is_completed = true,
        score = score_param,
        attempts = attempts + 1,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE stage_id = stage_id_param
      AND path_id = path_id_param;
    
    -- Calculate overall progress
    SELECT COUNT(*), COUNT(CASE WHEN is_completed THEN 1 END)
    INTO total_stages, completed_stages
    FROM learning_path_stages
    WHERE path_id = path_id_param;
    
    new_progress := (completed_stages::DECIMAL / NULLIF(total_stages, 0)::DECIMAL) * 100;
    
    -- Calculate average performance
    SELECT COALESCE(AVG(score), 0)
    INTO avg_performance
    FROM learning_path_stages
    WHERE path_id = path_id_param
      AND is_completed = true;
    
    -- Update path
    UPDATE adaptive_learning_paths
    SET 
        overall_progress = new_progress,
        average_performance = COALESCE(performance_param, avg_performance),
        current_stage = stage_id_param,
        updated_at = CURRENT_TIMESTAMP
    WHERE path_id = path_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Get Student Gamification Profile
-- ============================================
CREATE OR REPLACE FUNCTION get_student_gamification(
    student_id_param BIGINT,
    class_subject_id_param BIGINT DEFAULT NULL
)
RETURNS TABLE (
    gamification_id BIGINT,
    total_points INTEGER,
    current_points INTEGER,
    current_level INTEGER,
    experience_points INTEGER,
    experience_to_next_level INTEGER,
    current_streak INTEGER,
    longest_streak INTEGER,
    class_rank INTEGER,
    lessons_completed INTEGER,
    quizzes_passed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sg.gamification_id,
        sg.total_points,
        sg.current_points,
        sg.current_level,
        sg.experience_points,
        sg.experience_to_next_level,
        sg.current_streak,
        sg.longest_streak,
        sg.class_rank,
        sg.lessons_completed,
        sg.quizzes_passed
    FROM student_gamification sg
    WHERE sg.student_id = student_id_param
      AND (class_subject_id_param IS NULL OR sg.class_subject_id = class_subject_id_param)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Award Points
-- ============================================
CREATE OR REPLACE FUNCTION award_points(
    student_id_param BIGINT,
    class_subject_id_param BIGINT,
    points_param INTEGER,
    transaction_type_param VARCHAR,
    source_type_param VARCHAR DEFAULT NULL,
    source_id_param BIGINT DEFAULT NULL,
    description_param TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    new_transaction_id BIGINT;
    current_points INTEGER;
    new_total_points INTEGER;
BEGIN
    -- Insert transaction
    INSERT INTO points_transactions (
        student_id,
        class_subject_id,
        points_amount,
        transaction_type,
        source_type,
        source_id,
        description
    ) VALUES (
        student_id_param,
        class_subject_id_param,
        points_param,
        transaction_type_param,
        source_type_param,
        source_id_param,
        description_param
    )
    RETURNING transaction_id INTO new_transaction_id;
    
    -- Update or create gamification record
    INSERT INTO student_gamification (
        student_id,
        class_subject_id,
        total_points,
        current_points
    ) VALUES (
        student_id_param,
        class_subject_id_param,
        points_param,
        points_param
    )
    ON CONFLICT (student_id, class_subject_id)
    DO UPDATE SET
        total_points = student_gamification.total_points + points_param,
        current_points = student_gamification.current_points + points_param,
        points_this_week = CASE 
            WHEN DATE_TRUNC('week', CURRENT_DATE) = DATE_TRUNC('week', student_gamification.updated_at::DATE)
            THEN student_gamification.points_this_week + points_param
            ELSE points_param
        END,
        points_this_month = CASE 
            WHEN DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', student_gamification.updated_at::DATE)
            THEN student_gamification.points_this_month + points_param
            ELSE points_param
        END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Get Leaderboard
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard(
    leaderboard_id_param BIGINT,
    limit_param INTEGER DEFAULT 100
)
RETURNS TABLE (
    rank_position INTEGER,
    student_id BIGINT,
    student_name VARCHAR,
    student_email VARCHAR,
    score INTEGER,
    additional_metrics JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le.rank_position,
        le.student_id,
        u.name as student_name,
        u.email as student_email,
        le.score,
        le.additional_metrics
    FROM leaderboard_entries le
    JOIN users u ON le.student_id = u.user_id
    WHERE le.leaderboard_id = leaderboard_id_param
    ORDER BY le.rank_position
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Get Student Badges
-- ============================================
CREATE OR REPLACE FUNCTION get_student_badges(
    student_id_param BIGINT,
    class_subject_id_param BIGINT DEFAULT NULL
)
RETURNS TABLE (
    badge_id BIGINT,
    badge_code VARCHAR,
    badge_name VARCHAR,
    description TEXT,
    badge_type VARCHAR,
    category VARCHAR,
    icon_url TEXT,
    rarity VARCHAR,
    earned_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.badge_id,
        b.badge_code,
        b.badge_name,
        b.description,
        b.badge_type,
        b.category,
        b.icon_url,
        b.rarity,
        sb.earned_at
    FROM student_badges sb
    JOIN badges b ON sb.badge_id = b.badge_id
    WHERE sb.student_id = student_id_param
      AND (class_subject_id_param IS NULL OR sb.class_subject_id = class_subject_id_param)
    ORDER BY sb.earned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Get Forum Topics
-- ============================================
CREATE OR REPLACE FUNCTION get_forum_topics(
    forum_id_param BIGINT,
    limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
    topic_id BIGINT,
    topic_title VARCHAR,
    topic_type VARCHAR,
    created_by_name VARCHAR,
    created_at TIMESTAMP,
    reply_count INTEGER,
    view_count INTEGER,
    last_reply_at TIMESTAMP,
    is_pinned BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ft.topic_id,
        ft.topic_title,
        ft.topic_type,
        u.name as created_by_name,
        ft.created_at,
        ft.reply_count,
        ft.view_count,
        ft.last_reply_at,
        ft.is_pinned
    FROM forum_topics ft
    JOIN users u ON ft.created_by = u.user_id
    WHERE ft.forum_id = forum_id_param
      AND ft.is_approved = true
    ORDER BY ft.is_pinned DESC, ft.last_reply_at DESC NULLS LAST, ft.created_at DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Get Forum Posts
-- ============================================
CREATE OR REPLACE FUNCTION get_forum_posts(
    topic_id_param BIGINT,
    limit_param INTEGER DEFAULT 100
)
RETURNS TABLE (
    post_id BIGINT,
    parent_post_id BIGINT,
    post_content TEXT,
    created_by_name VARCHAR,
    created_at TIMESTAMP,
    like_count INTEGER,
    is_best_answer BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.post_id,
        fp.parent_post_id,
        fp.post_content,
        u.name as created_by_name,
        fp.created_at,
        fp.like_count,
        fp.is_best_answer
    FROM forum_posts fp
    JOIN users u ON fp.created_by = u.user_id
    WHERE fp.topic_id = topic_id_param
      AND fp.is_approved = true
    ORDER BY fp.is_best_answer DESC, fp.created_at ASC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Get Virtual Labs
-- ============================================
CREATE OR REPLACE FUNCTION get_virtual_labs(
    subject_id_param BIGINT DEFAULT NULL,
    lab_type_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    lab_id BIGINT,
    lab_name VARCHAR,
    description TEXT,
    lab_type VARCHAR,
    simulation_type VARCHAR,
    difficulty_level VARCHAR,
    estimated_duration_minutes INTEGER,
    created_by_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vl.lab_id,
        vl.lab_name,
        vl.description,
        vl.lab_type,
        vl.simulation_type,
        vl.difficulty_level,
        vl.estimated_duration_minutes,
        u.name as created_by_name
    FROM virtual_labs vl
    LEFT JOIN users u ON vl.created_by = u.user_id
    WHERE (subject_id_param IS NULL OR vl.subject_id = subject_id_param)
      AND (lab_type_param IS NULL OR vl.lab_type = lab_type_param)
    ORDER BY vl.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Get AR/VR Content
-- ============================================
CREATE OR REPLACE FUNCTION get_arvr_content(
    subject_id_param BIGINT DEFAULT NULL,
    content_type_param VARCHAR DEFAULT NULL,
    class_subject_id_param BIGINT DEFAULT NULL
)
RETURNS TABLE (
    content_id BIGINT,
    content_name VARCHAR,
    description TEXT,
    content_type VARCHAR,
    model_format VARCHAR,
    platform VARCHAR,
    location_name VARCHAR,
    difficulty_level VARCHAR,
    estimated_duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.content_id,
        ac.content_name,
        ac.description,
        ac.content_type,
        ac.model_format,
        ac.platform,
        ac.location_name,
        ac.difficulty_level,
        ac.estimated_duration_minutes
    FROM arvr_content ac
    WHERE (subject_id_param IS NULL OR ac.subject_id = subject_id_param)
      AND (content_type_param IS NULL OR ac.content_type = content_type_param)
      AND (class_subject_id_param IS NULL OR ac.class_subject_id = class_subject_id_param)
    ORDER BY ac.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_student_learning_path IS 'Returns the active learning path for a student';
COMMENT ON FUNCTION get_learning_path_stages IS 'Returns all stages in a learning path';
COMMENT ON FUNCTION update_learning_path_progress IS 'Updates learning path progress after stage completion';
COMMENT ON FUNCTION get_student_gamification IS 'Returns gamification profile for a student';
COMMENT ON FUNCTION award_points IS 'Awards points to a student and updates gamification';
COMMENT ON FUNCTION get_leaderboard IS 'Returns leaderboard rankings';
COMMENT ON FUNCTION get_student_badges IS 'Returns badges earned by a student';
COMMENT ON FUNCTION get_forum_topics IS 'Returns forum topics';
COMMENT ON FUNCTION get_forum_posts IS 'Returns posts in a forum topic';
COMMENT ON FUNCTION get_virtual_labs IS 'Returns available virtual labs';
COMMENT ON FUNCTION get_arvr_content IS 'Returns AR/VR content';

