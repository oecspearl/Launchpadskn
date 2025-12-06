import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';

// Lazy load student components
const StudentDashboard = lazy(() => import('../components/Student/StudentDashboard'));
const SubjectView = lazy(() => import('../components/Student/SubjectView'));
const LessonViewStream = lazy(() => import('../components/Student/LessonViewStream'));
const StudentQuizView = lazy(() => import('../components/Student/StudentQuizView'));
const AssignmentSubmission = lazy(() => import('../components/Student/AssignmentSubmission'));
const CourseRegistration = lazy(() => import('../components/Student/CourseRegistration'));
const SKNCurriculum = lazy(() => import('../components/Teacher/SKNCurriculum'));

const StudentRoutes = () => (
    <>
        <Route
            path="/student/dashboard"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/subjects"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/subjects/:classSubjectId"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <SubjectView />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/lessons/:lessonId"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <LessonViewStream />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/quizzes/:contentId"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <StudentQuizView />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/assignments/:assessmentId/submit"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <AssignmentSubmission />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/courses/register"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <CourseRegistration />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/curriculum/skn-mathematics"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <SKNCurriculum />
                </PrivateRoute>
            }
        />
    </>
);

export default StudentRoutes;
