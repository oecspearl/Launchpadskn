import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';

// Lazy load common components
const ChangePassword = lazy(() => import('../components/Auth/ChangePassword'));
const Profile = lazy(() => import('../components/common/Profile'));
const CourseDetails = lazy(() => import('../components/common/CourseDetails'));

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
    </>
);

export default CommonRoutes;
