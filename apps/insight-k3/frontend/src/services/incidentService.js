export function createIncidentRequest(authFetch, payload) {
  return authFetch("/incidents", {
    method: "POST",
    body: payload
  });
}

export function listIncidentsRequest(authFetch, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return authFetch(`/incidents${suffix}`);
}

export function getIncidentRequest(authFetch, incidentIdentifier) {
  return authFetch(`/incidents/${encodeURIComponent(incidentIdentifier)}`);
}

export function getOperatorDashboardRequest(authFetch) {
  return authFetch("/incidents/operator-dashboard");
}

export function decideIncidentRequest(
  authFetch,
  incidentIdentifier,
  payload
) {
  return authFetch(
    `/incidents/${encodeURIComponent(incidentIdentifier)}/decision`,
    {
      method: "PATCH",
      body: payload
    }
  );
}
