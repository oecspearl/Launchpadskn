import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load public components
const Login = lazy(() => import('../components/Auth/Login'));
const Register = lazy(() => import('../components/Auth/Register'));
const ForgotPassword = lazy(() => import('../components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../components/Auth/ResetPassword'));

const PublicRoutes = () => (
    <>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Login />} />
    </>
);

export default PublicRoutes;
