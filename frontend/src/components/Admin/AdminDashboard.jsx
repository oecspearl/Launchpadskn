import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, GraduationCap, Users2, Layers,
  School, UserCog, Bell, Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import SkeletonLoader from '../common/SkeletonLoader';
import { PageHead, StatsGrid, ActivityFeed } from '../common/dashboard';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTIVITY_ICONS = {
  user: GraduationCap,
  subject: BookOpen,
  class: Layers,
  form: School,
};

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
    recentActivity: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const statsPromise = supabaseService.getDashboardStats().catch((err) => {
        console.warn('[AdminDashboard] Stats fetch error:', err);
        return { totalUsers: 0, totalSubjects: 0, totalInstructors: 0, totalStudents: 0, totalAdmins: 0, totalParents: 0, totalForms: 0, totalClasses: 0 };
      });

      const data = await statsPromise;

      let recentActivity = [];
      try {
        recentActivity = await supabaseService.getRecentActivity(5).catch((err) => {
          console.warn('[AdminDashboard] Activity fetch error:', err);
          return [];
        });
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
        recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
      });

      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);
      setStats((prev) => ({ ...prev, recentActivity: [] }));
      setIsLoading(false);
      setError(null);
    }
  };

  useEffect(() => {
    if (!user && !isAuthenticated) {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
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
      setIsLoading(false);
      return;
    }

    fetchDashboardStats();
  }, [user, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="ed-page">
        <SkeletonLoader variant="dashboard" />
      </div>
    );
  }

  const statItems = [
    { icon: BookOpen, label: 'Total Subjects', value: stats.totalCourses, wide: true },
    { icon: Users, label: 'Total Users', value: stats.totalUsers },
    { icon: Users2, label: 'Instructors', value: stats.totalInstructors },
    { icon: GraduationCap, label: 'Students', value: stats.totalStudents },
    { icon: School, label: 'Total Forms', value: stats.totalForms },
    { icon: Layers, label: 'Total Classes', value: stats.totalClasses },
    { icon: Users2, label: 'Parents', value: stats.totalParents },
    { icon: UserCog, label: 'Admins', value: stats.totalAdmins },
  ];

  const activityItems = (stats.recentActivity || []).map((a, i) => ({
    id: a.id || i,
    icon: ACTIVITY_ICONS[a.type] || Bell,
    primary: [a.user, a.action].filter(Boolean).join(' ').trim() || a.action || 'Activity',
    secondary: a.target,
    time: a.time,
  }));

  return (
    <div className="ed-page">
      <PageHead
        eyebrow={getGreeting()}
        title={user?.name || user?.email || 'Admin'}
        subtitle="Here's the latest activity across your console."
      />

      <section className="ed-section">
        <div className="ed-section-head">
          <h3>Statistics</h3>
          <span className="ed-rule" />
        </div>
        <StatsGrid stats={statItems} />
      </section>

      <section className="ed-section">
        <div className="ed-section-head">
          <h3>Recent Activity</h3>
          <span className="ed-rule" />
        </div>
        <ActivityFeed
          items={activityItems}
          empty={{
            icon: Activity,
            title: 'No recent activity',
            hint: 'Start by creating forms, classes, and subjects',
          }}
        />
      </section>
    </div>
  );
}

export default AdminDashboard;
