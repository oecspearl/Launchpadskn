import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';

// Lazy load common components
const ChangePassword = lazy(() => import('../components/Auth/ChangePassword'));
const Profile = lazy(() => import('../components/common/Profile'));
const CourseDetails = lazy(() => import('../components/common/CourseDetails'));
const NotificationPreferences = lazy(() => import('../components/common/NotificationPreferences'));
const NotificationsList = lazy(() => import('../components/common/NotificationsList'));
const SKNCurriculum = lazy(() => import('../components/Teacher/SKNCurriculum'));
const SKNSocialScienceCurriculum = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculum'));

const CommonRoutes = () => (
    <>
        <Route
            path="/change-password"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <ChangePassword />
                </PrivateRoute>
            }
        />
        <Route
            path="/profile"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <Profile />
                </PrivateRoute>
            }
        />
        <Route
            path="/courses/:courseId"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <CourseDetails />
                </PrivateRoute>
            }
        />
        <Route
            path="/notification-preferences"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <NotificationPreferences />
                </PrivateRoute>
            }
        />
        <Route
            path="/notifications"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <NotificationsList />
                </PrivateRoute>
            }
        />
        <Route
            path="/curriculum/skn-mathematics"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <SKNCurriculum />
                </PrivateRoute>
            }
        />
        <Route
            path="/curriculum/skn-social-science"
            element={
                <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <SKNSocialScienceCurriculum />
                </PrivateRoute>
            }
        />
    </>
);

export default CommonRoutes;
