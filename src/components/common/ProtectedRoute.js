import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { adminEmails } from "../../adminEmails";
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const [user, loading] = useAuthState(auth);
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />; // Replace with a spinner or loading component if desired
    }

    const isAdmin = user && adminEmails.includes(user.email);

    if (!user || (adminOnly && !isAdmin)) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
