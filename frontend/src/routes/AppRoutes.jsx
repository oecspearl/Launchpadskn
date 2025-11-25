import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import PublicRoutes from './PublicRoutes';
import AdminRoutes from './AdminRoutes';
import SchoolAdminRoutes from './SchoolAdminRoutes';
import InstructorRoutes from './InstructorRoutes';
import StudentRoutes from './StudentRoutes';
import CommonRoutes from './CommonRoutes';
import NotFound from '../components/common/NotFound';

const LoadingFallback = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
        </Spinner>
    </div>
);

const AppRoutes = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {PublicRoutes()}
                {AdminRoutes()}
                {SchoolAdminRoutes()}
                {InstructorRoutes()}
                {StudentRoutes()}
                {CommonRoutes()}
                {/* Catch-all 404 route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
