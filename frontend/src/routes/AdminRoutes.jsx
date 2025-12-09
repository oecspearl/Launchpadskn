import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';
import FirstTimeLoginCheck from '../components/Auth/FirstTimeLoginCheck';

// Lazy load admin components
const AdminDashboard = lazy(() => import('../components/Admin/AdminDashboard'));
const ManageCourses = lazy(() => import('../components/Admin/ManageCourses'));
const ManageInstructors = lazy(() => import('../components/Admin/ManageInstructors'));
const ManageDepartments = lazy(() => import('../components/Admin/ManageDepartments'));
const CourseAssignment = lazy(() => import('../components/Admin/CourseAssignment'));
const EnrollmentApproval = lazy(() => import('../components/Admin/EnrollmentApproval'));
const FormManagement = lazy(() => import('../components/Admin/FormManagement'));
const ClassManagement = lazy(() => import('../components/Admin/ClassManagement'));
const SubjectManagement = lazy(() => import('../components/Admin/SubjectManagement'));
const StudentAssignment = lazy(() => import('../components/Admin/StudentAssignment'));
const ClassSubjectAssignment = lazy(() => import('../components/Admin/ClassSubjectAssignment'));
const UserManagement = lazy(() => import('../components/Admin/UserManagement'));
const ARVRContentManager = lazy(() => import('../components/Admin/ARVRContentManager'));
const AdminHelpPage = lazy(() => import('../components/Help/AdminHelpPage'));

const AdminRoutes = () => (
    <>
        <Route
            path="/admin/dashboard"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <FirstTimeLoginCheck>
                        <AdminDashboard />
                    </FirstTimeLoginCheck>
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/courses"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ManageCourses />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/forms"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <FormManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/classes"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ClassManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/subjects"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <SubjectManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/student-assignment"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <StudentAssignment />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/class-subject-assignment"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ClassSubjectAssignment />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/instructors"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ManageInstructors />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/departments"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ManageDepartments />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/course-assignment"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <CourseAssignment />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/enrollment-approval"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <EnrollmentApproval />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/users"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <UserManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/arvr-content"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <ARVRContentManager />
                </PrivateRoute>
            }
        />
        <Route
            path="/admin/help"
            element={
                <PrivateRoute allowedRoles={['admin']}>
                    <AdminHelpPage />
                </PrivateRoute>
            }
        />
    </>
);

export default AdminRoutes;
