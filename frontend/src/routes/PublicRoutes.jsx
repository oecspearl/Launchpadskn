import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load public components
const Login = lazy(() => import('../components/Auth/Login'));
const Register = lazy(() => import('../components/Auth/Register'));
const ForgotPassword = lazy(() => import('../components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../components/Auth/ResetPassword'));
const Homepage = lazy(() => import('../pages/Homepage'));

// Public curriculum pages (accessible without authentication)
const SKNCurriculum = lazy(() => import('../components/Teacher/SKNCurriculum'));
const SKNSocialScienceCurriculum = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculum'));
const SKNMathsCurriculumForm2 = lazy(() => import('../components/Teacher/SKNMathsCurriculumForm2'));
const SKNSocialScienceCurriculumForm2 = lazy(() => import('../components/Teacher/SKNSocialScienceCurriculumForm2'));

const PublicRoutes = () => (
    <>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Homepage />} />
        
        {/* Public Curriculum Routes */}
        <Route path="/curriculum/skn-mathematics" element={<SKNCurriculum />} />
        <Route path="/curriculum/skn-mathematics-form2" element={<SKNMathsCurriculumForm2 />} />
        <Route path="/curriculum/skn-social-science" element={<SKNSocialScienceCurriculum />} />
        <Route path="/curriculum/skn-social-science-form2" element={<SKNSocialScienceCurriculumForm2 />} />
    </>
);

export default PublicRoutes;
