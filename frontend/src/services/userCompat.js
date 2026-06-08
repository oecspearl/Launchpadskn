/**
 * Schema-compatibility shim for `users` rows.
 *
 * The live `users` table is id / first_name / last_name / is_active, but a lot
 * of older code reads user_id / userId / name / firstName / lastName / isActive.
 * `compatUser` adds those legacy aliases (additively) so people-management
 * screens keep working without per-component edits. Apply it wherever a users
 * row (or list) is returned from the service layer.
 */
export function compatUser(user) {
  if (!user || typeof user !== 'object') return user;
  const out = { ...user };
  if (out.id != null) {
    if (out.user_id == null) out.user_id = out.id;
    if (out.userId == null) out.userId = out.id;
  }
  if (out.first_name != null && out.firstName == null) out.firstName = out.first_name;
  if (out.last_name != null && out.lastName == null) out.lastName = out.last_name;
  if (out.name == null) {
    const composed = [out.first_name, out.last_name].filter(Boolean).join(' ').trim();
    if (composed) out.name = composed;
  }
  if (out.is_active != null && out.isActive == null) out.isActive = out.is_active;
  return out;
}
