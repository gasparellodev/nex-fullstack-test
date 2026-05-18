import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '@nex/shared';
import { useAuthStore } from '@/stores/auth.store';
import { homeForRole, routes } from './routes';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return <Navigate to={routes.login} replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <Outlet />;
}
