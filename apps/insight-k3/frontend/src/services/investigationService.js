function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function getInvestigationMonitoringRequest(authFetch, params = {}) {
  return authFetch(`/investigations/monitoring${buildQuery(params)}`);
}

export function getInvestigationRequest(authFetch, incidentIdentifier) {
  return authFetch(
    `/investigations/${encodeURIComponent(incidentIdentifier)}`
  );
}

export function saveInvestigationRequest(
  authFetch,
  incidentIdentifier,
  payload
) {
  return authFetch(
    `/investigations/${encodeURIComponent(incidentIdentifier)}`,
    {
      method: "PUT",
      body: payload
    }
  );
}

export function addInvestigationUpdateRequest(
  authFetch,
  incidentIdentifier,
  payload
) {
  return authFetch(
    `/investigations/${encodeURIComponent(incidentIdentifier)}/updates`,
    {
      method: "POST",
      body: payload
    }
  );
}

export function startCorrectiveActionRequest(
  authFetch,
  incidentIdentifier,
  payload
) {
  return authFetch(
    `/investigations/${encodeURIComponent(
      incidentIdentifier
    )}/start-corrective-action`,
    {
      method: "POST",
      body: payload
    }
  );
}

export function submitInvestigationToManagementRequest(
  authFetch,
  incidentIdentifier,
  payload
) {
  return authFetch(
    `/investigations/${encodeURIComponent(
      incidentIdentifier
    )}/submit-management`,
    {
      method: "POST",
      body: payload
    }
  );
}
