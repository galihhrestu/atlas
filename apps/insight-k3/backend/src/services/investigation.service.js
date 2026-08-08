import {
  addInvestigationUpdateWithAudit,
  findInvestigationCaseByIdentifier,
  listInvestigationCasesFromDatabase,
  saveInvestigationDraftWithAudit,
  startCorrectiveActionWithAudit,
  submitInvestigationToManagementWithAudit
} from "../repositories/investigation.repository.js";

function buildAuditData(actor, requestContext) {
  return {
    actorId: actor.userId,
    actorUsername: actor.username,
    actorRole: actor.role,
    module: "INVESTIGATION",
    ipAddress: requestContext?.ipAddress || null,
    userAgent: requestContext?.userAgent || null
  };
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

function toDateInput(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toClientUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    department: user.department
  };
}

function actionStatusToClient(value) {
  if (value === "COMPLETED") {
    return "Completed";
  }

  if (value === "IN_PROGRESS") {
    return "In Progress";
  }

  return "Open";
}

function defaultFiveWhy(value) {
  const existing = Array.isArray(value) ? value : [];

  return Array.from({ length: 5 }, (_, index) => ({
    id: existing[index]?.id || `why-${index + 1}`,
    question: existing[index]?.question || `Mengapa ${index + 1}?`,
    answer: existing[index]?.answer || ""
  }));
}

function normalizeTeamMembers(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function mapDatabaseActions(actions = []) {
  return actions.map((item) => ({
    id: item.id,
    action: item.action || "",
    pic: item.picName || "",
    targetDate: toDateInput(item.targetDate),
    status: actionStatusToClient(item.status),
    progress: Number(item.progress || 0),
    evidence: item.evidenceSummary || "",
    note: item.note || ""
  }));
}

function buildInitialAction(incident) {
  if (!incident.initialActionPlan && !incident.initialPic && !incident.initialTargetDate) {
    return [];
  }

  return [
    {
      id: `initial-${incident.id}`,
      action: incident.initialActionPlan || "",
      pic: incident.initialPic || "",
      targetDate: toDateInput(incident.initialTargetDate),
      status: "Open",
      progress: 0,
      evidence: "",
      note: ""
    }
  ];
}

function mapDraftActions(draft) {
  if (!Array.isArray(draft)) {
    return [];
  }

  return draft.map((item, index) => ({
    id: item?.id || `draft-${index + 1}`,
    action: item?.action || "",
    pic: item?.pic || "",
    targetDate: item?.targetDate
      ? String(item.targetDate).slice(0, 10)
      : "",
    status: actionStatusToClient(item?.status),
    progress: Number(item?.progress || 0),
    evidence: item?.evidence || "",
    note: item?.note || ""
  }));
}

function mapUpdates(updates = []) {
  return updates.map((item) => {
    const createdAt = new Date(item.createdAt);

    return {
      id: item.id,
      note: item.note,
      progress: Number(item.progress || 0),
      by: item.authorName,
      createdAt: toIso(item.createdAt),
      date: Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleDateString("id-ID"),
      time: Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
          })
    };
  });
}

function buildTimeline(incident) {
  const timeline = [];

  for (const log of incident.auditLogs || []) {
    let step = null;

    if (log.module === "INCIDENT_VERIFICATION" && log.action === "APPROVE") {
      step = "Approved by Operator - Investigation Started";
    } else if (
      log.module === "INVESTIGATION" &&
      String(log.description || "").includes("Corrective Action")
    ) {
      step = "Corrective Action Started";
    } else if (log.module === "INVESTIGATION" && log.action === "SUBMIT") {
      step = "Final Investigation Report Submitted to Management";
    }

    if (!step) {
      continue;
    }

    const createdAt = new Date(log.createdAt);
    timeline.push({
      step,
      date: Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleDateString("id-ID"),
      time: Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
          }),
      createdAt: toIso(log.createdAt),
      by: log.actorUsername
    });
  }

  return timeline;
}

