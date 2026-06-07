-- ============================================================================
-- Phase 2 Migration 05: Forums + Projects group
-- ============================================================================
-- Creates missing tables: forum_topics, forum_posts, group_projects,
--                         project_tasks, peer_reviews
--
-- Schemas derived from frontend usage under frontend/src:
--   - services/interactiveContentService.js (forum_topics, forum_posts, peer_reviews)
--   - services/collaborationService.js      (group_projects, project_tasks)
--   - components/InteractiveContent/SocialLearning.jsx
--   - components/Collaboration/GroupProjectManagement.jsx
--
-- Conventions:
--   * Every table: id uuid PK DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now()
--   * User-ish columns -> public.users(id)
--   * Intra-group FKs: topic_id->forum_topics, post_id->forum_posts,
--     project_id->group_projects, task_id->project_tasks
--   * References to tables outside this group / not in the existing set are left as
--     plain uuid with an explanatory comment (FLAGGED below).
--   * RLS: admin-all, signed-in read, owner write.
--
-- Existing tables referenced (never recreated):
--   users(id), classes(id), class_subjects(id), subjects(id), forms(id),
--   institutions(id), student_class_assignments(id)
--
-- Idempotent; parent-before-child; runnable in one shot.
-- ============================================================================

-- ============================================================================
-- 1. forum_topics  (parent of forum_posts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.forum_topics (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id        uuid,                       -- FLAGGED: points to a "forums" table not in the existing set / out of this group
    topic_title     text,
    topic_content   text,
    created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- audit author
    is_approved     boolean,
    is_pinned       boolean,
    reply_count     integer,
    view_count      integer,
    created_at      timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.forum_topics.forum_id IS 'FK to a forums table (not present in existing schema / out of this migration group) -- left as plain uuid';

CREATE INDEX IF NOT EXISTS idx_forum_topics_forum_id   ON public.forum_topics(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_by ON public.forum_topics(created_by);

ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forum_topics_admin_all"  ON public.forum_topics;
CREATE POLICY "forum_topics_admin_all"  ON public.forum_topics FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "forum_topics_auth_read"  ON public.forum_topics;
CREATE POLICY "forum_topics_auth_read"  ON public.forum_topics FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "forum_topics_owner_write" ON public.forum_topics;
CREATE POLICY "forum_topics_owner_write" ON public.forum_topics FOR ALL    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 2. forum_posts  (child of forum_topics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id      uuid REFERENCES public.forum_topics(id) ON DELETE CASCADE,
    post_content  text,
    created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- audit author
    is_approved   boolean,
    created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id   ON public.forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_by ON public.forum_posts(created_by);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forum_posts_admin_all"   ON public.forum_posts;
CREATE POLICY "forum_posts_admin_all"   ON public.forum_posts FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "forum_posts_auth_read"   ON public.forum_posts;
CREATE POLICY "forum_posts_auth_read"   ON public.forum_posts FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "forum_posts_owner_write"  ON public.forum_posts;
CREATE POLICY "forum_posts_owner_write"  ON public.forum_posts FOR ALL    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 3. group_projects  (parent of project_tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_projects (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id           uuid,                  -- FLAGGED: points to a collaboration "sessions" table (out of this group)
    title                text,
    description          text,
    project_type         text,
    class_subject_id     uuid REFERENCES public.class_subjects(id) ON DELETE SET NULL,
    due_date             date,
    team_leader_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- owner
    status               text,
    progress_percentage  integer,
    member_count         integer,
    created_at           timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.group_projects.session_id IS 'FK to a collaboration sessions table (out of this migration group) -- left as plain uuid';

CREATE INDEX IF NOT EXISTS idx_group_projects_session_id       ON public.group_projects(session_id);
CREATE INDEX IF NOT EXISTS idx_group_projects_class_subject_id ON public.group_projects(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_group_projects_team_leader_id   ON public.group_projects(team_leader_id);

ALTER TABLE public.group_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_projects_admin_all"   ON public.group_projects;
CREATE POLICY "group_projects_admin_all"   ON public.group_projects FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "group_projects_auth_read"   ON public.group_projects;
CREATE POLICY "group_projects_auth_read"   ON public.group_projects FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "group_projects_owner_write"  ON public.group_projects;
CREATE POLICY "group_projects_owner_write"  ON public.group_projects FOR ALL    USING (team_leader_id = auth.uid()) WITH CHECK (team_leader_id = auth.uid());

-- ============================================================================
-- 4. project_tasks  (child of group_projects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    uuid REFERENCES public.group_projects(id) ON DELETE CASCADE,
    title         text,
    description   text,
    assigned_to   uuid REFERENCES public.users(id) ON DELETE SET NULL,
    priority      text,
    due_date      date,
    created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- owner
    status        text,
    created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id  ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_by  ON public.project_tasks(created_by);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_tasks_admin_all"   ON public.project_tasks;
CREATE POLICY "project_tasks_admin_all"   ON public.project_tasks FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "project_tasks_auth_read"   ON public.project_tasks;
CREATE POLICY "project_tasks_auth_read"   ON public.project_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "project_tasks_owner_write"  ON public.project_tasks;
CREATE POLICY "project_tasks_owner_write"  ON public.project_tasks FOR ALL    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ============================================================================
-- 5. peer_reviews
-- ============================================================================
-- Frontend usage: .from('peer_reviews').select('*').eq('review_assignment_id', ...)
-- and .insert(reviewData). The peer-review UI is "coming soon", so concrete
-- review columns beyond review_assignment_id are inferred from naming conventions
-- and the per-task FK rules (reviewer/reviewee -> users).
CREATE TABLE IF NOT EXISTS public.peer_reviews (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_assignment_id  uuid,                 -- FLAGGED: points to a peer-review assignment table (not in existing set / out of this group)
    reviewer_id           uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- owner (author of the review)
    reviewee_id           uuid REFERENCES public.users(id) ON DELETE SET NULL,
    submission_id         uuid,                 -- FLAGGED: points to student_submissions (another migration group)
    project_id            uuid REFERENCES public.group_projects(id) ON DELETE SET NULL,  -- optional link to reviewed project
    review_score          integer,
    feedback              text,
    status                text,
    created_at            timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.peer_reviews.review_assignment_id IS 'FK to a peer-review assignment table (not in existing schema / out of this migration group) -- left as plain uuid';
COMMENT ON COLUMN public.peer_reviews.submission_id IS 'FK to student_submissions (another migration group) -- left as plain uuid';

CREATE INDEX IF NOT EXISTS idx_peer_reviews_review_assignment_id ON public.peer_reviews(review_assignment_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer_id          ON public.peer_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewee_id          ON public.peer_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission_id        ON public.peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_project_id           ON public.peer_reviews(project_id);

ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "peer_reviews_admin_all"   ON public.peer_reviews;
CREATE POLICY "peer_reviews_admin_all"   ON public.peer_reviews FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "peer_reviews_auth_read"   ON public.peer_reviews;
CREATE POLICY "peer_reviews_auth_read"   ON public.peer_reviews FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "peer_reviews_owner_write"  ON public.peer_reviews;
CREATE POLICY "peer_reviews_owner_write"  ON public.peer_reviews FOR ALL    USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

-- ============================================================================
-- End of migration 05_forums_projects.sql
-- ============================================================================
