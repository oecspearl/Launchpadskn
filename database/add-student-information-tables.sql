-- LaunchPad SKN - Student Information Management
-- Comprehensive tables for student profiles, lifecycle, transfers, special needs, and disciplinary records

-- ============================================
-- 1. STUDENT PROFILES (Extended Information)
-- ============================================
CREATE TABLE IF NOT EXISTS student_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Academic Information
    student_number VARCHAR(50) UNIQUE, -- Unique student ID number
    enrollment_date DATE,
    graduation_date DATE,
    graduation_status VARCHAR(50) DEFAULT 'ENROLLED', -- ENROLLED, GRADUATED, DROPPED_OUT, TRANSFERRED
    current_grade_level VARCHAR(20),
    academic_year VARCHAR(20),
    gpa DECIMAL(4,2),
    cumulative_gpa DECIMAL(4,2),
    class_rank INTEGER,
    total_credits DECIMAL(5,2) DEFAULT 0.00,
    
    -- Personal Information
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    place_of_birth VARCHAR(200),
    identification_number VARCHAR(100), -- National ID, passport, etc.
    blood_type VARCHAR(10),
    religion VARCHAR(100),
    ethnicity VARCHAR(100),
    
    -- Contact Information
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    home_address TEXT,
    mailing_address TEXT,
    city VARCHAR(100),
    parish VARCHAR(100), -- For SKN context
    country VARCHAR(100) DEFAULT 'Saint Kitts and Nevis',
    postal_code VARCHAR(20),
    
    -- Emergency Contacts
    emergency_contact_1_name VARCHAR(200),
    emergency_contact_1_relationship VARCHAR(50),
    emergency_contact_1_phone VARCHAR(20),
    emergency_contact_1_email VARCHAR(200),
    emergency_contact_2_name VARCHAR(200),
    emergency_contact_2_relationship VARCHAR(50),
    emergency_contact_2_phone VARCHAR(20),
    emergency_contact_2_email VARCHAR(200),
    
    -- Family Information
    guardian_name VARCHAR(200),
    guardian_relationship VARCHAR(50), -- PARENT, GRANDPARENT, GUARDIAN, etc.
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(200),
    guardian_occupation VARCHAR(200),
    guardian_address TEXT,
    
    -- Health Information
    medical_conditions TEXT, -- JSONB or comma-separated
    allergies TEXT,
    medications TEXT,
    doctor_name VARCHAR(200),
    doctor_phone VARCHAR(20),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    health_notes TEXT,
    
    -- Behavioral Information
    behavioral_concerns TEXT,
    behavioral_strengths TEXT,
    counseling_services BOOLEAN DEFAULT false,
    counseling_notes TEXT,
    
    -- Additional Information
    photo_url TEXT,
    notes TEXT,
    metadata JSONB, -- For flexible additional data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id),
    updated_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_student_profiles_student ON student_profiles(student_id);
CREATE INDEX idx_student_profiles_student_number ON student_profiles(student_number);
CREATE INDEX idx_student_profiles_status ON student_profiles(graduation_status);
CREATE INDEX idx_student_profiles_year ON student_profiles(academic_year);

