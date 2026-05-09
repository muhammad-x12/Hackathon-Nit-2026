import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Secondary check for persisted session to prevent race conditions
    const hasPersistedToken = !!localStorage.getItem('token');
    const hasPersistedUser = !!localStorage.getItem('user');

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Verifying Session...</p>
            </div>
        );
    }

    // If no user in state but there is persisted data, we might be in a transition.
    // We allow the render to proceed or show a brief loader instead of an immediate redirect.
    if (!user && !hasPersistedToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If state is null but localStorage has data, we let it pass for one render 
    // or wait for the AuthContext to sync. 
    const currentUser = user || (hasPersistedUser ? JSON.parse(localStorage.getItem('user')) : null);

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0) {
        const roles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
        const hasPermission = allowedRoles.some(role => roles.includes(role));

        if (!hasPermission) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