function toClientInvestigation(incident) {
  const investigation = incident.investigation;

  if (!investigation) {
    return {
      investigationDate: toDateInput(incident.approvedAt),
      investigator: incident.approvedBy?.username || "",
      teamMembers: "",
      method: "",
      verifiedChronology: "",
      findings: "",
      witnesses: "",
      evidenceDescription: "",
      immediateCause: "",
      rootCause: incident.initialRootCause || "",
      contributingFactor: incident.contributingFactor || "",
      fiveWhy: defaultFiveWhy([]),
      actions: buildInitialAction(incident),
      updates: [],
      progress: 0,
      submittedAt: "",
      submittedBy: ""
    };
  }

  const databaseActions = mapDatabaseActions(
    investigation.correctiveActions || []
  );
  const draftActions = mapDraftActions(investigation.actionPlanDraft);
  const actions = databaseActions.length
    ? databaseActions
    : draftActions.length
      ? draftActions
      : buildInitialAction(incident);

  return {
    investigationDate: toDateInput(investigation.investigationDate),
    investigator:
      investigation.leadInvestigatorName ||
      investigation.leadInvestigator?.username ||
      "",
    teamMembers: normalizeTeamMembers(investigation.teamMembers),
    method: investigation.method || "",
    verifiedChronology: investigation.verifiedChronology || "",
    findings: investigation.findings || "",
    witnesses: investigation.witnesses || "",
    evidenceDescription: investigation.evidenceDescription || "",
    immediateCause: investigation.immediateCause || "",
    rootCause: investigation.rootCause || incident.initialRootCause || "",
    contributingFactor:
      investigation.contributingFactor || incident.contributingFactor || "",
    fiveWhy: defaultFiveWhy(investigation.fiveWhy),
    actions,
    updates: mapUpdates(investigation.updates || []),
    progress: Number(investigation.progress || 0),
    submittedAt: toIso(investigation.submittedAt) || "",
    submittedBy: investigation.submittedByName || "",
    lastUpdatedAt: toIso(investigation.updatedAt) || ""
  };
}

function toClientCase(incident) {
  return {
    id: incident.id,
    databaseId: incident.id,
    incidentCode: incident.incidentCode,
    incidentDate: toIso(incident.incidentDate),
    location: incident.location,
    estate: incident.estate,
    locationType: incident.locationType,
    block: incident.block,
    compartment: incident.compartment,
    haulingRoad: incident.haulingRoad,
    compartmentRoad: incident.compartmentRoad,
    locationDetail: incident.locationDetail,
    department: incident.department,
    type: incident.type,
    severity: incident.severity,
    objectInvolved: incident.objectInvolved,
    description: incident.description,
    unsafeAction: incident.unsafeAction,
    sopViolation: incident.sopViolation,
    unsafeCondition: incident.unsafeCondition,
    contributingFactor: incident.contributingFactor,
    rootCauseCategory: incident.rootCauseCategory,
    initialRootCause: incident.initialRootCause,
    status: incident.status,
    rejectionReason: incident.rejectionReason,
    approvedAt: toIso(incident.approvedAt),
    closedAt: toIso(incident.closedAt),
    createdAt: toIso(incident.createdAt),
    updatedAt: toIso(incident.updatedAt),
    reporter: toClientUser(incident.reporter),
    approvedBy: toClientUser(incident.approvedBy),
    investigation: toClientInvestigation(incident),
    managementReview: incident.managementReview
      ? {
          id: incident.managementReview.id,
          status: incident.managementReview.status,
          note: incident.managementReview.note,
          reviewedAt: toIso(incident.managementReview.reviewedAt),
          reviewedBy: toClientUser(incident.managementReview.reviewedBy)
        }
      : null,
    timeline: buildTimeline(incident)
  };
}

function createNotFoundError() {
  const error = new Error("Investigation tidak ditemukan.");
  error.statusCode = 404;
  return error;
}

function createConflictError(message) {
  const error = new Error(
    message ||
      "Status investigation sudah berubah. Silakan muat ulang halaman."
  );
  error.statusCode = 409;
  return error;
}

function validateCompleteActions(actions) {
  if (!actions.length) {
    const error = new Error("Minimal satu corrective action wajib ditambahkan.");
    error.statusCode = 422;
    throw error;
  }

  const incomplete = actions.some(
    (item) => !item.action?.trim() || !item.pic?.trim() || !item.targetDate
  );

  if (incomplete) {
    const error = new Error(
      "Action, PIC, dan Target Completion wajib lengkap untuk setiap corrective action."
    );
    error.statusCode = 422;
    throw error;
  }
}

