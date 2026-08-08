import { apiRequest } from "./apiClient";

export function loginRequest({ identifier, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: {
      identifier,
      password
    }
  });
}

export function refreshSessionRequest() {
  return apiRequest("/auth/refresh", {
    method: "POST"
  });
}

export function logoutRequest() {
  return apiRequest("/auth/logout", {
    method: "POST"
  });
}

export function currentUserRequest(accessToken) {
  return apiRequest("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
