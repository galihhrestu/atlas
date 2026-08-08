function buildQueryString(filters = {}) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function listUsersRequest(authFetch, filters) {
  return authFetch(`/users${buildQueryString(filters)}`, {
    method: "GET"
  });
}

export function createUserRequest(authFetch, payload) {
  return authFetch("/users", {
    method: "POST",
    body: payload
  });
}

export function updateUserRequest(authFetch, userId, payload) {
  return authFetch(`/users/${userId}`, {
    method: "PATCH",
    body: payload
  });
}

export function resetUserPasswordRequest(
  authFetch,
  userId,
  newPassword
) {
  return authFetch(`/users/${userId}/reset-password`, {
    method: "POST",
    body: {
      newPassword
    }
  });
}
