import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';
import FirstTimeLoginCheck from '../components/Auth/FirstTimeLoginCheck';

// Lazy load school admin components
const SchoolAdminDashboard = lazy(() => import('../components/SchoolAdmin/SchoolAdminDashboard'));
const InstitutionScopedFormManagement = lazy(() => import('../components/SchoolAdmin/InstitutionScopedFormManagement'));
const InstitutionScopedClassManagement = lazy(() => import('../components/SchoolAdmin/InstitutionScopedClassManagement'));
const InstitutionScopedSubjectManagement = lazy(() => import('../components/SchoolAdmin/InstitutionScopedSubjectManagement'));
const InstitutionScopedStudentManagement = lazy(() => import('../components/SchoolAdmin/InstitutionScopedStudentManagement'));
const InstitutionScopedInstructorManagement = lazy(() => import('../components/SchoolAdmin/InstitutionScopedInstructorManagement'));
const InstitutionScopedReports = lazy(() => import('../components/SchoolAdmin/InstitutionScopedReports'));
const ReportCardManagement = lazy(() => import('../components/SchoolAdmin/ReportCardManagement'));

const SchoolAdminRoutes = () => (
    <>
        <Route
            path="/school-admin/dashboard"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <FirstTimeLoginCheck>
                        <SchoolAdminDashboard />
                    </FirstTimeLoginCheck>
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/forms"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedFormManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/classes"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedClassManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/subjects"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedSubjectManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/students"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedStudentManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/instructors"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedInstructorManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/reports"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <InstitutionScopedReports />
                </PrivateRoute>
            }
        />
        <Route
            path="/school-admin/report-cards"
            element={
                <PrivateRoute allowedRoles={['admin', 'school_admin']}>
                    <ReportCardManagement />
                </PrivateRoute>
            }
        />
    </>
);

export default SchoolAdminRoutes;
