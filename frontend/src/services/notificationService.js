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
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (options.unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (options.type) {
            query = query.eq('type', options.type);
        }

        if (options.archived !== undefined) {
            if (options.archived) {
                query = query.not('archived_at', 'is', null);
            } else {
                query = query.is('archived_at', null);
            }
        } else {
            // By default, exclude archived
            query = query.is('archived_at', null);
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
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .is('archived_at', null);

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
        if (notificationIds === null) {
            // Mark all as read
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false)
                .is('archived_at', null);

            if (error) throw error;
            return { success: true, data };
        } else {
            // Mark specific notification(s) as read
            const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', ids)
                .eq('user_id', userId);

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
            .update({ archived_at: new Date().toISOString() })
            .in('id', ids)
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
            .in('id', ids)
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
        // Direct insert against the live notifications schema
        // (id, user_id, type, title, message, priority, is_read, link, created_at, archived_at).
        // There is no create_notification RPC and no related_id/related_type columns.
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.linkUrl || notification.link || null,
                priority: notification.priority || 'normal',
                is_read: false
            })
            .select('id')
            .single();

        if (error) throw error;
        return { success: true, notificationId: data?.id };
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
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
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
        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: userId,
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
        .subscribe((status, err) => {
            if (err) {
                console.warn('Notification subscription error:', err.message || err);
            }
        });

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
