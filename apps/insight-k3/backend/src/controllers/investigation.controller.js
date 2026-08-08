import {
  addInvestigationProgressUpdate,
  getInvestigationCase,
  getInvestigationMonitoringData,
  saveInvestigationDraft,
  startCorrectiveAction,
  submitInvestigationToManagement
} from "../services/investigation.service.js";
import {
  validateInvestigationIdentifier,
  validateInvestigationMonitoringQuery,
  validateInvestigationPayload,
  validateInvestigationUpdate
} from "../validators/investigation.validator.js";

function getRequestContext(req) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null
  };
}

export async function getInvestigationMonitoring(req, res) {
  const query = validateInvestigationMonitoringQuery(req.query);
  const data = await getInvestigationMonitoringData({ query });

  return res.json({
    success: true,
    data,
    requestId: req.requestId
  });
}

export async function getInvestigation(req, res) {
  const incidentIdentifier = validateInvestigationIdentifier(
    req.params.incidentIdentifier
  );
  const investigationCase = await getInvestigationCase({
    incidentIdentifier
  });

  return res.json({
    success: true,
    data: {
      case: investigationCase
    },
    requestId: req.requestId
  });
}

export async function saveInvestigation(req, res) {
  const incidentIdentifier = validateInvestigationIdentifier(
    req.params.incidentIdentifier
  );
  const input = validateInvestigationPayload(req.body);
  const investigationCase = await saveInvestigationDraft({
    incidentIdentifier,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.json({
    success: true,
    message: "Investigation draft berhasil disimpan ke PostgreSQL.",
    data: {
      case: investigationCase
    },
    requestId: req.requestId
  });
}

export async function addInvestigationUpdate(req, res) {
  const incidentIdentifier = validateInvestigationIdentifier(
    req.params.incidentIdentifier
  );
  const input = validateInvestigationUpdate(req.body);
  const investigationCase = await addInvestigationProgressUpdate({
    incidentIdentifier,
    note: input.note,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.status(201).json({
    success: true,
    message: "Progress update berhasil disimpan ke PostgreSQL.",
    data: {
      case: investigationCase
    },
    requestId: req.requestId
  });
}

export async function beginCorrectiveAction(req, res) {
  const incidentIdentifier = validateInvestigationIdentifier(
    req.params.incidentIdentifier
  );
  const input = validateInvestigationPayload(req.body);
  const investigationCase = await startCorrectiveAction({
    incidentIdentifier,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.json({
    success: true,
    message: "Incident berhasil dipindahkan ke Corrective Action.",
    data: {
      case: investigationCase
    },
    requestId: req.requestId
  });
}

export async function submitManagement(req, res) {
  const incidentIdentifier = validateInvestigationIdentifier(
    req.params.incidentIdentifier
  );
  const input = validateInvestigationPayload(req.body);
  const investigationCase = await submitInvestigationToManagement({
    incidentIdentifier,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.json({
    success: true,
    message: "Final investigation report berhasil dikirim ke Management.",
    data: {
      case: investigationCase
    },
    requestId: req.requestId
  });
}
