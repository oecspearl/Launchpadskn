-- ============================================
-- Direct Messaging System (Teacher-Parent)
-- ============================================
-- Run this in Supabase SQL Editor

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id BIGSERIAL PRIMARY KEY,
  institution_id BIGINT REFERENCES institutions(institution_id),
  student_id BIGINT REFERENCES users(user_id),
  subject VARCHAR(255),
  created_by BIGINT REFERENCES users(user_id),
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(user_id),
  last_read_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  message_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES users(user_id),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_institution ON conversations(institution_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read conversations" ON conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update conversations" ON conversations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read conversation participants" ON conversation_participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update conversation participants" ON conversation_participants
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