function validateFinalSubmission(input) {
  if (!input.findings?.trim() || !input.rootCause?.trim()) {
    const error = new Error("Findings dan Root Cause wajib dilengkapi.");
    error.statusCode = 422;
    throw error;
  }

  validateCompleteActions(input.actions);

  const unfinished = input.actions.some(
    (item) =>
      item.status !== "COMPLETED" ||
      Number(item.progress) !== 100 ||
      !item.evidence?.trim()
  );

  if (unfinished) {
    const error = new Error(
      "Semua corrective action harus Completed, progress 100%, dan memiliki evidence sebelum dikirim ke Management."
    );
    error.statusCode = 422;
    throw error;
  }
}

export async function getInvestigationMonitoringData({ query }) {
  const result = await listInvestigationCasesFromDatabase(query);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    summary: result.summary,
    cases: result.cases.map((incident) => {
      const actions = incident.investigation?.correctiveActions || [];
      const overdue = actions.some((action) => {
        if (!action.targetDate || action.status === "COMPLETED") {
          return false;
        }

        const target = new Date(action.targetDate);
        target.setHours(0, 0, 0, 0);
        return target < today;
      });
      const storedProgress = Number(incident.investigation?.progress || 0);
      const progress =
        incident.status === "CLOSED" || incident.status === "MANAGEMENT_REVIEW"
          ? 100
          : incident.status === "INVESTIGATION" && storedProgress === 0
            ? 10
            : storedProgress;

      return {
        id: incident.id,
        incidentCode: incident.incidentCode,
        incidentDate: toIso(incident.incidentDate),
        location: incident.location,
        department: incident.department,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        reporter: toClientUser(incident.reporter),
        progress,
        overdue
      };
    })
  };
}

export async function getInvestigationCase({ incidentIdentifier }) {
  const incident = await findInvestigationCaseByIdentifier(incidentIdentifier);

  if (!incident || !incident.investigation) {
    throw createNotFoundError();
  }

  return toClientCase(incident);
}

export async function saveInvestigationDraft({
  incidentIdentifier,
  input,
  actor,
  requestContext
}) {
  const result = await saveInvestigationDraftWithAudit({
    incidentIdentifier,
    input,
    actor,
    auditData: buildAuditData(actor, requestContext)
  });

  if (result.type === "NOT_FOUND") {
    throw createNotFoundError();
  }

  if (result.type === "CONFLICT") {
    throw createConflictError();
  }

  if (result.type === "INVALID_ACTIONS") {
    const error = new Error(
      "Pada tahap Corrective Action, Action, PIC, dan Target Completion wajib tetap terisi."
    );
    error.statusCode = 422;
    throw error;
  }

  return toClientCase(result.case);
}

export async function addInvestigationProgressUpdate({
  incidentIdentifier,
  note,
  actor,
  requestContext
}) {
  const result = await addInvestigationUpdateWithAudit({
    incidentIdentifier,
    note,
    actor,
    auditData: buildAuditData(actor, requestContext)
  });

  if (result.type === "NOT_FOUND") {
    throw createNotFoundError();
  }

  if (result.type === "CONFLICT") {
    throw createConflictError();
  }

  return toClientCase(result.case);
}

export async function startCorrectiveAction({
  incidentIdentifier,
  input,
  actor,
  requestContext
}) {
  if (!input.findings?.trim() || !input.rootCause?.trim()) {
    const error = new Error("Findings dan Root Cause wajib dilengkapi.");
    error.statusCode = 422;
    throw error;
  }

  validateCompleteActions(input.actions);

  const result = await startCorrectiveActionWithAudit({
    incidentIdentifier,
    input,
    actor,
    auditData: buildAuditData(actor, requestContext)
  });

  if (result.type === "NOT_FOUND") {
    throw createNotFoundError();
  }

  if (result.type === "CONFLICT") {
    throw createConflictError(
      "Incident ini tidak lagi berada pada tahap Investigation."
    );
  }

  return toClientCase(result.case);
}

export async function submitInvestigationToManagement({
  incidentIdentifier,
  input,
  actor,
  requestContext
}) {
  validateFinalSubmission(input);

  const result = await submitInvestigationToManagementWithAudit({
    incidentIdentifier,
    input,
    actor,
    auditData: buildAuditData(actor, requestContext)
  });

  if (result.type === "NOT_FOUND") {
    throw createNotFoundError();
  }

  if (result.type === "CONFLICT") {
    throw createConflictError(
      "Incident belum berada pada Corrective Action atau Revision Required."
    );
  }

  return toClientCase(result.case);
}
