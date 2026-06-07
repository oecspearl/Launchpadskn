/**
 * Schema-compatibility shim for class_subjects → subject.
 *
 * The live schema links `class_subjects` to `subjects` DIRECTLY via `subject_id`
 * (there is no `subject_form_offerings` relationship). Queries therefore embed
 * `subject:subjects(...)`. Older callers, however, read the subject via the
 * legacy nested path `class_subject.subject_offering.subject`.
 *
 * `compatClassSubject` re-exposes that legacy shape from the direct `subject`
 * so existing consumers keep working without edits. Apply it to each
 * class_subjects object in a query result (at whatever depth it appears).
 */
export function compatClassSubject(cs) {
  if (!cs || typeof cs !== 'object') return cs;
  if (cs.subject && !cs.subject_offering) {
    return { ...cs, subject_offering: { subject: cs.subject } };
  }
  return cs;
}
