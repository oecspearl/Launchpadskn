-- ============================================
-- Report Cards System
-- ============================================
-- Run this in Supabase SQL Editor

-- Report Cards table (one per student per term)
CREATE TABLE IF NOT EXISTS report_cards (
  report_card_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES users(user_id),
  institution_id BIGINT REFERENCES institutions(institution_id),
  academic_year VARCHAR(20) NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  class_id BIGINT REFERENCES classes(class_id),
  form_id BIGINT REFERENCES forms(form_id),
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED')),
  attendance_percentage DECIMAL(5,2),
  days_present INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,
  days_late INTEGER DEFAULT 0,
  total_school_days INTEGER DEFAULT 0,
  conduct_grade VARCHAR(20),
  form_teacher_comment TEXT,
  principal_comment TEXT,
  overall_average DECIMAL(5,2),
  class_rank INTEGER,
  generated_by BIGINT REFERENCES users(user_id),
  published_by BIGINT REFERENCES users(user_id),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  next_term_begins DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Card Grades (one per subject per report card)
CREATE TABLE IF NOT EXISTS report_card_grades (
  id BIGSERIAL PRIMARY KEY,
  report_card_id BIGINT REFERENCES report_cards(report_card_id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES subjects(subject_id),
  subject_name VARCHAR(255),
  teacher_id BIGINT REFERENCES users(user_id),
  teacher_name VARCHAR(255),
  coursework_avg DECIMAL(5,2),
  exam_mark DECIMAL(5,2),
  final_mark DECIMAL(5,2),
  grade_letter VARCHAR(5),
  effort_grade VARCHAR(5),
  teacher_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_institution ON report_cards(institution_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_class_term ON report_cards(class_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_report_cards_status ON report_cards(status);
CREATE INDEX IF NOT EXISTS idx_report_card_grades_rc ON report_card_grades(report_card_id);

-- RLS Policies
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_card_grades ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read report cards
CREATE POLICY "Users can read report cards" ON report_cards
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update report cards
CREATE POLICY "Users can insert report cards" ON report_cards
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update report cards" ON report_cards
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage report card grades
CREATE POLICY "Users can read report card grades" ON report_card_grades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert report card grades" ON report_card_grades
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update report card grades" ON report_card_grades
  FOR UPDATE USING (auth.role() = 'authenticated');
