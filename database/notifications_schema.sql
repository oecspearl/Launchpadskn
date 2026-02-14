-- Advanced Notifications System - Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'assignment_due',
    'grade_posted',
    'announcement',
    'deadline_reminder',
    'system',
    'lesson_posted'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(500),
  related_id INTEGER,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE user_id = notifications.user_id));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE user_id = notifications.user_id));

-- ============================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY,
  
  -- Notification types enabled
  assignment_notifications BOOLEAN DEFAULT TRUE,
  grade_notifications BOOLEAN DEFAULT TRUE,
  announcement_notifications BOOLEAN DEFAULT TRUE,
  deadline_reminders BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,
  
  -- Delivery methods
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timing preferences
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- Frequency
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_time TIME DEFAULT '09:00:00',
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE user_id = notification_preferences.user_id));

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE user_id = notification_preferences.user_id));

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE user_id = notification_preferences.user_id));

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id INTEGER,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_link_url VARCHAR DEFAULT NULL,
  p_related_id INTEGER DEFAULT NULL,
  p_related_type VARCHAR DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
  new_notification_id INTEGER;
  user_prefs RECORD;
BEGIN
  -- Get user preferences (create default if doesn't exist)
  SELECT * INTO user_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create default preferences
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO user_prefs;
  END IF;
  
  -- Check if user wants this type of notification
  IF (p_type = 'assignment_due' AND user_prefs.assignment_notifications) OR
     (p_type = 'grade_posted' AND user_prefs.grade_notifications) OR
     (p_type = 'announcement' AND user_prefs.announcement_notifications) OR
     (p_type = 'deadline_reminder' AND user_prefs.deadline_reminders) OR
     (p_type = 'system' AND user_prefs.system_notifications) OR
     (p_type = 'lesson_posted' AND user_prefs.announcement_notifications) THEN
    
    -- Create notification
    INSERT INTO notifications (
      user_id, type, title, message, link_url,
      related_id, related_type, priority
    ) VALUES (
      p_user_id, p_type, p_title, p_message, p_link_url,
      p_related_id, p_related_type, p_priority
    ) RETURNING notification_id INTO new_notification_id;
    
    RETURN new_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id INTEGER,
  p_notification_ids INTEGER[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all unread notifications as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE AND is_archived = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id 
      AND notification_id = ANY(p_notification_ids)
      AND is_read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id 
    AND is_read = FALSE 
    AND is_archived = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 4. TEST DATA (Optional - for development)
-- ============================================

-- Create a test notification function
CREATE OR REPLACE FUNCTION create_test_notification(p_user_id INTEGER)
RETURNS void AS $$
BEGIN
  PERFORM create_notification(
    p_user_id,
    'system',
    'Welcome to the LMS!',
    'Thank you for joining. Explore your dashboard to get started.',
    '/student/dashboard',
    NULL,
    NULL,
    'normal'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CLEANUP OLD NOTIFICATIONS (Maintenance)
-- ============================================

-- Archive notifications older than 30 days
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_archived = TRUE
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_archived = FALSE;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- You can set up a cron job to run this function daily
-- Or call it manually: SELECT archive_old_notifications();
