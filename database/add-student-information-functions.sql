-- LaunchPad SKN - Student Information Management Functions
-- RPC functions for student information operations

-- ============================================
-- 1. Get Complete Student Profile
-- ============================================
CREATE OR REPLACE FUNCTION get_student_profile(student_id_param BIGINT)
RETURNS TABLE (
    profile_id BIGINT,
    student_id BIGINT,
    student_number VARCHAR,
    enrollment_date DATE,
    graduation_date DATE,
    graduation_status VARCHAR,
    current_grade_level VARCHAR,
    academic_year VARCHAR,
    gpa DECIMAL,
    cumulative_gpa DECIMAL,
    class_rank INTEGER,
    date_of_birth DATE,
    gender VARCHAR,
    nationality VARCHAR,
    primary_phone VARCHAR,
    home_address TEXT,
    emergency_contact_1_name VARCHAR,
    emergency_contact_1_phone VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    medical_conditions TEXT,
    allergies TEXT,
    behavioral_concerns TEXT,
    photo_url TEXT,
    notes TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.profile_id,
        sp.student_id,
        sp.student_number,
        sp.enrollment_date,
        sp.graduation_date,
        sp.graduation_status,
        sp.current_grade_level,
        sp.academic_year,
        sp.gpa,
        sp.cumulative_gpa,
        sp.class_rank,
        sp.date_of_birth,
        sp.gender,
        sp.nationality,
        sp.primary_phone,
        sp.home_address,
        sp.emergency_contact_1_name,
        sp.emergency_contact_1_phone,
        sp.guardian_name,
        sp.guardian_phone,
        sp.medical_conditions,
        sp.allergies,
        sp.behavioral_concerns,
        sp.photo_url,
        sp.notes,
        sp.metadata
    FROM student_profiles sp
    WHERE sp.student_id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Get Student Lifecycle Timeline
-- ============================================
CREATE OR REPLACE FUNCTION get_student_lifecycle(student_id_param BIGINT)
RETURNS TABLE (
    event_id BIGINT,
    event_type VARCHAR,
    event_date DATE,
    academic_year VARCHAR,
    term INTEGER,
    from_school_name VARCHAR,
    to_school_name VARCHAR,
    from_class_name VARCHAR,
    to_class_name VARCHAR,
    from_grade VARCHAR,
    to_grade VARCHAR,
    status VARCHAR,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sle.event_id,
        sle.event_type,
        sle.event_date,
        sle.academic_year,
        sle.term,
        from_school.name as from_school_name,
        to_school.name as to_school_name,
        from_class.class_name as from_class_name,
        to_class.class_name as to_class_name,
        sle.from_grade,
        sle.to_grade,
        sle.status,
        sle.reason,
        sle.notes,
        sle.created_at
    FROM student_lifecycle_events sle
    LEFT JOIN institutions from_school ON sle.from_school_id = from_school.institution_id
    LEFT JOIN institutions to_school ON sle.to_school_id = to_school.institution_id
    LEFT JOIN classes from_class ON sle.from_class_id = from_class.class_id
    LEFT JOIN classes to_class ON sle.to_class_id = to_class.class_id
    WHERE sle.student_id = student_id_param
    ORDER BY sle.event_date DESC, sle.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Get Student Transfers
-- ============================================
CREATE OR REPLACE FUNCTION get_student_transfers(
    student_id_param BIGINT,
    transfer_type_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    transfer_id BIGINT,
    transfer_type VARCHAR,
    transfer_date DATE,
    academic_year VARCHAR,
    from_school_name VARCHAR,
    to_school_name VARCHAR,
    from_class_name VARCHAR,
    to_class_name VARCHAR,
    transfer_status VARCHAR,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.transfer_id,
        st.transfer_type,
        st.transfer_date,
        st.academic_year,
        st.from_school_name,
        st.to_school_name,
        st.from_class_name,
        st.to_class_name,
        st.transfer_status,
        st.reason,
        st.notes,
        st.created_at
    FROM student_transfers st
    WHERE st.student_id = student_id_param
      AND (transfer_type_param IS NULL OR st.transfer_type = transfer_type_param)
    ORDER BY st.transfer_date DESC, st.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Get Student Special Needs
-- ============================================
CREATE OR REPLACE FUNCTION get_student_special_needs(
    student_id_param BIGINT,
    active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    need_id BIGINT,
    need_type VARCHAR,
    category VARCHAR,
    description TEXT,
    diagnosis_date DATE,
    is_active BOOLEAN,
    has_iep BOOLEAN,
    iep_start_date DATE,
    iep_end_date DATE,
    accommodations JSONB,
    case_manager_name VARCHAR,
    notes TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.need_id,
        sn.need_type,
        sn.category,
        sn.description,
        sn.diagnosis_date,
        sn.is_active,
        sn.has_iep,
        sn.iep_start_date,
        sn.iep_end_date,
        sn.accommodations,
        cm.name as case_manager_name,
        sn.notes,
        sn.created_at
    FROM student_special_needs sn
    LEFT JOIN users cm ON sn.case_manager_id = cm.user_id
    WHERE sn.student_id = student_id_param
      AND (active_only = false OR sn.is_active = true)
    ORDER BY sn.is_active DESC, sn.diagnosis_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Get Student Accommodations
-- ============================================
CREATE OR REPLACE FUNCTION get_student_accommodations(
    student_id_param BIGINT,
    active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    accommodation_id BIGINT,
    special_need_id BIGINT,
    accommodation_type VARCHAR,
    title VARCHAR,
    description TEXT,
    implementation_details TEXT,
    frequency VARCHAR,
    is_active BOOLEAN,
    effectiveness_rating INTEGER,
    last_reviewed_date DATE,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.accommodation_id,
        sa.special_need_id,
        sa.accommodation_type,
        sa.title,
        sa.description,
        sa.implementation_details,
        sa.frequency,
        sa.is_active,
        sa.effectiveness_rating,
        sa.last_reviewed_date,
        sa.notes
    FROM student_accommodations sa
    WHERE sa.student_id = student_id_param
      AND (active_only = false OR sa.is_active = true)
    ORDER BY sa.is_active DESC, sa.accommodation_type, sa.title;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Get Student Disciplinary Records
-- ============================================
CREATE OR REPLACE FUNCTION get_student_disciplinary_records(
    student_id_param BIGINT,
    academic_year_param VARCHAR DEFAULT NULL,
    resolved_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
    incident_id BIGINT,
    incident_date DATE,
    incident_type VARCHAR,
    severity VARCHAR,
    description TEXT,
    action_taken VARCHAR,
    action_details TEXT,
    resolved BOOLEAN,
    resolution_date DATE,
    reported_by_name VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        di.incident_id,
        di.incident_date,
        di.incident_type,
        di.severity,
        di.description,
        di.action_taken,
        di.action_details,
        di.resolved,
        di.resolution_date,
        reporter.name as reported_by_name,
        di.created_at
    FROM disciplinary_incidents di
    LEFT JOIN users reporter ON di.reported_by = reporter.user_id
    WHERE di.student_id = student_id_param
      AND (academic_year_param IS NULL OR di.academic_year = academic_year_param)
      AND (resolved_only = false OR di.resolved = true)
    ORDER BY di.incident_date DESC, di.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Get Student Disciplinary Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_student_disciplinary_summary(
    student_id_param BIGINT,
    academic_year_param VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    total_incidents INTEGER,
    minor_incidents INTEGER,
    major_incidents INTEGER,
    severe_incidents INTEGER,
    resolved_incidents INTEGER,
    pending_incidents INTEGER,
    total_suspensions INTEGER,
    total_detentions INTEGER,
    last_incident_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_incidents,
        COUNT(CASE WHEN di.severity = 'MINOR' THEN 1 END)::INTEGER as minor_incidents,
        COUNT(CASE WHEN di.severity IN ('MODERATE', 'MAJOR') THEN 1 END)::INTEGER as major_incidents,
        COUNT(CASE WHEN di.severity = 'SEVERE' THEN 1 END)::INTEGER as severe_incidents,
        COUNT(CASE WHEN di.resolved = true THEN 1 END)::INTEGER as resolved_incidents,
        COUNT(CASE WHEN di.resolved = false THEN 1 END)::INTEGER as pending_incidents,
        COUNT(CASE WHEN di.action_taken LIKE '%SUSPENSION%' THEN 1 END)::INTEGER as total_suspensions,
        COUNT(CASE WHEN di.action_taken LIKE '%DETENTION%' THEN 1 END)::INTEGER as total_detentions,
        MAX(di.incident_date) as last_incident_date
    FROM disciplinary_incidents di
    WHERE di.student_id = student_id_param
      AND (academic_year_param IS NULL OR di.academic_year = academic_year_param);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Create Student Lifecycle Event
-- ============================================
CREATE OR REPLACE FUNCTION create_lifecycle_event(
    student_id_param BIGINT,
    event_type_param VARCHAR,
    event_date_param DATE,
    academic_year_param VARCHAR DEFAULT NULL,
    term_param INTEGER DEFAULT NULL,
    from_school_id_param BIGINT DEFAULT NULL,
    to_school_id_param BIGINT DEFAULT NULL,
    from_class_id_param BIGINT DEFAULT NULL,
    to_class_id_param BIGINT DEFAULT NULL,
    from_grade_param VARCHAR DEFAULT NULL,
    to_grade_param VARCHAR DEFAULT NULL,
    status_param VARCHAR DEFAULT NULL,
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL,
    created_by_param BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    new_event_id BIGINT;
BEGIN
    INSERT INTO student_lifecycle_events (
        student_id,
        event_type,
        event_date,
        academic_year,
        term,
        from_school_id,
        to_school_id,
        from_class_id,
        to_class_id,
        from_grade,
        to_grade,
        status,
        reason,
        notes,
        created_by
    ) VALUES (
        student_id_param,
        event_type_param,
        event_date_param,
        academic_year_param,
        term_param,
        from_school_id_param,
        to_school_id_param,
        from_class_id_param,
        to_class_id_param,
        from_grade_param,
        to_grade_param,
        status_param,
        reason_param,
        notes_param,
        created_by_param
    )
    RETURNING event_id INTO new_event_id;
    
    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_student_profile IS 'Returns complete student profile information';
COMMENT ON FUNCTION get_student_lifecycle IS 'Returns timeline of all lifecycle events for a student';
COMMENT ON FUNCTION get_student_transfers IS 'Returns transfer records for a student';
COMMENT ON FUNCTION get_student_special_needs IS 'Returns special needs and IEP information for a student';
COMMENT ON FUNCTION get_student_accommodations IS 'Returns accommodation records for a student';
COMMENT ON FUNCTION get_student_disciplinary_records IS 'Returns disciplinary incident records for a student';
COMMENT ON FUNCTION get_student_disciplinary_summary IS 'Returns summary statistics of disciplinary records';
COMMENT ON FUNCTION create_lifecycle_event IS 'Creates a new lifecycle event for a student';

