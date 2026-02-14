-- Add virtual classroom support to lessons
-- This allows teachers to link a virtual classroom (collaboration session) to a lesson

-- Add session_id column to lessons table to link to collaboration sessions (virtual classrooms)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES collaboration_sessions(session_id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_session ON lessons(session_id);

-- Add comment
COMMENT ON COLUMN lessons.session_id IS 'Optional link to a collaboration session (virtual classroom) for this lesson';

