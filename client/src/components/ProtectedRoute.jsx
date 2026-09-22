import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, loading } = useContext(AuthContext);

    // Show a simple loading state while checking localStorage
    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    // If user is not logged in, redirect to the login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If the route requires an admin but the user is just a customer, redirect to Home
    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // If all checks pass, render the protected component
    return children;
};

export default ProtectedRoute;
