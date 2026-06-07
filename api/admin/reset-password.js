// Vercel serverless function: POST /api/admin/reset-password
// Lets an ADMIN set another user's password. The Supabase service-role key is
// used ONLY here, server-side (never shipped to the browser). The caller is
// authenticated via their access token and must have an admin role.
//
// Body: { userId: <uuid>, newPassword: <string> }
// Header: Authorization: Bearer <caller access_token>

const clean = (v) => (v || '').trim().replace(/^"|"$/g, '').replace(/\\n$/, '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/$/, '');
  const SERVICE_KEY = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const ANON_KEY = clean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server is not configured for admin password reset.' });
  }

  const { userId, newPassword } = req.body || {};
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return res.status(400).json({ error: 'A valid userId (UUID) is required.' });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // 1. Identify the caller from their bearer token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token.' });

  try {
    const meResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${token}` }
    });
    if (!meResp.ok) return res.status(401).json({ error: 'Invalid or expired session.' });
    const me = await meResp.json();
    const callerId = me && me.id;
    if (!callerId) return res.status(401).json({ error: 'Could not identify the caller.' });

    // 2. Authorize: caller must be admin / super_admin (checked server-side)
    const roleResp = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=role&id=eq.${callerId}`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const roleRows = roleResp.ok ? await roleResp.json() : [];
    const callerRole = roleRows && roleRows[0] && roleRows[0].role;
    if (!['admin', 'super_admin'].includes(callerRole)) {
      return res.status(403).json({ error: 'Only administrators can reset another user\'s password.' });
    }

    // 3. Set the target user's password via the GoTrue admin API (service role)
    const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: String(newPassword) })
    });

    if (!upd.ok) {
      const detail = await upd.text().catch(() => '');
      return res.status(upd.status).json({ error: `Password update failed: ${detail || upd.statusText}` });
    }

    return res.status(200).json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('[reset-password] error:', err.message);
    return res.status(500).json({ error: 'Password reset request failed.' });
  }
};
