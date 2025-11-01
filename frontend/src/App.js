import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Import authentication components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PrivateRoute from './components/Auth/PrivateRoute';

// Import dashboard components
import AdminDashboard from './components/Admin/AdminDashboard';
import InstructorDashboard from './components/Instructor/InstructorDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import TeacherDashboard from './components/Teacher/TeacherDashboard';

// Import admin components
import ManageCourses from './components/Admin/ManageCourses';
import ManageInstructors from './components/Admin/ManageInstructors';
import ManageDepartments from './components/Admin/ManageDepartments';
import CourseAssignment from './components/Admin/CourseAssignment';
import EnrollmentApproval from './components/Admin/EnrollmentApproval';
import FormManagement from './components/Admin/FormManagement';
import ClassManagement from './components/Admin/ClassManagement';
import SubjectManagement from './components/Admin/SubjectManagement';
import StudentAssignment from './components/Admin/StudentAssignment';
import ClassSubjectAssignment from './components/Admin/ClassSubjectAssignment';

// Import student components
import CourseRegistration from './components/Student/CourseRegistration';
import SubjectView from './components/Student/SubjectView';
import LessonView from './components/Student/LessonView';
import LessonPlanning from './components/Teacher/LessonPlanning';
import AttendanceMarking from './components/Teacher/AttendanceMarking';
import GradeEntry from './components/Teacher/GradeEntry';
import TeacherLessonView from './components/Teacher/TeacherLessonView';

// Import context providers
import { AuthProvider } from './contexts/AuthContextSupabase';

// Import common components
import Navbar from './components/common/Navbar';
import CourseDetails from './components/common/CourseDetails';
import Profile from './components/common/Profile';
import ChangePassword from './components/Auth/ChangePassword';
import FirstTimeLoginCheck from './components/Auth/FirstTimeLoginCheck';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Container className="mt-4">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/change-password" 
                element={
                  <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <ChangePassword />
                  </PrivateRoute>
                } 
              />

              {/* Protected Routes */}
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

              {/* Admin Course Management Routes (Legacy) */}
              <Route 
                path="/admin/courses" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <ManageCourses />
                  </PrivateRoute>
                } 
              />
              
              {/* Admin Hierarchical Management Routes (New) */}
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

              {/* Admin Instructor Management Routes */}
              <Route 
                path="/admin/instructors" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <ManageInstructors />
                  </PrivateRoute>
                } 
              />

              {/* Admin Department Management Routes */}
              <Route 
                path="/admin/departments" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <ManageDepartments />
                  </PrivateRoute>
                } 
              />

              {/* Admin Instructor Assignment Routes */}
              <Route 
                path="/admin/course-assignment" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <CourseAssignment />
                  </PrivateRoute>
                } 
              />

              {/* Admin Enrollment Approval Routes */}
              <Route 
                path="/admin/enrollment-approval" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <EnrollmentApproval />
                  </PrivateRoute>
                } 
              />

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
              
              {/* Teacher Routes (New Hierarchical Structure) */}
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
                    {/* TODO: Create ClassManagement component */}
                    <div>Class Management - Coming Soon</div>
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
                path="/student/dashboard" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </PrivateRoute>
                } 
              />

              {/* Student Subject Routes (New Hierarchical Structure) */}
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
                    <LessonView />
                  </PrivateRoute>
                } 
              />

              {/* Legacy Course Routes (Deprecated - keeping for backward compatibility) */}
              <Route 
                path="/student/courses/register" 
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <CourseRegistration />
                  </PrivateRoute>
                } 
              />

              {/* Default Route - Redirect to login */}
              {/* Profile Route */}
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <Profile />
                  </PrivateRoute>
                } 
              />

              {/* Legacy Course Routes (Deprecated) */}
              <Route 
                path="/courses/:courseId" 
                element={
                  <PrivateRoute allowedRoles={['admin', 'instructor', 'student']}>
                    <CourseDetails />
                  </PrivateRoute>
                } 
              />
              
              {/* Default Route - Redirect to login */}
              <Route path="/" element={<Login />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;