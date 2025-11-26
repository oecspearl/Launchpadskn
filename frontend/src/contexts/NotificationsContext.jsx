import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContextSupabase';
import { useToast } from './ToastContext';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications
} from '../services/notificationService';

const NotificationsContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationsProvider');
    }
    return context;
};

export const NotificationsProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const { showInfo } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [realtimeChannel, setRealtimeChannel] = useState(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async (options = {}) => {
        if (!user?.user_id && !user?.userId) return;

        try {
            setIsLoading(true);
            const userId = user.user_id || user.userId;
            const data = await getNotifications(userId, options);
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user?.user_id && !user?.userId) return;

        try {
            const userId = user.user_id || user.userId;
            const count = await getUnreadCount(userId);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [user]);

    // Mark notification(s) as read
    const markNotificationAsRead = useCallback(async (notificationIds = null) => {
        if (!user?.user_id && !user?.userId) return;

        try {
            const userId = user.user_id || user.userId;
            await markAsRead(userId, notificationIds);

            // Update local state
            if (notificationIds === null) {
                // Mark all as read
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            } else {
                const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
                setNotifications(prev =>
                    prev.map(n => ids.includes(n.notification_id) ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - ids.length));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, [user]);

    // Handle new real-time notification
    const handleNewNotification = useCallback((notification) => {
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);

        // Increment unread count
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        showInfo(notification.title);

        // Optional: Play notification sound
        // playNotificationSound();
    }, [showInfo]);

    // Set up real-time subscription
    useEffect(() => {
        if (!isAuthenticated || !user?.user_id && !user?.userId) {
            return;
        }

        const userId = user.user_id || user.userId;

        // Subscribe to real-time notifications
        const channel = subscribeToNotifications(userId, handleNewNotification);
        setRealtimeChannel(channel);

        // Initial fetch
        fetchNotifications({ limit: 10 });
        fetchUnreadCount();

        // Cleanup
        return () => {
            if (channel) {
                unsubscribeFromNotifications(channel);
            }
        };
    }, [isAuthenticated, user, handleNewNotification, fetchNotifications, fetchUnreadCount]);

    // Refresh notifications periodically (fallback for realtime)
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, [isAuthenticated, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        refreshNotifications: fetchNotifications
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
};
