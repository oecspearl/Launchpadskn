-- Add metadata column to tutor_messages for storing resource data (YouTube videos, web links)
-- Run this BEFORE deploying the resource search feature

ALTER TABLE tutor_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
