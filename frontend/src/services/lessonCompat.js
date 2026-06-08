/**
 * Schema-compatibility shims for the lessons / lesson_content domain.
 *
 * The live schema renamed columns the code still references:
 *   lessons:        id (was lesson_id), date (was lesson_date), title (was lesson_title)
 *   lesson_content: id (was content_id), order_index (was sequence_order)
 *
 * Queries must use the real column names (PostgREST rejects the old ones), but
 * many consumers still read `lesson.lesson_date` / `content.content_id` etc.
 * These helpers re-expose the legacy aliases on read, and translate legacy
 * keys to real columns on write, so consumers keep working without edits.
 */

/** Read: expose legacy lesson aliases (lesson_id/lesson_date/lesson_title). */
export function compatLessonRead(lesson) {
  if (!lesson || typeof lesson !== 'object') return lesson;
  const out = { ...lesson };
  if (out.id != null && out.lesson_id == null) out.lesson_id = out.id;
  if (out.date != null && out.lesson_date == null) out.lesson_date = out.date;
  if (out.title != null && out.lesson_title == null) out.lesson_title = out.title;
  return out;
}

/** Write: translate legacy lesson keys to real columns, drop stale ids. */
export function compatLessonWrite(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  if ('lesson_date' in out) {
    if (out.date == null) out.date = out.lesson_date;
    delete out.lesson_date;
  }
  if ('lesson_title' in out) {
    if (out.title == null) out.title = out.lesson_title;
    delete out.lesson_title;
  }
  delete out.lesson_id; // PK alias must never be written
  return out;
}

/** Read: expose legacy lesson_content aliases (content_id/sequence_order). */
export function compatLessonContentRead(content) {
  if (!content || typeof content !== 'object') return content;
  const out = { ...content };
  if (out.id != null && out.content_id == null) out.content_id = out.id;
  if (out.order_index != null && out.sequence_order == null) out.sequence_order = out.order_index;
  return out;
}

// Columns that actually exist on public.lesson_content (live schema).
const LESSON_CONTENT_COLUMNS = new Set([
  'lesson_id', 'content_type', 'title', 'description', 'file_url', 'external_url',
  'order_index', 'is_required', 'instructions', 'learning_outcomes', 'key_concepts',
  'discussion_prompts', 'content_data', 'content_section', 'estimated_minutes',
  'file_path', 'file_name', 'file_size', 'mime_type', 'edu_content_id', 'lesson_phase',
]);

/**
 * Write: sanitize a lesson_content insert/update payload to columns that exist.
 * Maps legacy keys (sequence_order/content_order -> order_index, url/content_url
 * -> external_url) and DROPS everything else (content_id/id PK, uploaded_by,
 * is_published, published_at, metadata, upload_date, and the text-block fields
 * learning_activities/reflection_questions/summary which are not real columns).
 */
export function sanitizeLessonContentWrite(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (LESSON_CONTENT_COLUMNS.has(k)) {
      out[k] = v;
    } else if ((k === 'sequence_order' || k === 'content_order') && out.order_index == null) {
      out.order_index = v;
    } else if ((k === 'url' || k === 'content_url') && out.external_url == null) {
      out.external_url = v;
    }
    // otherwise: drop (non-existent column)
  }
  return out;
}
