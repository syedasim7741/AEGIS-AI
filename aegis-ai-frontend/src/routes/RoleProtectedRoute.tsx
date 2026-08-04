import type { ReactElement } from "react";

import { Navigate, useLocation } from "react-router";

import { useAppSelector } from "../store/hooks";

import type { UserRole } from "../store/slices/authSlice";

interface RoleProtectedRouteProps {
  allowedRoles: readonly UserRole[];
  children: ReactElement;
}

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) {
  const location = useLocation();

  const user = useAppSelector((state) => state.auth.user);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          attemptedPath: location.pathname,
        }}
      />
    );
  }

  return children;
}
