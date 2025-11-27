import { supabase, supabaseAdmin } from '../config/supabase';

export const authService = {
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign up new user
     */
    async signUp(email, password, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // Custom user metadata (name, role, etc.)
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign out current user
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * Reset password (send email)
     */
    async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        return {
            message: 'Password reset email sent successfully. The user will receive an email with instructions to reset their password.',
            email: email
        };
    },

    /**
     * Update password (authenticated user)
     */
    async updatePassword(newPassword) {
        const { data: { user }, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;

        // Also reset the force_password_change flag in the users table
        if (user) {
            await supabase
                .from('users')
                .update({ force_password_change: false })
                .eq('id', user.id);
        }
    },

    /**
     * Direct password reset (requires service role key)
     * @deprecated Use resetPassword (email flow) instead for better security
     */
    async resetUserPasswordDirect(userId, newPassword) {
        // Validate password
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        // Validate that userId is a UUID
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID. Expected a UUID string.');
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            throw new Error(`Invalid UUID format: ${userId}. Please use the user's UUID (id field), not user_id.`);
        }

        // Check if admin client is available
        if (!supabaseAdmin) {
            throw new Error('Service role key not configured. Direct password change requires VITE_SUPABASE_SERVICE_ROLE_KEY environment variable. Please use email reset method instead.');
        }

        // Use admin client with service role key
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) {
            if (error.status === 403 || error.message?.includes('not allowed') || error.message?.includes('403')) {
                throw new Error('Direct password change failed. The service role key may be invalid or expired. Please use email reset method instead.');
            }
            throw error;
        }

        return {
            message: 'Password changed successfully!',
            user: data.user
        };
    }
};
