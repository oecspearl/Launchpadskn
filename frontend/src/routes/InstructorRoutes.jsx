import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';
import FirstTimeLoginCheck from '../components/Auth/FirstTimeLoginCheck';
// Use lazy loading with better error handling for LessonContentManager
// The file is large (5882 lines) which can cause module resolution issues
const LessonContentManager = lazy(() => 
  import('../components/Teacher/LessonContentManager')
    .then(module => {
      // Try to get default export, or named export, or the module itself
      const component = module.default || module.LessonContentManager || module;
      if (!component) {
        throw new Error('LessonContentManager export not found');
      }
      return { default: component };
    })
    .catch(error => {
      console.error('Failed to load LessonContentManager:', error);
      // Return a fallback component
      return {
        default: () => (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Failed to load LessonContentManager</h3>
            <p>Error: {error?.message || String(error)}</p>
            <p>This may be due to a syntax error in the component file.</p>
            <button onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        )
      };
    })
);

// Lazy load instructor components
const TeacherDashboard = lazy(() => import('../components/Teacher/TeacherDashboard'));
const TeacherClassManagement = lazy(() => import('../components/Teacher/TeacherClassManagement'));
const TeacherLessonView = lazy(() => import('../components/Teacher/TeacherLessonView'));
const LessonPlanning = lazy(() => import('../components/Teacher/LessonPlanning'));
const AttendanceMarking = lazy(() => import('../components/Teacher/AttendanceMarking'));
const GradeEntry = lazy(() => import('../components/Teacher/GradeEntry'));
const Gradebook = lazy(() => import('../components/Teacher/Gradebook'));
const ContentLibrary = lazy(() => import('../components/Teacher/ContentLibrary'));
const LessonTemplateLibrary = lazy(() => import('../components/Teacher/LessonTemplateLibrary'));
const Curriculum = lazy(() => import('../components/Teacher/Curriculum'));
const SKNCurriculum = lazy(() => import('../components/Teacher/SKNCurriculum'));
const SKNSocialScienceCurriculum = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculum'));
const SKNMathsCurriculumForm2 = lazy(() => import('../components/Teacher/SKNMathsCurriculumForm2'));
const SKNSocialScienceCurriculumForm2 = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculumForm2'));
const StudentProfileView = lazy(() => import('../components/Teacher/StudentProfileView'));
const StudentViewPreview = lazy(() => import('../components/Teacher/StudentViewPreview'));
const TeacherHelpPage = lazy(() => import('../components/Help/TeacherHelpPage'));
const TeacherReportCardComments = lazy(() => import('../components/Teacher/TeacherReportCardComments'));

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
            path="/teacher/lessons/create"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <LessonPlanning />
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
            path="/teacher/curriculum/skn-mathematics"
            element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <SKNCurriculum />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/curriculum/skn-social-science"
            element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <SKNSocialScienceCurriculum />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/curriculum/skn-mathematics-form2"
            element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <SKNMathsCurriculumForm2 />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/curriculum/skn-social-science-form2"
            element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <SKNSocialScienceCurriculumForm2 />
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
        <Route
            path="/teacher/content-library"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <ContentLibrary />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/lesson-templates"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <LessonTemplateLibrary />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/lesson/:lessonId/preview"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <StudentViewPreview />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/help"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <TeacherHelpPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/teacher/report-cards"
            element={
                <PrivateRoute allowedRoles={['instructor']}>
                    <TeacherReportCardComments />
                </PrivateRoute>
            }
        />
    </>
);

export default InstructorRoutes;
