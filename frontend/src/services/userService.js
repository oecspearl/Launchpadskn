import { supabase } from '../config/supabase';
import { ROLES } from '../constants/roles';

const isUUID = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const userService = {
    /**
     * Get user profile from users table
     * Uses id (UUID) or user_id (numeric) based on format
     */
    async getUserProfile(userId) {
        const col = isUUID(userId) ? 'id' : 'user_id';
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq(col, userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data;

        // Fallback: try the other column
        const fallbackCol = col === 'id' ? 'user_id' : 'id';
        const { data: data2, error: error2 } = await supabase
            .from('users')
            .select('*')
            .eq(fallbackCol, userId)
            .maybeSingle();

        if (error2 && error2.code !== 'PGRST116') throw error2;
        if (data2) return data2;

        throw new Error('User profile not found');
    },

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        const col = isUUID(userId) ? 'id' : 'user_id';
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq(col, userId)
            .select()
            .maybeSingle();

        if (!error && data) return data;

        // Fallback: try the other column
        const fallbackCol = col === 'id' ? 'user_id' : 'id';
        const { data: data2, error: error2 } = await supabase
            .from('users')
            .update(updates)
            .eq(fallbackCol, userId)
            .select()
            .maybeSingle();

        if (error2 && error2.code !== 'PGRST116') throw error2;
        if (data2) return data2;

        // If still not found, try to insert
        const { data: data3, error: error3 } = await supabase
            .from('users')
            .insert({
                ...(isUUID(userId) ? { id: userId } : { user_id: userId }),
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
            .eq('role', role)
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

        const { data, error } = await query.order('name');

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
                data: { role: role.toUpperCase(), institution_id },
            },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // Insert profile into custom users table
        const profile = {
            id: authData.user.id,
            email,
            role: role.toUpperCase(),
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
            .eq('user_id', userId);
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
            .eq('user_id', userId);
        if (error) throw error;
        return true;
    },

    /**
     * Check if user has access to an institution
     */
    async hasInstitutionAccess(userId, institutionId) {
        const user = await this.getUserProfile(userId);

        if (!user) return false;

        // Super Admin has access to all institutions
        if (user.role === ROLES.ADMIN) return true;

        // School Admin has access to their institution
        if (user.role === ROLES.SCHOOL_ADMIN) {
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

        // Super Admin can access all institutions
        if (user.role === ROLES.ADMIN) {
            const { data: institutions } = await supabase
                .from('institutions')
                .select('institution_id');
            return institutions?.map(i => i.institution_id) || [];
        }

        // School Admin can access their institution
        if (user.role === ROLES.SCHOOL_ADMIN && user.institution_id) {
            return [user.institution_id];
        }

        return [];
    },

    /**
     * Set force_password_change flag for a user
     */
    async setForcePasswordChange(userId, forceChange) {
        const col = isUUID(userId) ? 'id' : 'user_id';
        const { error } = await supabase
            .from('users')
            .update({ force_password_change: forceChange })
            .eq(col, userId);

        if (error) {
            // Fallback: try the other column
            const fallbackCol = col === 'id' ? 'user_id' : 'id';
            const { error: error2 } = await supabase
                .from('users')
                .update({ force_password_change: forceChange })
                .eq(fallbackCol, userId);

            if (error2) throw error2;
        }
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
            query = query.eq('role', userRole.toUpperCase());
        }

        const { data, error } = await query.order('name');
        if (error) throw error;
        return data || [];
    }
};
