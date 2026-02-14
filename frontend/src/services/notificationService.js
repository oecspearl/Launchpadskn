/**
 * Notification Service
 * Handles notification CRUD operations and Supabase integration
 */

import { supabase } from '../config/supabase';

/**
 * Fetch notifications for a user
 * @param {number} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Notifications
 */
export const getNotifications = async (userId, options = {}) => {
    try {
        // Resolve numeric user ID if UUID is passed
        let numericUserId = userId;
        if (typeof userId === 'string' && userId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) {
                numericUserId = userProfile.user_id;
            } else {
                console.warn('Could not resolve UUID to numeric ID for notifications');
                return [];
            }
        }

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', numericUserId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (options.unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (options.type) {
            query = query.eq('type', options.type);
        }

        if (options.archived !== undefined) {
            query = query.eq('is_archived', options.archived);
        } else {
            // By default, exclude archived
            query = query.eq('is_archived', false);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (userId) => {
    try {
        // Resolve numeric user ID if UUID is passed
        let numericUserId = userId;
        if (typeof userId === 'string' && userId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) {
                numericUserId = userProfile.user_id;
            } else {
                return 0;
            }
        }

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', numericUserId)
            .eq('is_read', false)
            .eq('is_archived', false);

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

/**
 * Mark notification(s) as read
 * @param {number} userId - User ID
 * @param {number|Array<number>} notificationIds - Notification ID(s) or null for all
 * @returns {Promise<Object>} Update result
 */
export const markAsRead = async (userId, notificationIds = null) => {
    try {
        // Resolve numeric user ID if UUID is passed
        let numericUserId = userId;
        if (typeof userId === 'string' && userId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) {
                numericUserId = userProfile.user_id;
            } else {
                throw new Error('User not found');
            }
        }

        if (notificationIds === null) {
            // Mark all as read
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', numericUserId)
                .eq('is_read', false)
                .eq('is_archived', false);

            if (error) throw error;
            return { success: true, data };
        } else {
            // Mark specific notification(s) as read
            const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('notification_id', ids)
                .eq('user_id', numericUserId);

            if (error) throw error;
            return { success: true, data };
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        throw error;
    }
};

/**
 * Archive notification(s)
 * @param {number} userId - User ID
 * @param {number|Array<number>} notificationIds - Notification ID(s)
 * @returns {Promise<Object>} Update result
 */
export const archiveNotifications = async (userId, notificationIds) => {
    try {
        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_archived: true })
            .in('notification_id', ids)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error archiving notifications:', error);
        throw error;
    }
};

/**
 * Delete notification(s)
 * @param {number} userId - User ID
 * @param {number|Array<number>} notificationIds - Notification ID(s)
 * @returns {Promise<Object>} Delete result
 */
export const deleteNotifications = async (userId, notificationIds) => {
    try {
        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

        const { data, error } = await supabase
            .from('notifications')
            .delete()
            .in('notification_id', ids)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error deleting notifications:', error);
        throw error;
    }
};

/**
 * Create a notification (admin/testing)
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notification) => {
    try {
        const { data, error } = await supabase.rpc('create_notification', {
            p_user_id: notification.userId,
            p_type: notification.type,
            p_title: notification.title,
            p_message: notification.message,
            p_link_url: notification.linkUrl || null,
            p_related_id: notification.relatedId || null,
            p_related_type: notification.relatedType || null,
            p_priority: notification.priority || 'normal'
        });

        if (error) throw error;
        return { success: true, notificationId: data };
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Get notification preferences
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Preferences
 */
export const getPreferences = async (userId) => {
    try {
        // Resolve numeric user ID if UUID is passed
        let numericUserId = userId;
        if (typeof userId === 'string' && userId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) {
                numericUserId = userProfile.user_id;
            } else {
                return getDefaultPreferences();
            }
        }

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', numericUserId)
            .single();

        if (error) {
            // If no preferences exist, return defaults
            if (error.code === 'PGRST116') {
                return getDefaultPreferences();
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return getDefaultPreferences();
    }
};

/**
 * Update notification preferences
 * @param {number} userId - User ID
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Updated preferences
 */
export const updatePreferences = async (userId, preferences) => {
    try {
        // Resolve numeric user ID if UUID is passed
        let numericUserId = userId;
        if (typeof userId === 'string' && userId.includes('-')) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('user_id')
                .eq('id', userId)
                .maybeSingle();

            if (userProfile) {
                numericUserId = userProfile.user_id;
            } else {
                throw new Error('User not found');
            }
        }

        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: numericUserId,
                ...preferences,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
    }
};

/**
 * Get default preferences
 */
const getDefaultPreferences = () => ({
    assignment_notifications: true,
    grade_notifications: true,
    announcement_notifications: true,
    deadline_reminders: true,
    system_notifications: true,
    in_app_enabled: true,
    email_enabled: false,
    push_enabled: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
    digest_enabled: false,
    digest_time: '09:00:00'
});

/**
 * Subscribe to real-time notifications
 * @param {number} userId - User ID
 * @param {Function} callback - Callback for new notifications
 * @returns {Object} Subscription channel
 */
export const subscribeToNotifications = (userId, callback) => {
    const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

/**
 * Unsubscribe from notifications
 * @param {Object} channel - Subscription channel
 */
export const unsubscribeFromNotifications = (channel) => {
    if (channel) {
        supabase.removeChannel(channel);
    }
};

const notificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    archiveNotifications,
    deleteNotifications,
    createNotification,
    getPreferences,
    updatePreferences,
    subscribeToNotifications,
    unsubscribeFromNotifications
};

export default notificationService;
