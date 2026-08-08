import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardPath,
  isRoleAllowed
} from "../utils/auth";

function ProtectedRoute({
  children,
  allowedRole,
  allowedRoles
}) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="dashboard">
        <p>Memeriksa sesi pengguna...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const requiredRoles = allowedRoles ||
    (allowedRole ? [allowedRole] : []);

  if (!isRoleAllowed(user.role, requiredRoles)) {
    return (
      <Navigate
        to={getDashboardPath(user)}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
