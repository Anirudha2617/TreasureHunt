import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// 픽스: Changed path alias to relative path for compatibility.
import { useAuth } from '../hooks/useAuth';

/**
 * A component that acts as a guard for authenticated routes.
 * 1. Shows a loading spinner while checking auth status.
 * 2. Redirects to the '/auth' page if the user is not authenticated.
 * 3. Renders the requested child page (via <Outlet />) if the user is authenticated.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // First, handle the loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="animate-spin text-primary">
          <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // After loading, check if user is authenticated
  if (!isAuthenticated) {
    // If not, redirect them to the authentication page
    return <Navigate to="/auth" />;
  }

  // If they are authenticated, render the child route component
  // <Outlet /> is a placeholder from react-router-dom that gets replaced
  // by the matched child route (e.g., <Home />, <Game />).
  return <Outlet />;
};