-- ============================================
-- 2. STUDENT LIFECYCLE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS student_lifecycle_events (
    event_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- ENROLLMENT, TRANSFER_IN, TRANSFER_OUT, PROMOTION, RETENTION, GRADUATION, DROPPED_OUT, SUSPENSION, EXPULSION, RETURN
    event_date DATE NOT NULL,
    academic_year VARCHAR(20),
    term INTEGER,
    
    -- Event Details
    from_school_id BIGINT REFERENCES institutions(institution_id),
    to_school_id BIGINT REFERENCES institutions(institution_id),
    from_class_id BIGINT REFERENCES classes(class_id),
    to_class_id BIGINT REFERENCES classes(class_id),
    from_grade VARCHAR(20),
    to_grade VARCHAR(20),
    
    -- Status Information
    status VARCHAR(50), -- ACTIVE, INACTIVE, GRADUATED, TRANSFERRED, etc.
    reason TEXT,
    notes TEXT,
    
    -- Documentation
    documents JSONB, -- Array of document references
    approved_by BIGINT REFERENCES users(user_id),
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_lifecycle_student ON student_lifecycle_events(student_id);
CREATE INDEX idx_lifecycle_type ON student_lifecycle_events(event_type);
CREATE INDEX idx_lifecycle_date ON student_lifecycle_events(event_date);
CREATE INDEX idx_lifecycle_year ON student_lifecycle_events(academic_year);

-- ============================================
-- 3. STUDENT TRANSFERS
-- ============================================
CREATE TABLE IF NOT EXISTS student_transfers (
    transfer_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    transfer_type VARCHAR(50) NOT NULL, -- INCOMING, OUTGOING, INTERNAL
    transfer_date DATE NOT NULL,
    academic_year VARCHAR(20),
    
    -- Source Information
    from_school_id BIGINT REFERENCES institutions(institution_id),
    from_school_name VARCHAR(200),
    from_class_id BIGINT REFERENCES classes(class_id),
    from_class_name VARCHAR(200),
    from_grade VARCHAR(20),
    
    -- Destination Information
    to_school_id BIGINT REFERENCES institutions(institution_id),
    to_school_name VARCHAR(200),
    to_class_id BIGINT REFERENCES classes(class_id),
    to_class_name VARCHAR(200),
    to_grade VARCHAR(20),
    
    -- Transfer Details
    reason TEXT,
    transfer_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    request_date DATE,
    approval_date DATE,
    completion_date DATE,
    
    -- Academic Records
    transcript_required BOOLEAN DEFAULT true,
    transcript_received BOOLEAN DEFAULT false,
    transcript_received_date DATE,
    records_transferred BOOLEAN DEFAULT false,
    records_transferred_date DATE,
    
    -- Financial
    fees_paid BOOLEAN DEFAULT false,
    fees_amount DECIMAL(10,2),
    outstanding_balance DECIMAL(10,2),
    
    -- Documentation
    transfer_application_url TEXT,
    acceptance_letter_url TEXT,
    transcript_url TEXT,
    other_documents JSONB,
    
    -- Approval
    requested_by BIGINT REFERENCES users(user_id),
    approved_by BIGINT REFERENCES users(user_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_student ON student_transfers(student_id);
CREATE INDEX idx_transfers_type ON student_transfers(transfer_type);
CREATE INDEX idx_transfers_status ON student_transfers(transfer_status);
CREATE INDEX idx_transfers_from_school ON student_transfers(from_school_id);
CREATE INDEX idx_transfers_to_school ON student_transfers(to_school_id);

-- ============================================
-- 4. SPECIAL NEEDS TRACKING (IEP & Accommodations)
-- ============================================
CREATE TABLE IF NOT EXISTS student_special_needs (
    need_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    need_type VARCHAR(50) NOT NULL, -- LEARNING_DISABILITY, PHYSICAL_DISABILITY, BEHAVIORAL, MEDICAL, GIFTED, OTHER
    category VARCHAR(100), -- Specific category within type
    description TEXT,
    diagnosis_date DATE,
    diagnosed_by VARCHAR(200), -- Professional who made diagnosis
    diagnosis_document_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    review_date DATE,
    
    -- IEP Information
    has_iep BOOLEAN DEFAULT false,
    iep_start_date DATE,
    iep_end_date DATE,
    iep_review_date DATE,
    iep_document_url TEXT,
    iep_goals TEXT, -- JSONB array of goals
    iep_services TEXT, -- JSONB array of services
    
    -- Accommodations
    accommodations JSONB, -- Array of accommodation objects
    modifications JSONB, -- Array of modification objects
    assistive_technology TEXT, -- List of assistive tech
    
    -- Support Team
    case_manager_id BIGINT REFERENCES users(user_id),
    special_education_teacher_id BIGINT REFERENCES users(user_id),
    counselor_id BIGINT REFERENCES users(user_id),
    support_team JSONB, -- Array of team members
    
    -- Progress Tracking
    progress_notes TEXT,
    last_review_date DATE,
    next_review_date DATE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id),
    updated_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_special_needs_student ON student_special_needs(student_id);
CREATE INDEX idx_special_needs_type ON student_special_needs(need_type);
CREATE INDEX idx_special_needs_active ON student_special_needs(is_active);
CREATE INDEX idx_special_needs_iep ON student_special_needs(has_iep);

-- ============================================
-- 5. ACCOMMODATIONS (Detailed)
-- ============================================
CREATE TABLE IF NOT EXISTS student_accommodations (
    accommodation_id BIGSERIAL PRIMARY KEY,
    special_need_id BIGINT NOT NULL REFERENCES student_special_needs(need_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    accommodation_type VARCHAR(50) NOT NULL, -- TESTING, INSTRUCTIONAL, ENVIRONMENTAL, BEHAVIORAL, TECHNOLOGY
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Implementation
    implementation_details TEXT,
    frequency VARCHAR(50), -- DAILY, WEEKLY, AS_NEEDED, TESTING_ONLY
    applicable_subjects JSONB, -- Array of subject IDs or "ALL"
    applicable_activities JSONB, -- Array of activity types
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    
    -- Monitoring
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    last_reviewed_date DATE,
    reviewed_by BIGINT REFERENCES users(user_id),
    review_notes TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_accommodations_student ON student_accommodations(student_id);
CREATE INDEX idx_accommodations_need ON student_accommodations(special_need_id);
CREATE INDEX idx_accommodations_type ON student_accommodations(accommodation_type);
CREATE INDEX idx_accommodations_active ON student_accommodations(is_active);

-- ============================================
-- 6. DISCIPLINARY RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS disciplinary_incidents (
    incident_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    incident_date DATE NOT NULL,
    incident_time TIME,
    academic_year VARCHAR(20),
    term INTEGER,
    
    -- Incident Details
    incident_type VARCHAR(50) NOT NULL, -- MINOR_INFRACTION, MAJOR_INFRACTION, VIOLENCE, DRUGS, THEFT, VANDALISM, DISRESPECT, TRUANCY, OTHER
    severity VARCHAR(20) DEFAULT 'MINOR', -- MINOR, MODERATE, MAJOR, SEVERE
    location VARCHAR(200),
    description TEXT NOT NULL,
    witnesses TEXT, -- JSONB array of witness names/IDs
    
    -- Violation Information
    violation_code VARCHAR(50), -- School policy violation code
    violation_description TEXT,
    school_policy_reference TEXT,
    
    -- Action Taken
    action_taken VARCHAR(100), -- VERBAL_WARNING, WRITTEN_WARNING, DETENTION, SUSPENSION, EXPULSION, PARENT_MEETING, COUNSELING, OTHER
    action_details TEXT,
    action_date DATE,
    action_duration INTEGER, -- Days for suspension, minutes for detention, etc.
    action_duration_unit VARCHAR(20), -- DAYS, HOURS, MINUTES
    
    -- Consequences
    consequences TEXT, -- Detailed consequences
    restitution_required BOOLEAN DEFAULT false,
    restitution_amount DECIMAL(10,2),
    restitution_description TEXT,
    community_service_hours INTEGER,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    resolved BOOLEAN DEFAULT false,
    resolution_date DATE,
    resolution_notes TEXT,
    
    -- Reporting
    reported_by BIGINT REFERENCES users(user_id),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    investigated_by BIGINT REFERENCES users(user_id),
    investigation_notes TEXT,
    reviewed_by BIGINT REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    
    -- Parent/Guardian Notification
    parent_notified BOOLEAN DEFAULT false,
    parent_notified_date DATE,
    parent_notified_method VARCHAR(50), -- PHONE, EMAIL, LETTER, MEETING
    parent_response TEXT,
    parent_meeting_date DATE,
    parent_meeting_notes TEXT,
    
    -- Documentation
    incident_report_url TEXT,
    witness_statements JSONB,
    evidence_documents JSONB,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id),
    updated_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_incidents_student ON disciplinary_incidents(student_id);
CREATE INDEX idx_incidents_date ON disciplinary_incidents(incident_date);
CREATE INDEX idx_incidents_type ON disciplinary_incidents(incident_type);
CREATE INDEX idx_incidents_severity ON disciplinary_incidents(severity);
CREATE INDEX idx_incidents_resolved ON disciplinary_incidents(resolved);
CREATE INDEX idx_incidents_year ON disciplinary_incidents(academic_year);

-- ============================================
-- 7. DISCIPLINARY ACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    action_id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES disciplinary_incidents(incident_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- DETENTION, SUSPENSION, EXPULSION, PROBATION, WARNING, OTHER
    action_date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    
    -- Action Details
    duration INTEGER, -- Days, hours, or minutes depending on type
    duration_unit VARCHAR(20), -- DAYS, HOURS, MINUTES
    location VARCHAR(200), -- Where action takes place
    description TEXT,
    conditions TEXT, -- Conditions that must be met
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACTIVE, COMPLETED, CANCELLED, APPEALED
    completed_date DATE,
    completion_notes TEXT,
    
    -- Appeals
    appeal_filed BOOLEAN DEFAULT false,
    appeal_date DATE,
    appeal_status VARCHAR(50), -- PENDING, APPROVED, DENIED
    appeal_decision TEXT,
    appeal_decided_by BIGINT REFERENCES users(user_id),
    appeal_decided_at TIMESTAMP,
    
    -- Implementation
    implemented_by BIGINT REFERENCES users(user_id),
    implemented_at TIMESTAMP,
    verified_by BIGINT REFERENCES users(user_id),
    verified_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id)
);

CREATE INDEX idx_actions_incident ON disciplinary_actions(incident_id);
CREATE INDEX idx_actions_student ON disciplinary_actions(student_id);
CREATE INDEX idx_actions_type ON disciplinary_actions(action_type);
CREATE INDEX idx_actions_status ON disciplinary_actions(status);
CREATE INDEX idx_actions_date ON disciplinary_actions(action_date);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE student_profiles IS 'Comprehensive student profile information including academic, personal, health, and family data';
COMMENT ON TABLE student_lifecycle_events IS 'Tracks all major events in a student''s academic journey from enrollment to graduation';
COMMENT ON TABLE student_transfers IS 'Manages student transfers between schools, including incoming, outgoing, and internal transfers';
COMMENT ON TABLE student_special_needs IS 'Tracks special needs, IEPs, and support services for students';
COMMENT ON TABLE student_accommodations IS 'Detailed accommodation records for students with special needs';
COMMENT ON TABLE disciplinary_incidents IS 'Records of disciplinary incidents and violations';
COMMENT ON TABLE disciplinary_actions IS 'Actions taken as a result of disciplinary incidents';

