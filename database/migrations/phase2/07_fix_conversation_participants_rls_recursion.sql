-- ============================================================================
-- Fix: infinite recursion in conversation_participants RLS (pre-existing bug)
-- ============================================================================
-- Symptom: GET /rest/v1/conversation_participants ... -> 500 Internal Server Error
-- Cause:   Two SELECT policies on conversation_participants each queried
--          conversation_participants from inside a conversation_participants
--          policy, which Postgres rejects as "infinite recursion detected in
--          policy for relation conversation_participants". This also cascaded
--          to conversations/messages whose policies read that table.
-- Fix:     A SECURITY DEFINER helper tests membership while bypassing RLS
--          (no recursion), used by a single non-recursive SELECT policy.
-- Applied to the live DB via apply_migration on 2026-06-07.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Participants can read" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can read participants in own conversations" ON public.conversation_participants;

DROP POLICY IF EXISTS "cp_select_member" ON public.conversation_participants;
CREATE POLICY "cp_select_member" ON public.conversation_participants
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR public.is_conversation_member(conversation_id)
  );
