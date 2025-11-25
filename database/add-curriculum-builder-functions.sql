-- LaunchPad SKN - Curriculum Builder Database Functions
-- RPC functions for curriculum builder operations

-- ============================================
-- 1. Increment Resource Usage Count
-- ============================================
CREATE OR REPLACE FUNCTION increment_resource_usage(resource_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE curriculum_resources
    SET usage_count = usage_count + 1
    WHERE resource_id = increment_resource_usage.resource_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Increment Template Usage Count
-- ============================================
CREATE OR REPLACE FUNCTION increment_template_usage(template_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE curriculum_templates
    SET usage_count = usage_count + 1
    WHERE template_id = increment_template_usage.template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Get Active Editors for Session
-- ============================================
CREATE OR REPLACE FUNCTION get_active_editors(session_id BIGINT)
RETURNS TABLE (
    user_id BIGINT,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    last_seen TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        cse.last_seen
    FROM curriculum_session_editors cse
    JOIN users u ON cse.user_id = u.user_id
    WHERE cse.session_id = get_active_editors.session_id
      AND cse.last_seen > NOW() - INTERVAL '1 minute'
    ORDER BY cse.last_seen DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Clean Up Inactive Sessions
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark sessions as inactive if no editors in last 5 minutes
    UPDATE curriculum_editing_sessions
    SET is_active = false
    WHERE is_active = true
      AND session_id NOT IN (
          SELECT DISTINCT session_id
          FROM curriculum_session_editors
          WHERE last_seen > NOW() - INTERVAL '5 minutes'
      );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Get Curriculum Change Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_curriculum_change_summary(offering_id BIGINT, days INTEGER DEFAULT 30)
RETURNS TABLE (
    change_type VARCHAR,
    change_count BIGINT,
    last_change TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cch.change_type,
        COUNT(*)::BIGINT as change_count,
        MAX(cch.created_at) as last_change
    FROM curriculum_change_history cch
    WHERE cch.offering_id = get_curriculum_change_summary.offering_id
      AND cch.created_at > NOW() - (days || ' days')::INTERVAL
    GROUP BY cch.change_type
    ORDER BY change_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Search Resources
-- ============================================
CREATE OR REPLACE FUNCTION search_curriculum_resources(
    search_term TEXT DEFAULT NULL,
    resource_type_filter VARCHAR DEFAULT NULL,
    subject_id_filter BIGINT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    resource_id BIGINT,
    title VARCHAR,
    description TEXT,
    resource_type VARCHAR,
    url TEXT,
    tags TEXT[],
    usage_count INTEGER,
    rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.resource_id,
        cr.title,
        cr.description,
        cr.resource_type,
        cr.url,
        cr.tags,
        cr.usage_count,
        cr.rating
    FROM curriculum_resources cr
    WHERE (search_term IS NULL OR 
           cr.title ILIKE '%' || search_term || '%' OR
           cr.description ILIKE '%' || search_term || '%' OR
           EXISTS (SELECT 1 FROM unnest(cr.tags) AS tag WHERE tag ILIKE '%' || search_term || '%'))
      AND (resource_type_filter IS NULL OR cr.resource_type = resource_type_filter)
      AND (subject_id_filter IS NULL OR cr.subject_id = subject_id_filter OR cr.is_public = true)
    ORDER BY cr.usage_count DESC, cr.rating DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Get Linked Resources for Curriculum Item
-- ============================================
CREATE OR REPLACE FUNCTION get_linked_resources(offering_id BIGINT, link_path TEXT)
RETURNS TABLE (
    resource_id BIGINT,
    title VARCHAR,
    resource_type VARCHAR,
    url TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.resource_id,
        cr.title,
        cr.resource_type,
        cr.url,
        cr.description
    FROM curriculum_resource_links crl
    JOIN curriculum_resources cr ON crl.resource_id = cr.resource_id
    WHERE crl.offering_id = get_linked_resources.offering_id
      AND crl.link_path = get_linked_resources.link_path
    ORDER BY cr.usage_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION increment_resource_usage IS 'Increments the usage count for a resource';
COMMENT ON FUNCTION increment_template_usage IS 'Increments the usage count for a template';
COMMENT ON FUNCTION get_active_editors IS 'Returns list of active editors in a session';
COMMENT ON FUNCTION cleanup_inactive_sessions IS 'Marks sessions as inactive if no recent activity';
COMMENT ON FUNCTION get_curriculum_change_summary IS 'Returns summary of curriculum changes over specified days';
COMMENT ON FUNCTION search_curriculum_resources IS 'Searches curriculum resources with filters';
COMMENT ON FUNCTION get_linked_resources IS 'Gets all resources linked to a specific curriculum item';

