import { randomBytes } from "node:crypto";
import {
  createIncidentWithAudit,
  decideIncidentWithAudit,
  findIncidentByIdentifier,
  getOperatorDashboardFromDatabase,
  listIncidentsFromDatabase
} from "../repositories/incident.repository.js";

function createIncidentCode() {
  const now = new Date();
  const datePart = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("");
  const timePart = [
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0")
  ].join("");
  const randomPart = randomBytes(2).toString("hex").toUpperCase();

  return `INC-${datePart}-${timePart}-${randomPart}`;
}

function buildAuditData(actor, requestContext, module = "INCIDENT_REPORTING") {
  return {
    actorId: actor.userId,
    actorUsername: actor.username,
    actorRole: actor.role,
    module,
    ipAddress: requestContext?.ipAddress || null,
    userAgent: requestContext?.userAgent || null
  };
}

function buildLocationLabel(input) {
  const detail = input.locationDetail?.trim();

  if (input.estate === "MO") {
    return detail ? `MO - ${detail}` : "MO";
  }

  if (input.locationType === "BLOCK_COMPARTMENT") {
    const base = `${input.estate} - ${input.block}${input.compartment}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (input.locationType === "HAULING_ROAD") {
    const base = `${input.estate} - Hauling Road ${input.haulingRoad}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (input.locationType === "COMPARTMENT_ROAD") {
    const base = `${input.estate} - ${input.block}${input.compartment} - Compartment Road ${input.compartmentRoad}`;
    return detail ? `${base} - ${detail}` : base;
  }

  return input.location || input.estate;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
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

function toClientIncident(incident) {
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
    initialActionPlan: incident.initialActionPlan ?? null,
    initialPic: incident.initialPic ?? null,
    initialTargetDate: toIso(incident.initialTargetDate),
    status: incident.status,
    rejectionReason: incident.rejectionReason ?? null,
    rejectedAt: toIso(incident.rejectedAt),
    approvedAt: toIso(incident.approvedAt),
    closedAt: toIso(incident.closedAt),
    reporter: toClientUser(incident.reporter),
    approvedBy: toClientUser(incident.approvedBy),
    rejectedBy: toClientUser(incident.rejectedBy),
    closedBy: toClientUser(incident.closedBy),
    createdAt: toIso(incident.createdAt),
    updatedAt: toIso(incident.updatedAt)
  };
}

function createNotFoundError() {
  const error = new Error("Incident tidak ditemukan atau tidak dapat diakses.");
  error.statusCode = 404;
  return error;
}

function createConflictError() {
  const error = new Error(
    "Incident ini sudah diproses oleh operator lain atau statusnya bukan Pending. Silakan muat ulang halaman."
  );
  error.statusCode = 409;
  return error;
}

export async function listIncidentReports({ query, actor }) {
  const result = await listIncidentsFromDatabase({
    query,
    actor
  });

  return {
    incidents: result.incidents.map(toClientIncident),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / query.limit))
    }
  };
}

export async function getOperatorDashboardData({ actor }) {
  if (actor.role !== "OPERATOR") {
    const error = new Error("Dashboard operator hanya dapat diakses operator.");
    error.statusCode = 403;
    throw error;
  }

  const result = await getOperatorDashboardFromDatabase();

  return {
    summary: result.summary,
    pendingIncidents: result.pendingIncidents.map(toClientIncident)
  };
}

export async function getIncidentReport({ incidentIdentifier, actor }) {
  const incident = await findIncidentByIdentifier({
    actor,
    incidentIdentifier
  });

  if (!incident) {
    throw createNotFoundError();
  }

  return toClientIncident(incident);
}

export async function decideIncidentReport({
  incidentIdentifier,
  input,
  actor,
  requestContext
}) {
  if (actor.role !== "OPERATOR") {
    const error = new Error("Keputusan incident hanya dapat dilakukan operator.");
    error.statusCode = 403;
    throw error;
  }

  const result = await decideIncidentWithAudit({
    incidentIdentifier,
    decision: input.decision,
    rejectionReason: input.rejectionReason ?? null,
    actor,
    auditData: buildAuditData(
      actor,
      requestContext,
      "INCIDENT_VERIFICATION"
    )
  });

  if (result.type === "NOT_FOUND") {
    throw createNotFoundError();
  }

  if (result.type === "CONFLICT") {
    throw createConflictError();
  }

  return toClientIncident(result.incident);
}

export async function createIncidentReport({
  input,
  actor,
  requestContext
}) {
  let lastError;
  const normalizedInput = {
    ...input,
    location: buildLocationLabel(input)
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const incident = await createIncidentWithAudit({
        incidentCode: createIncidentCode(),
        reporterId: actor.userId,
        input: normalizedInput,
        auditData: buildAuditData(actor, requestContext)
      });

      return toClientIncident(incident);
    } catch (error) {
      lastError = error;

      if (error?.code !== "P2002") {
        throw error;
      }
    }
  }

  const error = new Error(
    "Kode incident gagal dibuat. Silakan kirim ulang laporan."
  );
  error.statusCode = 500;
  error.cause = lastError;
  throw error;
}
