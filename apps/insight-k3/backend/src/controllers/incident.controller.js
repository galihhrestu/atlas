import {
  createIncidentReport,
  decideIncidentReport,
  getIncidentReport,
  getOperatorDashboardData,
  listIncidentReports
} from "../services/incident.service.js";
import {
  validateCreateIncidentInput,
  validateIncidentDecisionInput,
  validateIncidentIdentifier,
  validateListIncidentsQuery
} from "../validators/incident.validator.js";

function getRequestContext(req) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null
  };
}

export async function listIncidents(req, res) {
  const query = validateListIncidentsQuery(req.query);
  const result = await listIncidentReports({
    query,
    actor: req.auth
  });

  return res.json({
    success: true,
    data: result,
    requestId: req.requestId
  });
}

export async function getOperatorDashboard(req, res) {
  const result = await getOperatorDashboardData({
    actor: req.auth
  });

  return res.json({
    success: true,
    data: result,
    requestId: req.requestId
  });
}

export async function getIncident(req, res) {
  const incidentIdentifier = validateIncidentIdentifier(
    req.params.incidentIdentifier
  );
  const incident = await getIncidentReport({
    incidentIdentifier,
    actor: req.auth
  });

  return res.json({
    success: true,
    data: {
      incident
    },
    requestId: req.requestId
  });
}

export async function decideIncident(req, res) {
  const incidentIdentifier = validateIncidentIdentifier(
    req.params.incidentIdentifier
  );
  const input = validateIncidentDecisionInput(req.body);

  const incident = await decideIncidentReport({
    incidentIdentifier,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  const approved = input.decision === "APPROVE";

  return res.json({
    success: true,
    message: approved
      ? "Incident disetujui dan investigasi telah dimulai."
      : "Incident berhasil ditolak.",
    data: {
      incident
    },
    requestId: req.requestId
  });
}

export async function createIncident(req, res) {
  const input = validateCreateIncidentInput(req.body);
  const incident = await createIncidentReport({
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.status(201).json({
    success: true,
    message: "Laporan incident berhasil disimpan ke database.",
    data: {
      incident
    },
    requestId: req.requestId
  });
}
