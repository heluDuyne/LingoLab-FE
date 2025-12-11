import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores";
import type { UserRole } from "@/types";
import { ROUTES } from "@/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.SIGNIN} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath =
      user.role === "student"
        ? ROUTES.STUDENT.DASHBOARD
        : ROUTES.TEACHER.DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
