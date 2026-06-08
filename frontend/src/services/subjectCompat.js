/**
 * Schema-compatibility shims for subjects / class_subjects.
 *
 * The live `subjects` table is id / name / code, and `class_subjects` links to
 * it DIRECTLY via subject_id (there is no `subject_form_offerings` relationship).
 * Older code, however, reads subject_id / subject_name / subject_code and the
 * nested path `class_subject.subject_offering.subject`. These helpers re-expose
 * those legacy aliases so consumers keep working without edits.
 */

/** Add legacy subject_id/subject_name/subject_code aliases to a subjects row. */
export function compatSubject(subject) {
  if (!subject || typeof subject !== 'object') return subject;
  const out = { ...subject };
  if (out.id != null && out.subject_id == null) out.subject_id = out.id;
  if (out.name != null && out.subject_name == null) out.subject_name = out.name;
  if (out.code != null && out.subject_code == null) out.subject_code = out.code;
  return out;
}

/**
 * Re-expose a class_subjects row's direct `subject` under the legacy
 * `subject_offering.subject` shape, and alias the subject's own fields.
 */
export function compatClassSubject(cs) {
  if (!cs || typeof cs !== 'object') return cs;
  if (!cs.subject) return cs;
  const subject = compatSubject(cs.subject);
  return {
    ...cs,
    subject,
    subject_offering: cs.subject_offering || { subject },
  };
}
