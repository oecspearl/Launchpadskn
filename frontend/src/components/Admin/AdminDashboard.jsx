import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaBook, FaChalkboardTeacher, FaUserGraduate,
  FaBell, FaCalendarAlt, FaUserFriends, FaUserShield
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import SkeletonLoader from '../common/SkeletonLoader';
import './AdminDashboard.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalParents: 0,
    totalForms: 0,
    totalClasses: 0,
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      console.log('[AdminDashboard] Starting to fetch stats...');

      const statsPromise = supabaseService.getDashboardStats().catch(err => {
        console.warn('[AdminDashboard] Stats fetch error:', err);
        return { totalUsers: 0, totalSubjects: 0, totalInstructors: 0, totalStudents: 0, totalAdmins: 0, totalParents: 0, totalForms: 0, totalClasses: 0 };
      });

      let statsResolved = false;
      const statsTimeout = setTimeout(() => {
        if (!statsResolved) {
          console.warn('[AdminDashboard] Stats fetch taking longer than expected...');
        }
      }, 5000);

      const data = await statsPromise;
      statsResolved = true;
      clearTimeout(statsTimeout);

      console.log('[AdminDashboard] Stats received:', data);

      let recentActivity = [];
      try {
        let activityResolved = false;
        const activityPromise = supabaseService.getRecentActivity(5).catch(err => {
          console.warn('[AdminDashboard] Activity fetch error:', err);
          return [];
        });

        const activityTimeout = setTimeout(() => {
          if (!activityResolved) {
            console.warn('[AdminDashboard] Activity fetch taking longer than expected...');
          }
        }, 3000);

        recentActivity = await activityPromise;
        activityResolved = true;
        clearTimeout(activityTimeout);

        console.log('[AdminDashboard] Activity received:', recentActivity?.length || 0);
      } catch (activityError) {
        console.warn('[AdminDashboard] Activity fetch failed:', activityError);
        recentActivity = [];
      }

      setStats({
        totalUsers: data?.totalUsers || 0,
        totalCourses: data?.totalSubjects || data?.totalCourses || 0,
        totalInstructors: data?.totalInstructors || 0,
        totalStudents: data?.totalStudents || 0,
        totalAdmins: data?.totalAdmins || 0,
        totalParents: data?.totalParents || 0,
        totalForms: data?.totalForms || 0,
        totalClasses: data?.totalClasses || 0,
        recentActivity: Array.isArray(recentActivity) ? recentActivity : []
      });

      setIsLoading(false);
      setError(null);

    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);

      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalInstructors: 0,
        totalStudents: 0,
        totalAdmins: 0,
        totalParents: 0,
        totalForms: 0,
        totalClasses: 0,
        recentActivity: []
      });
      setIsLoading(false);
      setError(null);
    }
  };

  useEffect(() => {
    console.log('[AdminDashboard] Component mounted, user:', user?.email, 'isAuthenticated:', isAuthenticated);

    if (!user && !isAuthenticated) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[AdminDashboard] Found stored user, using it:', parsedUser.email);
          setStats(prev => ({ ...prev }));
        } catch (e) {
          console.warn('[AdminDashboard] Could not parse stored user');
        }
      }

      if (!storedUser) {
        console.warn('[AdminDashboard] No user and no stored auth, skipping fetch');
        setIsLoading(false);
        return;
      }
    }

    const userId = user?.userId || user?.id || (() => {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored).userId || JSON.parse(stored).id : null;
      } catch {
        return null;
      }
    })();

    if (!userId) {
      console.warn('[AdminDashboard] No userId available, skipping fetch');
      setIsLoading(false);
      return;
    }

    fetchDashboardStats();

  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="admin-brutalist">
        <div style={{ padding: 32 }}>
          <SkeletonLoader variant="dashboard" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-brutalist">
        <div className="admin-page">
          <div className="admin-alert">
            Dashboard is showing with default values. Some statistics may not be available.
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: <FaUsers />, label: 'Total Users', value: stats.totalUsers, accent: 'var(--skn-green)' },
    { icon: <FaBook />, label: 'Total Subjects', value: stats.totalCourses, accent: '#3b82f6' },
    { icon: <FaChalkboardTeacher />, label: 'Instructors', value: stats.totalInstructors, accent: 'var(--skn-green)' },
    { icon: <FaUserGraduate />, label: 'Students', value: stats.totalStudents, accent: 'var(--skn-yellow)' },
    { icon: <FaCalendarAlt />, label: 'Total Forms', value: stats.totalForms, accent: 'var(--skn-green)' },
    { icon: <FaUsers />, label: 'Total Classes', value: stats.totalClasses, accent: '#3b82f6' },
    { icon: <FaUserFriends />, label: 'Parents', value: stats.totalParents, accent: '#06b6d4' },
    { icon: <FaUserShield />, label: 'Admins', value: stats.totalAdmins, accent: 'var(--skn-red)' },
  ];

  return (
    <div className="admin-brutalist">
      {/* Hero */}
      <div className="admin-hero">
        <div className="admin-hero__bg-grid" />
        <div className="admin-hero__bg-green" />
        <div className="admin-hero__bg-ink" />
        <div className="admin-hero__bg-diag-red" />

        <div className="admin-hero__content">
          <div className="admin-hero__rule" />
          <div className="admin-hero__greeting">{getGreeting()}</div>
          <h1 className="admin-hero__name">{user?.name || user?.email || 'Admin'}</h1>
          <div className="admin-hero__meta">System overview and recent activity</div>
        </div>
      </div>

      {/* Page Content */}
      <div className="admin-page">
        {/* Stats Grid */}
        <div className="admin-section fade-up fade-up-1">
          <div className="admin-section-header">
            <h2 className="admin-section-title">System Statistics</h2>
          </div>

          <div className="admin-stats">
            {statItems.map((item, idx) => (
              <div key={idx} className="admin-stat" style={{ '--stat-accent': item.accent }}>
                <div className="admin-stat__icon">{item.icon}</div>
                <div className="admin-stat__label">{item.label}</div>
                <div className="admin-stat__value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-section fade-up fade-up-2">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Activity</h2>
          </div>

          <div className="admin-activity">
            <div className="admin-activity__header">
              <h4 className="admin-activity__title">Activity Log</h4>
            </div>
            <div className="admin-activity__body">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => {
                  const iconClass = activity.type === 'user' ? 'admin-activity-row__icon--user' :
                    activity.type === 'subject' ? 'admin-activity-row__icon--subject' :
                    activity.type === 'class' ? 'admin-activity-row__icon--class' :
                    activity.type === 'form' ? 'admin-activity-row__icon--form' :
                    'admin-activity-row__icon--user';

                  const IconComponent = activity.type === 'user' ? FaUserGraduate :
                    activity.type === 'subject' ? FaBook :
                    activity.type === 'class' ? FaUsers :
                    activity.type === 'form' ? FaChalkboardTeacher :
                    FaBell;

                  return (
                    <div key={activity.id || index} className="admin-activity-row">
                      <div className={`admin-activity-row__icon ${iconClass}`}>
                        <IconComponent />
                      </div>
                      <div className="admin-activity-row__content">
                        <div className="admin-activity-row__text">
                          <strong>{activity.user}</strong> {activity.action} <strong>{activity.target}</strong>
                        </div>
                        <div className="admin-activity-row__time">{activity.time}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty__icon"><FaBell /></div>
                  <div className="admin-empty__text">No recent activity</div>
                  <div className="admin-empty__hint">Start by creating forms, classes, and subjects</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
