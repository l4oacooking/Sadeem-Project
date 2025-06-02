import { Navigate } from "react-router-dom";

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const isSuperadmin = localStorage.getItem('superadmin') === 'true';

  if (!isSuperadmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}