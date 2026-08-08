export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

export function normalizeAuthUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    role: normalizeRole(user.role)
  };
}

export function getDashboardPath(userOrRole) {
  const role = normalizeRole(
    typeof userOrRole === "string" ? userOrRole : userOrRole?.role
  );

  if (role === "operator") {
    return "/operator-dashboard";
  }

  if (role === "management" || role === "admin") {
    return "/management-dashboard";
  }

  return "/user-dashboard";
}

export function isRoleAllowed(currentRole, allowedRoles) {
  const normalizedCurrentRole = normalizeRole(currentRole);

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Administrator tetap dapat membuka seluruh route frontend.
  // Otorisasi final tetap harus dipaksakan oleh backend pada setiap API bisnis.
  if (normalizedCurrentRole === "admin") {
    return true;
  }

  return allowedRoles
    .map(normalizeRole)
    .includes(normalizedCurrentRole);
}

export function getLegacyRole(role) {
  const normalizedRole = normalizeRole(role);

  // Sejumlah modul lama masih membaca localStorage dan hanya mengenal
  // user/operator/management. ADMIN dipetakan sementara ke management
  // sampai seluruh modul bisnis dipindahkan ke AuthContext/backend.
  return normalizedRole === "admin" ? "management" : normalizedRole;
}
