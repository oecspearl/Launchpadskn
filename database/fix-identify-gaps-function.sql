-- Fix for identify_curriculum_gaps function
-- This fixes the JSONB operator error

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

