import { prisma } from "../lib/prisma.js";

const publicUserSelect = {
  id: true,
  username: true,
  fullName: true,
  department: true
};

const incidentSelect = {
  id: true,
  incidentCode: true,
  incidentDate: true,
  location: true,
  estate: true,
  locationType: true,
  block: true,
  compartment: true,
  haulingRoad: true,
  compartmentRoad: true,
  locationDetail: true,
  department: true,
  type: true,
  severity: true,
  objectInvolved: true,
  description: true,
  unsafeAction: true,
  sopViolation: true,
  unsafeCondition: true,
  contributingFactor: true,
  rootCauseCategory: true,
  initialRootCause: true,
  initialActionPlan: true,
  initialPic: true,
  initialTargetDate: true,
  status: true,
  rejectionReason: true,
  rejectedAt: true,
  approvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: publicUserSelect
  },
  approvedBy: {
    select: publicUserSelect
  },
  rejectedBy: {
    select: publicUserSelect
  },
  closedBy: {
    select: publicUserSelect
  }
};

function serializeDate(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

function toAuditSnapshot(incident) {
  return {
    id: incident.id,
    incidentCode: incident.incidentCode,
    reporterId: incident.reporter?.id ?? null,
    incidentDate: serializeDate(incident.incidentDate),
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
    initialActionPlan: incident.initialActionPlan,
    initialPic: incident.initialPic,
    initialTargetDate: serializeDate(incident.initialTargetDate),
    status: incident.status,
    rejectionReason: incident.rejectionReason,
    approvedById: incident.approvedBy?.id ?? null,
    approvedAt: serializeDate(incident.approvedAt),
    rejectedById: incident.rejectedBy?.id ?? null,
    rejectedAt: serializeDate(incident.rejectedAt),
    closedAt: serializeDate(incident.closedAt)
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function buildIdentifierWhere(incidentIdentifier) {
  const conditions = [
    {
      incidentCode: incidentIdentifier
    }
  ];

  if (isUuid(incidentIdentifier)) {
    conditions.push({
      id: incidentIdentifier
    });
  }

  return {
    OR: conditions
  };
}

function buildRoleScope(actor) {
  if (actor.role === "USER") {
    return {
      reporterId: actor.userId
    };
  }

  return {};
}

function buildIncidentWhere({ actor, query }) {
  const where = {
    ...buildRoleScope(actor)
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.severity) {
    where.severity = query.severity;
  }

  if (query.estate) {
    where.estate = query.estate;
  }

  if (query.locationType) {
    where.locationType = query.locationType;
  }

  if (query.department) {
    where.department = query.department;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.search) {
    where.OR = [
      {
        incidentCode: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        location: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        department: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        type: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        reporter: {
          is: {
            OR: [
              {
                username: {
                  contains: query.search,
                  mode: "insensitive"
                }
              },
              {
                fullName: {
                  contains: query.search,
                  mode: "insensitive"
                }
              }
            ]
          }
        }
      }
    ];
  }

  return where;
}

export async function listIncidentsFromDatabase({ actor, query }) {
  const where = buildIncidentWhere({ actor, query });
  const skip = (query.page - 1) * query.limit;

  const [total, incidents] = await prisma.$transaction([
    prisma.incident.count({ where }),
    prisma.incident.findMany({
      where,
      select: incidentSelect,
      orderBy: {
        [query.sortBy]: query.sortOrder
      },
      skip,
      take: query.limit
    })
  ]);

  return {
    incidents,
    total
  };
}

export async function getOperatorDashboardFromDatabase() {
  const [pending, investigation, correctiveAction, pendingIncidents] =
    await prisma.$transaction([
      prisma.incident.count({
        where: {
          status: "PENDING"
        }
      }),
      prisma.incident.count({
        where: {
          status: {
            in: ["INVESTIGATION", "REVISION_REQUIRED"]
          }
        }
      }),
      prisma.incident.count({
        where: {
          status: "CORRECTIVE_ACTION"
        }
      }),
      prisma.incident.findMany({
        where: {
          status: "PENDING"
        },
        select: incidentSelect,
        orderBy: [
          {
            createdAt: "asc"
          },
          {
            incidentDate: "asc"
          }
        ],
        take: 100
      })
    ]);

  return {
    summary: {
      pendingApproval: pending,
      investigation,
      correctiveAction
    },
    pendingIncidents
  };
}

export function findIncidentByIdentifier({ actor, incidentIdentifier }) {
  return prisma.incident.findFirst({
    where: {
      ...buildRoleScope(actor),
      ...buildIdentifierWhere(incidentIdentifier)
    },
    select: incidentSelect
  });
}

export function createIncidentWithAudit({
  incidentCode,
  reporterId,
  input,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const incident = await transaction.incident.create({
      data: {
        incidentCode,
        reporterId,
        incidentDate: input.incidentDate,
        location: input.location,
        estate: input.estate,
        locationType: input.locationType,
        block: input.block ?? null,
        compartment: input.compartment ?? null,
        haulingRoad: input.haulingRoad ?? null,
        compartmentRoad: input.compartmentRoad ?? null,
        locationDetail: input.locationDetail ?? null,
        department: input.department,
        type: input.type,
        severity: input.severity,
        objectInvolved: input.objectInvolved ?? null,
        description: input.description,
        unsafeAction: input.unsafeAction ?? null,
        sopViolation: input.sopViolation ?? null,
        unsafeCondition: input.unsafeCondition ?? null,
        contributingFactor: input.contributingFactor ?? null,
        rootCauseCategory: input.rootCauseCategory ?? null,
        initialRootCause: input.initialRootCause ?? null,
        initialActionPlan: input.initialActionPlan ?? null,
        initialPic: input.initialPic ?? null,
        initialTargetDate: input.initialTargetDate ?? null,
        status: "PENDING"
      },
      select: incidentSelect
    });

    await transaction.auditLog.create({
      data: {
        ...auditData,
        action: "CREATE",
        recordType: "Incident",
        recordId: incident.incidentCode,
        incidentId: incident.id,
        description: `Incident ${incident.incidentCode} dibuat oleh ${incident.reporter.username}.`,
        previousValue: null,
        newValue: toAuditSnapshot(incident)
      }
    });

    return incident;
  });
}

export function decideIncidentWithAudit({
  incidentIdentifier,
  decision,
  rejectionReason,
  actor,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.incident.findFirst({
      where: buildIdentifierWhere(incidentIdentifier),
      select: incidentSelect
    });

    if (!existing) {
      return {
        type: "NOT_FOUND"
      };
    }

    const now = new Date();
    const isApproval = decision === "APPROVE";

    const updateResult = await transaction.incident.updateMany({
      where: {
        id: existing.id,
        status: "PENDING"
      },
      data: isApproval
        ? {
            status: "INVESTIGATION",
            approvedById: actor.userId,
            approvedAt: now,
            rejectionReason: null,
            rejectedById: null,
            rejectedAt: null
          }
        : {
            status: "REJECTED",
            rejectionReason,
            rejectedById: actor.userId,
            rejectedAt: now,
            approvedById: null,
            approvedAt: null
          }
    });

    if (updateResult.count !== 1) {
      return {
        type: "CONFLICT"
      };
    }

    if (isApproval) {
      await transaction.investigation.upsert({
        where: {
          incidentId: existing.id
        },
        create: {
          incidentId: existing.id,
          investigationDate: now,
          leadInvestigatorId: actor.userId,
          leadInvestigatorName: actor.username,
          progress: 0
        },
        update: {
          investigationDate: now,
          leadInvestigatorId: actor.userId,
          leadInvestigatorName: actor.username
        }
      });
    }

    const updated = await transaction.incident.findUnique({
      where: {
        id: existing.id
      },
      select: incidentSelect
    });

    await transaction.auditLog.create({
      data: {
        ...auditData,
        action: isApproval ? "APPROVE" : "REJECT",
        recordType: "Incident",
        recordId: updated.incidentCode,
        incidentId: updated.id,
        description: isApproval
          ? `Incident ${updated.incidentCode} disetujui oleh ${actor.username}; investigasi dimulai.`
          : `Incident ${updated.incidentCode} ditolak oleh ${actor.username}.`,
        previousValue: toAuditSnapshot(existing),
        newValue: toAuditSnapshot(updated)
      }
    });

    return {
      type: "OK",
      incident: updated
    };
  });
}
