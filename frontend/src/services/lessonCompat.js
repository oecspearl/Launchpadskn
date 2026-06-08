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
