import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback,
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/auth" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Show fallback component or default unauthorized message
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. 
            Required role: {requiredRoles.join(' or ')}
          </p>
          <p className="text-sm text-muted-foreground">
            Your current role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};
