import { supabase } from '../config/supabase';
import { ROLES } from '../constants/roles';

// DB role values are lowercase. Normalize incoming role constants (e.g. ROLES.STUDENT='STUDENT')
// to the lowercase enum the database expects, mapping 'TEACHER' -> 'instructor'.
const normalizeRole = (role) => {
    const lower = (role || '').toString().toLowerCase();
    return lower === 'teacher' ? 'instructor' : lower;
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
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .maybeSingle();

        if (!error && data) return data;

        // If still not found, try to insert
        const { data: data3, error: error3 } = await supabase
            .from('users')
            .insert({
                id: userId,
                ...updates
            })
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
    async createUser({ email, password, role = ROLES.STUDENT, institution_id }) {
        // Use signUp (works with anon key) instead of admin.createUser (requires service_role)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role: normalizeRole(role), institution_id },
            },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // Insert profile into custom users table
        const profile = {
            id: authData.user.id,
            email,
            role: normalizeRole(role),
            institution_id,
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
