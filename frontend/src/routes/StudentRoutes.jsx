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
const SKNSocialScienceCurriculum = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculum'));
const SKNMathsCurriculumForm2 = lazy(() => import('../components/Teacher/SKNMathsCurriculumForm2'));
const SKNSocialScienceCurriculumForm2 = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculumForm2'));
const StudentHelpPage = lazy(() => import('../components/Help/StudentHelpPage'));

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
        <Route
            path="/student/curriculum/skn-social-science"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <SKNSocialScienceCurriculum />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/curriculum/skn-mathematics-form2"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <SKNMathsCurriculumForm2 />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/curriculum/skn-social-science-form2"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <SKNSocialScienceCurriculumForm2 />
                </PrivateRoute>
            }
        />
        <Route
            path="/student/help"
            element={
                <PrivateRoute allowedRoles={['student']}>
                    <StudentHelpPage />
                </PrivateRoute>
            }
        />
    </>
);

export default StudentRoutes;
