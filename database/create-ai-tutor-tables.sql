-- AI Tutor tables for Socratic tutoring system
-- Tables: tutor_settings, tutor_student_overrides, tutor_conversations, tutor_messages

-- ─── TUTOR SETTINGS (teacher class-level toggle) ──────────────────────
CREATE TABLE IF NOT EXISTS tutor_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_settings_class_subject ON tutor_settings(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_settings_teacher ON tutor_settings(teacher_id);

-- ─── TUTOR STUDENT OVERRIDES (per-student exceptions) ─────────────────
CREATE TABLE IF NOT EXISTS tutor_student_overrides (
    override_id BIGSERIAL PRIMARY KEY,
    class_subject_id BIGINT NOT NULL REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(user_id),
    UNIQUE(class_subject_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_overrides_student ON tutor_student_overrides(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_overrides_class_subject ON tutor_student_overrides(class_subject_id);

-- ─── TUTOR CONVERSATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_conversations (
    conversation_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id),
    lesson_id BIGINT REFERENCES lessons(lesson_id),
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_conv_student ON tutor_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_class_subject ON tutor_conversations(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_lesson ON tutor_conversations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_active ON tutor_conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_last_msg ON tutor_conversations(last_message_at DESC);

-- ─── TUTOR MESSAGES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_messages (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES tutor_conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_msg_conversation ON tutor_messages(conversation_id, created_at);

-- ─── RLS POLICIES ─────────────────────────────────────────────────────
ALTER TABLE tutor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_student_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

-- Teachers manage their own tutor settings
CREATE POLICY "Teachers manage tutor settings" ON tutor_settings
    FOR ALL USING (
        teacher_id = (SELECT user_id FROM users WHERE id = auth.uid())
    );

-- Students can read tutor settings for their classes
CREATE POLICY "Students read tutor settings" ON tutor_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_class_assignments sca
            JOIN class_subjects cs ON cs.class_id = sca.class_id
            WHERE cs.class_subject_id = tutor_settings.class_subject_id
              AND sca.student_id = (SELECT user_id FROM users WHERE id = auth.uid())
              AND sca.is_active = true
        )
    );

-- Teachers manage student overrides
CREATE POLICY "Teachers manage tutor overrides" ON tutor_student_overrides
    FOR ALL USING (
        created_by = (SELECT user_id FROM users WHERE id = auth.uid())
    );

-- Students read their own overrides
CREATE POLICY "Students read own overrides" ON tutor_student_overrides
    FOR SELECT USING (
        student_id = (SELECT user_id FROM users WHERE id = auth.uid())
    );

-- Students own their conversations
CREATE POLICY "Students own conversations" ON tutor_conversations
    FOR ALL USING (
        student_id = (SELECT user_id FROM users WHERE id = auth.uid())
    );

-- Teachers can view their students' conversations (read-only)
CREATE POLICY "Teachers view student conversations" ON tutor_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_subjects cs
            JOIN student_class_assignments sca ON sca.class_id = cs.class_id
            WHERE cs.teacher_id = (SELECT user_id FROM users WHERE id = auth.uid())
              AND sca.student_id = tutor_conversations.student_id
              AND sca.is_active = true
        )
    );

-- Messages: access via conversation ownership
CREATE POLICY "Users access messages via conversation" ON tutor_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tutor_conversations tc
            WHERE tc.conversation_id = tutor_messages.conversation_id
              AND tc.student_id = (SELECT user_id FROM users WHERE id = auth.uid())
        )
    );

-- Teachers read messages via student conversations
CREATE POLICY "Teachers read student messages" ON tutor_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutor_conversations tc
            JOIN class_subjects cs ON TRUE
            JOIN student_class_assignments sca ON sca.class_id = cs.class_id
            WHERE tc.conversation_id = tutor_messages.conversation_id
              AND cs.teacher_id = (SELECT user_id FROM users WHERE id = auth.uid())
              AND sca.student_id = tc.student_id
              AND sca.is_active = true
        )
    );
