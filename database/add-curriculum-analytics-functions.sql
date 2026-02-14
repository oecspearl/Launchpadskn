-- LaunchPad SKN - Curriculum Analytics Functions
-- RPC functions for curriculum analytics operations

-- ============================================
-- 1. Get Curriculum Coverage by Class Subject
-- ============================================
CREATE OR REPLACE FUNCTION get_curriculum_coverage(class_subject_id_param BIGINT)
RETURNS TABLE (
    topic_number INTEGER,
    topic_title VARCHAR,
    unit_number INTEGER,
    sco_number VARCHAR,
    sco_title TEXT,
    status VARCHAR,
    coverage_percentage DECIMAL,
    lessons_count INTEGER,
    first_taught_date DATE,
    last_taught_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.topic_number,
        cc.topic_title,
        cc.unit_number,
        cc.sco_number,
        cc.sco_title,
        cc.status,
        cc.coverage_percentage,
        cc.lessons_count,
        cc.first_taught_date,
        cc.last_taught_date
    FROM curriculum_coverage cc
    WHERE cc.class_subject_id = class_subject_id_param
    ORDER BY cc.topic_number, cc.unit_number, cc.sco_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Get Coverage Summary by Class Subject
-- ============================================
CREATE OR REPLACE FUNCTION get_coverage_summary(class_subject_id_param BIGINT)
RETURNS TABLE (
    total_topics INTEGER,
    covered_topics INTEGER,
    total_units INTEGER,
    covered_units INTEGER,
    total_scos INTEGER,
    covered_scos INTEGER,
    overall_coverage_percentage DECIMAL,
    in_progress_count INTEGER,
    not_started_count INTEGER,
    completed_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cc.topic_number)::INTEGER as total_topics,
        COUNT(DISTINCT CASE WHEN cc.status IN ('COMPLETED', 'IN_PROGRESS') THEN cc.topic_number END)::INTEGER as covered_topics,
        COUNT(DISTINCT (cc.topic_number, cc.unit_number))::INTEGER as total_units,
        COUNT(DISTINCT CASE WHEN cc.status IN ('COMPLETED', 'IN_PROGRESS') THEN (cc.topic_number, cc.unit_number) END)::INTEGER as covered_units,
        COUNT(*)::INTEGER as total_scos,
        COUNT(CASE WHEN cc.status IN ('COMPLETED', 'IN_PROGRESS') THEN 1 END)::INTEGER as covered_scos,
        COALESCE(AVG(cc.coverage_percentage), 0)::DECIMAL as overall_coverage_percentage,
        COUNT(CASE WHEN cc.status = 'IN_PROGRESS' THEN 1 END)::INTEGER as in_progress_count,
        COUNT(CASE WHEN cc.status = 'NOT_STARTED' THEN 1 END)::INTEGER as not_started_count,
        COUNT(CASE WHEN cc.status = 'COMPLETED' THEN 1 END)::INTEGER as completed_count
    FROM curriculum_coverage cc
    WHERE cc.class_subject_id = class_subject_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Get Time Allocation Analysis
-- ============================================
CREATE OR REPLACE FUNCTION get_time_allocation_analysis(
    class_subject_id_param BIGINT,
    academic_year_param VARCHAR DEFAULT NULL,
    term_param INTEGER DEFAULT NULL
)
RETURNS TABLE (
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR,
    planned_hours DECIMAL,
    actual_hours DECIMAL,
    planned_minutes INTEGER,
    actual_minutes INTEGER,
    variance_hours DECIMAL,
    variance_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cta.topic_number,
        cta.unit_number,
        cta.sco_number,
        cta.planned_hours,
        cta.actual_hours,
        cta.planned_minutes,
        cta.actual_minutes,
        (cta.actual_hours - cta.planned_hours)::DECIMAL as variance_hours,
        CASE 
            WHEN cta.planned_hours > 0 THEN 
                ((cta.actual_hours - cta.planned_hours) / cta.planned_hours * 100)::DECIMAL
            ELSE 0
        END as variance_percentage
    FROM curriculum_time_allocation cta
    WHERE cta.class_subject_id = class_subject_id_param
      AND (academic_year_param IS NULL OR cta.academic_year = academic_year_param)
      AND (term_param IS NULL OR cta.term = term_param)
    ORDER BY cta.topic_number, cta.unit_number, cta.sco_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Get Outcome Achievement Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_outcome_achievement_summary(class_subject_id_param BIGINT)
RETURNS TABLE (
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR,
    total_students INTEGER,
    achieved_count INTEGER,
    developing_count INTEGER,
    not_assessed_count INTEGER,
    average_achievement_percentage DECIMAL,
    achievement_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        coa.topic_number,
        coa.unit_number,
        coa.sco_number,
        COUNT(DISTINCT coa.student_id)::INTEGER as total_students,
        COUNT(CASE WHEN coa.achievement_status = 'ACHIEVED' OR coa.achievement_status = 'EXCEEDED' THEN 1 END)::INTEGER as achieved_count,
        COUNT(CASE WHEN coa.achievement_status = 'DEVELOPING' THEN 1 END)::INTEGER as developing_count,
        COUNT(CASE WHEN coa.achievement_status = 'NOT_ASSESSED' THEN 1 END)::INTEGER as not_assessed_count,
        COALESCE(AVG(coa.achievement_percentage), 0)::DECIMAL as average_achievement_percentage,
        CASE 
            WHEN COUNT(DISTINCT coa.student_id) > 0 THEN
                (COUNT(CASE WHEN coa.achievement_status IN ('ACHIEVED', 'EXCEEDED') THEN 1 END)::DECIMAL / 
                 COUNT(DISTINCT coa.student_id) * 100)::DECIMAL
            ELSE 0
        END as achievement_rate
    FROM curriculum_outcome_achievement coa
    WHERE coa.class_subject_id = class_subject_id_param
    GROUP BY coa.topic_number, coa.unit_number, coa.sco_number
    ORDER BY coa.topic_number, coa.unit_number, coa.sco_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Get Gap Analysis
-- ============================================
CREATE OR REPLACE FUNCTION get_gap_analysis(
    class_subject_id_param BIGINT,
    include_resolved BOOLEAN DEFAULT false
)
RETURNS TABLE (
    gap_id BIGINT,
    topic_number INTEGER,
    unit_number INTEGER,
    sco_number VARCHAR,
    gap_type VARCHAR,
    severity VARCHAR,
    description TEXT,
    recommended_action TEXT,
    identified_at TIMESTAMP,
    resolved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cg.gap_id,
        cg.topic_number,
        cg.unit_number,
        cg.sco_number,
        cg.gap_type,
        cg.severity,
        cg.description,
        cg.recommended_action,
        cg.identified_at,
        cg.resolved
    FROM curriculum_gaps cg
    WHERE cg.class_subject_id = class_subject_id_param
      AND (include_resolved = true OR cg.resolved = false)
    ORDER BY 
        CASE cg.severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
        END,
        cg.identified_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Update Coverage from Lessons
-- ============================================
CREATE OR REPLACE FUNCTION update_coverage_from_lessons(class_subject_id_param BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Update coverage based on lesson-SCO mappings
    INSERT INTO curriculum_coverage (
        class_subject_id,
        topic_number,
        unit_number,
        sco_number,
        status,
        coverage_percentage,
        lessons_count,
        first_taught_date,
        last_taught_date
    )
    SELECT 
        l.class_subject_id,
        lsm.topic_number,
        lsm.unit_number,
        lsm.sco_number,
        CASE 
            WHEN COUNT(DISTINCT l.lesson_id) >= 3 THEN 'COMPLETED'
            WHEN COUNT(DISTINCT l.lesson_id) >= 1 THEN 'IN_PROGRESS'
            ELSE 'NOT_STARTED'
        END as status,
        LEAST(COUNT(DISTINCT l.lesson_id) * 33.33, 100)::DECIMAL as coverage_percentage,
        COUNT(DISTINCT l.lesson_id)::INTEGER as lessons_count,
        MIN(l.lesson_date) as first_taught_date,
        MAX(l.lesson_date) as last_taught_date
    FROM lessons l
    JOIN lesson_sco_mapping lsm ON l.lesson_id = lsm.lesson_id
    WHERE l.class_subject_id = class_subject_id_param
      AND l.status = 'COMPLETED'
    GROUP BY l.class_subject_id, lsm.topic_number, lsm.unit_number, lsm.sco_number
    ON CONFLICT (class_subject_id, topic_number, unit_number, sco_number)
    DO UPDATE SET
        status = EXCLUDED.status,
        coverage_percentage = EXCLUDED.coverage_percentage,
        lessons_count = EXCLUDED.lessons_count,
        first_taught_date = COALESCE(EXCLUDED.first_taught_date, curriculum_coverage.first_taught_date),
        last_taught_date = EXCLUDED.last_taught_date,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Calculate Time Allocation from Lessons
-- ============================================
CREATE OR REPLACE FUNCTION calculate_time_allocation(
    class_subject_id_param BIGINT,
    academic_year_param VARCHAR,
    term_param INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Calculate actual time spent from lesson-SCO mappings
    INSERT INTO curriculum_time_allocation (
        class_subject_id,
        topic_number,
        unit_number,
        sco_number,
        actual_minutes,
        actual_hours,
        academic_year,
        term
    )
    SELECT 
        l.class_subject_id,
        lsm.topic_number,
        lsm.unit_number,
        lsm.sco_number,
        COALESCE(SUM(lsm.time_spent_minutes), 
                 SUM(EXTRACT(EPOCH FROM (l.end_time - l.start_time)) / 60)::INTEGER) as actual_minutes,
        COALESCE(SUM(lsm.time_spent_minutes), 
                 SUM(EXTRACT(EPOCH FROM (l.end_time - l.start_time)) / 60))::DECIMAL / 60 as actual_hours,
        academic_year_param,
        term_param
    FROM lessons l
    JOIN lesson_sco_mapping lsm ON l.lesson_id = lsm.lesson_id
    WHERE l.class_subject_id = class_subject_id_param
      AND l.status = 'COMPLETED'
    GROUP BY l.class_subject_id, lsm.topic_number, lsm.unit_number, lsm.sco_number
    ON CONFLICT (class_subject_id, topic_number, unit_number, sco_number, academic_year, term)
    DO UPDATE SET
        actual_minutes = EXCLUDED.actual_minutes,
        actual_hours = EXCLUDED.actual_hours,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Identify Curriculum Gaps
-- ============================================
CREATE OR REPLACE FUNCTION identify_curriculum_gaps(class_subject_id_param BIGINT)
RETURNS INTEGER AS $$
DECLARE
    gaps_found INTEGER := 0;
BEGIN
    -- Identify gaps: Not covered SCOs
    INSERT INTO curriculum_gaps (
        class_subject_id,
        topic_number,
        unit_number,
        sco_number,
        gap_type,
        severity,
        description,
        recommended_action
    )
    SELECT DISTINCT
        cs.class_subject_id,
        (topic->>'topicNumber')::INTEGER as topic_number,
        (unit->>'unitNumber')::INTEGER as unit_number,
        unit->>'scoNumber' as sco_number,
        'NOT_COVERED' as gap_type,
        'HIGH' as severity,
        'This SCO has not been covered in any lessons' as description,
        'Schedule lessons to cover this SCO' as recommended_action
    FROM class_subjects cs
    JOIN subject_form_offerings sfo ON cs.subject_offering_id = sfo.offering_id
    CROSS JOIN LATERAL jsonb_array_elements(sfo.curriculum_structure->'topics') WITH ORDINALITY AS topics(topic, idx)
    CROSS JOIN LATERAL jsonb_array_elements(topic->'instructionalUnits') AS units(unit)
    LEFT JOIN curriculum_coverage cc ON 
        cc.class_subject_id = cs.class_subject_id
        AND cc.topic_number = (topic->>'topicNumber')::INTEGER
        AND cc.unit_number = (unit->>'unitNumber')::INTEGER
        AND cc.sco_number = unit->>'scoNumber'
    WHERE cs.class_subject_id = class_subject_id_param
      AND cc.coverage_id IS NULL
      AND sfo.curriculum_structure IS NOT NULL
    ON CONFLICT (class_subject_id, topic_number, unit_number, sco_number, gap_type)
    DO NOTHING;
    
    GET DIAGNOSTICS gaps_found = ROW_COUNT;
    
    -- Identify gaps: Low achievement
    INSERT INTO curriculum_gaps (
        class_subject_id,
        topic_number,
        unit_number,
        sco_number,
        gap_type,
        severity,
        description,
        recommended_action
    )
    SELECT 
        coa.class_subject_id,
        coa.topic_number,
        coa.unit_number,
        coa.sco_number,
        'LOW_ACHIEVEMENT' as gap_type,
        CASE 
            WHEN achievement_rate < 50 THEN 'CRITICAL'
            WHEN achievement_rate < 70 THEN 'HIGH'
            ELSE 'MEDIUM'
        END as severity,
        format('Only %.1f%% of students achieved this SCO', achievement_rate) as description,
        'Provide additional support and review for this SCO' as recommended_action
    FROM get_outcome_achievement_summary(class_subject_id_param) oas
    WHERE oas.achievement_rate < 70
    ON CONFLICT (class_subject_id, topic_number, unit_number, sco_number, gap_type)
    DO UPDATE SET
        severity = EXCLUDED.severity,
        description = EXCLUDED.description,
        identified_at = CURRENT_TIMESTAMP;
    
    RETURN gaps_found;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_curriculum_coverage IS 'Returns detailed coverage information for a class subject';
COMMENT ON FUNCTION get_coverage_summary IS 'Returns summary statistics of curriculum coverage';
COMMENT ON FUNCTION get_time_allocation_analysis IS 'Returns planned vs actual time allocation analysis';
COMMENT ON FUNCTION get_outcome_achievement_summary IS 'Returns summary of student achievement by SCO';
COMMENT ON FUNCTION get_gap_analysis IS 'Returns identified curriculum gaps';
COMMENT ON FUNCTION update_coverage_from_lessons IS 'Updates coverage tracking based on completed lessons';
COMMENT ON FUNCTION calculate_time_allocation IS 'Calculates actual time spent from lesson data';
COMMENT ON FUNCTION identify_curriculum_gaps IS 'Identifies gaps in curriculum coverage and achievement';

