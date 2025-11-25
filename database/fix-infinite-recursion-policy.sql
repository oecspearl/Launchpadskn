-- LaunchPad SKN - Fix Infinite Recursion in RLS Policy
-- This fixes the infinite recursion error in collaboration_participants policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON collaboration_participants;

-- Recreate without self-reference
CREATE POLICY "Users can view participants in their sessions"
ON collaboration_participants
FOR SELECT
USING (
    -- Users can see their own participant record
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = collaboration_participants.user_id
        AND u.id = auth.uid()
    )
    -- OR they created the session
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        JOIN users u ON cs.created_by = u.user_id
        WHERE cs.session_id = collaboration_participants.session_id
        AND u.id = auth.uid()
    )
    -- OR the session is public
    OR EXISTS (
        SELECT 1 FROM collaboration_sessions cs
        WHERE cs.session_id = collaboration_participants.session_id
        AND cs.is_public = true
    )
);

