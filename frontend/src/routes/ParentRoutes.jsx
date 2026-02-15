import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/Auth/PrivateRoute';

const ParentDashboard = lazy(() => import('../components/Parent/ParentDashboard'));

const ParentRoutes = () => (
    <>
        <Route
            path="/parent/dashboard"
            element={
                <PrivateRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                </PrivateRoute>
            }
        />
    </>
);

export default ParentRoutes;
