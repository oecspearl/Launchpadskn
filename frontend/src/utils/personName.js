/**
 * Display name for a user-like object from the live schema.
 * The `users` table has first_name/last_name (no `name` column), but some
 * service results may still carry a composed `name`. Handle both, then email.
 *
 * @param {object|null|undefined} o - user-like object (joined row or mapped)
 * @param {string} [fallback='']  - value when nothing usable is present
 * @returns {string}
 */
export function personName(o, fallback = '') {
  if (!o) return fallback;
  const composed = [o.first_name, o.last_name].filter(Boolean).join(' ').trim();
  return o.name || composed || o.full_name || o.email || fallback;
}

export default personName;
