import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';
import FirstTimeLoginCheck from '../components/Auth/FirstTimeLoginCheck';

// Lazy load instructor components
const TeacherDashboard = lazy(() => import('../components/Teacher/TeacherDashboard'));
const TeacherClassManagement = lazy(() => import('../components/Teacher/TeacherClassManagement'));
const TeacherLessonView = lazy(() => import('../components/Teacher/TeacherLessonView'));
const LessonPlanning = lazy(() => import('../components/Teacher/LessonPlanning'));
const AttendanceMarking = lazy(() => import('../components/Teacher/AttendanceMarking'));
const GradeEntry = lazy(() => import('../components/Teacher/GradeEntry'));
const Gradebook = lazy(() => import('../components/Teacher/Gradebook'));
const LessonContentManager = lazy(() => import('../components/Teacher/LessonContentManager'));
const Curriculum = lazy(() => import('../components/Teacher/Curriculum'));
const StudentProfileView = lazy(() => import('../components/Teacher/StudentProfileView'));

const InstructorRoutes = () => (
    <>
        <Route
            path="/instructor/dashboard"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <FirstTimeLoginCheck>
                        <TeacherDashboard />
                    </FirstTimeLoginCheck>
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/dashboard"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <TeacherDashboard />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/classes/:classId"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <TeacherClassManagement />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/lessons/:lessonId"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <TeacherLessonView />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/class-subjects/:classSubjectId/lessons"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <LessonPlanning />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/lessons/:lessonId/attendance"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <AttendanceMarking />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/assessments/:assessmentId/grades"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <GradeEntry />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/class-subjects/:classSubjectId/gradebook"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <Gradebook />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/lessons/:lessonId/content"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <LessonContentManager />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/curriculum"
            element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <Curriculum />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/students/:studentId"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <StudentProfileView />
                </PrivateRoute>
            }
        />
    </>
);

export default InstructorRoutes;
