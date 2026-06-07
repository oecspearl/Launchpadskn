import { supabase } from '../config/supabase';
// DB role values are lowercase; `toDbRole` maps app role constants (e.g.
// ROLES.STUDENT='STUDENT') to the lowercase enum the database expects.
import { ROLES, toDbRole as normalizeRole } from '../constants/roles';

// Columns that actually exist on public.users. Used to sanitize update payloads
// (the live schema has no `name`/`user_id`/`emergency_contact` columns).
const USER_COLUMNS = new Set([
    'email', 'first_name', 'last_name', 'role', 'phone', 'date_of_birth', 'address',
    'profile_image_url', 'institution_id', 'is_active', 'force_password_change',
    'consent_given', 'consent_date', 'consent_version', 'last_login_at',
]);

// Map a loose updates object to valid users columns:
//  - `name` -> first_name/last_name
//  - empty institution_id -> null (it is a uuid column)
//  - lowercase role; drop any unknown keys
const sanitizeUserUpdates = (updates = {}) => {
    const out = {};
    for (const [k, v] of Object.entries(updates)) {
        if (k === 'name') {
            const parts = String(v || '').trim().split(/\s+/).filter(Boolean);
            if (parts[0]) out.first_name = parts[0];
            if (parts.length > 1) out.last_name = parts.slice(1).join(' ');
        } else if (k === 'institution_id') {
            out.institution_id = v === '' || v === undefined ? null : v;
        } else if (k === 'role') {
            out.role = normalizeRole(v);
        } else if (USER_COLUMNS.has(k)) {
            out[k] = v;
        }
        // unknown keys (user_id, name handled above, etc.) are dropped
    }
    return out;
};

export const userService = {
    /**
     * Get user profile from users table
     * Looks up by id (UUID primary key)
     */
    async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data;

        throw new Error('User profile not found');
    },

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        const clean = sanitizeUserUpdates(updates);

        const { data, error } = await supabase
            .from('users')
            .update(clean)
            .eq('id', userId)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (data) return data;

        // No existing profile. We can only create one if we have an email
        // (NOT NULL). Never insert a partial row — that caused
        // "null value in column email" errors.
        if (!clean.email) {
            throw new Error('User profile not found for this account. Create the user (with an email) before updating it.');
        }
        const { data: data3, error: error3 } = await supabase
            .from('users')
            .insert({ id: userId, is_active: true, ...clean })
            .select()
            .single();

        if (error3) throw error3;
        return data3;
    },

    /**
     * Get users by role
     */
    async getUsersByRole(role) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', normalizeRole(role))
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get all users (optionally filtered by institution)
     */
    async getAllUsers(institutionId = null) {
        let query = supabase
            .from('users')
            .select('*')
            .eq('is_active', true);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query.order('first_name');

        if (error) throw error;
        return data;
    },

    /**
     * Create a new user (admin creates with email, password, role, institution_id)
     */
    async createUser({ email, password, name, role = ROLES.STUDENT, institution_id }) {
        if (!email) throw new Error('Email is required to create a user.');
        const inst = institution_id === '' || institution_id === undefined ? null : institution_id;

        // Use signUp (works with anon key) instead of admin.createUser (requires service_role)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name: name || null, role: normalizeRole(role), institution_id: inst },
            },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // Insert profile into custom users table (schema uses first_name/last_name, no `name`)
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        const profile = {
            id: authData.user.id,
            email,
            first_name: parts[0] || null,
            last_name: parts.length > 1 ? parts.slice(1).join(' ') : null,
            role: normalizeRole(role),
            institution_id: inst,
            is_active: true,
        };
        const { error: profileError } = await supabase.from('users').insert(profile);
        if (profileError) throw profileError;
        return authData.user;
    },

    /**
     * Assign a user to an institution
     */
    async assignUserToInstitution(userId, institutionId) {
        const { error } = await supabase
            .from('users')
            .update({ institution_id: institutionId })
            .eq('id', userId);
        if (error) throw error;
        return true;
    },

    /**
     * Soft-delete a user
     */
    async deleteUser(userId) {
        const { error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', userId);
        if (error) throw error;
        return true;
    },

    /**
     * Check if user has access to an institution
     */
    async hasInstitutionAccess(userId, institutionId) {
        const user = await this.getUserProfile(userId);

        if (!user) return false;

        // Super Admin has access to all institutions (DB roles are lowercase)
        if (user.role === 'admin' || user.role === 'super_admin') return true;

        // School Admin has access to their institution
        if (user.role === 'school_admin') {
            return user.institution_id === institutionId;
        }

        return false;
    },

    /**
     * Get user's accessible institution IDs
     */
    async getUserInstitutionIds(userId) {
        const user = await this.getUserProfile(userId);

        if (!user) return [];

        // Super Admin can access all institutions (DB roles are lowercase)
        if (user.role === 'admin' || user.role === 'super_admin') {
            const { data: institutions } = await supabase
                .from('institutions')
                .select('id');
            return institutions?.map(i => i.id) || [];
        }

        // School Admin can access their institution
        if (user.role === 'school_admin' && user.institution_id) {
            return [user.institution_id];
        }

        return [];
    },

    /**
     * Set force_password_change flag for a user
     */
    async setForcePasswordChange(userId, forceChange) {
        const { error } = await supabase
            .from('users')
            .update({ force_password_change: forceChange })
            .eq('id', userId);

        if (error) throw error;
        return true;
    },

    /**
     * Bulk create users
     * Returns object with successes and failures
     */
    async bulkCreateUsers(users) {
        const results = {
            success: [],
            failed: []
        };

        for (const user of users) {
            try {
                // Validate required fields
                if (!user.email || !user.password) {
                    throw new Error('Email and password are required');
                }

                // Create user
                const createdUser = await this.createUser({
                    email: user.email,
                    password: user.password,
                    role: user.role || ROLES.STUDENT,
                    institution_id: user.institution_id
                });

                results.success.push({ email: user.email, id: createdUser.id });
            } catch (err) {
                if (import.meta.env.DEV) console.error(`Failed to create user ${user.email}:`, err);
                results.failed.push({
                    email: user.email,
                    reason: err.message || 'Unknown error'
                });
            }
        }

        return results;
    },

    /**
     * Get institution-scoped users
     */
    async getUsersByInstitution(institutionId, userRole = null) {
        let query = supabase
            .from('users')
            .select('*')
            .eq('institution_id', institutionId)
            .eq('is_active', true);

        if (userRole) {
            query = query.eq('role', normalizeRole(userRole));
        }

        const { data, error } = await query.order('first_name');
        if (error) throw error;
        return data || [];
    }
};
