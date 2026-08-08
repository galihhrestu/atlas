import { prisma } from "../lib/prisma.js";

const publicUserSelect = {
  id: true,
  username: true,
  fullName: true,
  department: true
};

const correctiveActionSelect = {
  id: true,
  action: true,
  picName: true,
  targetDate: true,
  status: true,
  progress: true,
  evidenceSummary: true,
  note: true,
  completedAt: true,
  effectivenessStatus: true,
  effectivenessNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true
};

const investigationSelect = {
  id: true,
  investigationDate: true,
  leadInvestigatorId: true,
  leadInvestigatorName: true,
  teamMembers: true,
  method: true,
  verifiedChronology: true,
  findings: true,
  witnesses: true,
  evidenceDescription: true,
  immediateCause: true,
  rootCause: true,
  contributingFactor: true,
  fiveWhy: true,
  actionPlanDraft: true,
  progress: true,
  submittedByName: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
  leadInvestigator: {
    select: publicUserSelect
  },
  correctiveActions: {
    select: correctiveActionSelect,
    orderBy: {
      createdAt: "asc"
    }
  },
  updates: {
    select: {
      id: true,
      authorName: true,
      note: true,
      progress: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }
};

const incidentCaseSelect = {
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
  investigation: {
    select: investigationSelect
  },
  managementReview: {
    select: {
      id: true,
      status: true,
      note: true,
      reviewedAt: true,
      reviewedBy: {
        select: publicUserSelect
      }
    }
  },
  auditLogs: {
    where: {
      OR: [
        {
          module: "INCIDENT_VERIFICATION",
          action: "APPROVE"
        },
        {
          module: "INVESTIGATION",
          action: {
            in: ["UPDATE", "SUBMIT"]
          }
        }
      ]
    },
    select: {
      id: true,
      action: true,
      module: true,
      description: true,
      actorUsername: true,
      previousValue: true,
      newValue: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "asc"
    },
    take: 100
  }
};

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

function buildMonitoringWhere(query) {
  const where = {
    status: query.status
      ? query.status
      : {
          in: [
            "INVESTIGATION",
            "CORRECTIVE_ACTION",
            "REVISION_REQUIRED",
            "MANAGEMENT_REVIEW",
            "CLOSED"
          ]
        }
  };

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

export async function listInvestigationCasesFromDatabase(query) {
  const where = buildMonitoringWhere(query);

  const [activeInvestigation, correctiveAction, waitingManagement, closed, cases] =
    await prisma.$transaction([
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
      prisma.incident.count({
        where: {
          status: "MANAGEMENT_REVIEW"
        }
      }),
      prisma.incident.count({
        where: {
          status: "CLOSED"
        }
      }),
      prisma.incident.findMany({
        where,
        select: {
          id: true,
          incidentCode: true,
          incidentDate: true,
          location: true,
          department: true,
          type: true,
          severity: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          reporter: {
            select: publicUserSelect
          },
          investigation: {
            select: {
              id: true,
              progress: true,
              correctiveActions: {
                select: {
                  status: true,
                  targetDate: true
                }
              }
            }
          }
        },
        orderBy: [
          {
            approvedAt: "desc"
          },
          {
            createdAt: "desc"
          }
        ],
        take: 500
      })
    ]);

  return {
    summary: {
      activeInvestigation,
      correctiveAction,
      waitingManagement,
      closed
    },
    cases
  };
}

export function findInvestigationCaseByIdentifier(incidentIdentifier) {
  return prisma.incident.findFirst({
    where: buildIdentifierWhere(incidentIdentifier),
    select: incidentCaseSelect
  });
}

async function findCaseInTransaction(transaction, incidentIdentifier) {
  return transaction.incident.findFirst({
    where: buildIdentifierWhere(incidentIdentifier),
    select: incidentCaseSelect
  });
}

function calculateProgress(actions = []) {
  if (!actions.length) {
    return 0;
  }

  return Math.round(
    actions.reduce((total, item) => total + Number(item.progress || 0), 0) /
      actions.length
  );
}

function splitTeamMembers(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDraftActions(actions = []) {
  return actions.map((item) => ({
    id: item.id || null,
    action: item.action || "",
    pic: item.pic || "",
    targetDate: item.targetDate
      ? item.targetDate.toISOString().slice(0, 10)
      : null,
    status: item.status,
    progress: Number(item.progress || 0),
    evidence: item.evidence || "",
    note: item.note || ""
  }));
}

function actionData(action, existing = null) {
  const completed = action.status === "COMPLETED";

  return {
    action: action.action,
    picName: action.pic,
    targetDate: action.targetDate,
    status: action.status,
    progress: action.progress,
    evidenceSummary: action.evidence || null,
    note: action.note || null,
    completedAt: completed
      ? existing?.completedAt || new Date()
      : null
  };
}

async function syncCorrectiveActions(
  transaction,
  { incidentId, investigationId, actions }
) {
  const existing = await transaction.correctiveAction.findMany({
    where: {
      investigationId
    },
    select: {
      id: true,
      status: true,
      completedAt: true
    }
  });
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const keptIds = [];

  for (const action of actions) {
    if (action.id && existingById.has(action.id)) {
      const updated = await transaction.correctiveAction.update({
        where: {
          id: action.id
        },
        data: actionData(action, existingById.get(action.id)),
        select: {
          id: true
        }
      });
      keptIds.push(updated.id);
      continue;
    }

    const created = await transaction.correctiveAction.create({
      data: {
        incidentId,
        investigationId,
        ...actionData(action)
      },
      select: {
        id: true
      }
    });
    keptIds.push(created.id);
  }

  await transaction.correctiveAction.deleteMany({
    where: {
      investigationId,
      ...(keptIds.length
        ? {
            id: {
              notIn: keptIds
            }
          }
        : {})
    }
  });
}

function investigationData(input, actor, progress, extra = {}) {
  return {
    investigationDate: input.investigationDate,
    leadInvestigatorId: actor.userId,
    leadInvestigatorName: input.investigator || actor.username,
    teamMembers: splitTeamMembers(input.teamMembers),
    method: input.method || null,
    verifiedChronology: input.verifiedChronology || null,
    findings: input.findings || null,
    witnesses: input.witnesses || null,
    evidenceDescription: input.evidenceDescription || null,
    immediateCause: input.immediateCause || null,
    rootCause: input.rootCause || null,
    contributingFactor: input.contributingFactor || null,
    fiveWhy: input.fiveWhy,
    progress,
    ...extra
  };
}

function auditData({ actor, auditData, incident, action, description, previousValue, newValue }) {
  return {
    ...auditData,
    action,
    recordType: "Investigation",
    recordId: incident.incidentCode,
    incidentId: incident.id,
    description,
    previousValue,
    newValue
  };
}

export function saveInvestigationDraftWithAudit({
  incidentIdentifier,
  input,
  actor,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    if (!existing) {
      return { type: "NOT_FOUND" };
    }

    if (
      !["INVESTIGATION", "CORRECTIVE_ACTION", "REVISION_REQUIRED"].includes(
        existing.status
      )
    ) {
      return { type: "CONFLICT" };
    }

    const investigation = existing.investigation ||
      (await transaction.investigation.create({
        data: {
          incidentId: existing.id,
          investigationDate: input.investigationDate || new Date(),
          leadInvestigatorId: actor.userId,
          leadInvestigatorName: input.investigator || actor.username,
          progress: 0
        },
        select: {
          id: true
        }
      }));

    const progress = calculateProgress(input.actions);
    const isInvestigationDraft = existing.status === "INVESTIGATION";

    await transaction.investigation.update({
      where: {
        incidentId: existing.id
      },
      data: investigationData(input, actor, progress, {
        actionPlanDraft: isInvestigationDraft ? toDraftActions(input.actions) : null
      })
    });

    if (!isInvestigationDraft) {
      const incompleteActions = input.actions.some(
        (item) => !item.action || !item.pic || !item.targetDate
      );

      if (incompleteActions) {
        return { type: "INVALID_ACTIONS" };
      }

      await syncCorrectiveActions(transaction, {
        incidentId: existing.id,
        investigationId: investigation.id,
        actions: input.actions
      });
    }

    await transaction.auditLog.create({
      data: auditData({
        actor,
        auditData,
        incident: existing,
        action: "UPDATE",
        description: `Investigation draft ${existing.incidentCode} disimpan oleh ${actor.username}.`,
        previousValue: {
          status: existing.status,
          progress: existing.investigation?.progress ?? 0
        },
        newValue: {
          status: existing.status,
          progress
        }
      })
    });

    const updated = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    return {
      type: "OK",
      case: updated
    };
  });
}

export function addInvestigationUpdateWithAudit({
  incidentIdentifier,
  note,
  actor,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    if (!existing || !existing.investigation) {
      return { type: "NOT_FOUND" };
    }

    if (
      !["INVESTIGATION", "CORRECTIVE_ACTION", "REVISION_REQUIRED"].includes(
        existing.status
      )
    ) {
      return { type: "CONFLICT" };
    }

    await transaction.investigationUpdate.create({
      data: {
        investigationId: existing.investigation.id,
        authorId: actor.userId,
        authorName: actor.username,
        note,
        progress: existing.investigation.progress || 0
      }
    });

    await transaction.auditLog.create({
      data: auditData({
        actor,
        auditData,
        incident: existing,
        action: "UPDATE",
        description: `Progress update investigation ${existing.incidentCode} ditambahkan oleh ${actor.username}.`,
        previousValue: null,
        newValue: {
          note,
          progress: existing.investigation.progress || 0
        }
      })
    });

    const updated = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    return {
      type: "OK",
      case: updated
    };
  });
}

export function startCorrectiveActionWithAudit({
  incidentIdentifier,
  input,
  actor,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    if (!existing) {
      return { type: "NOT_FOUND" };
    }

    if (existing.status !== "INVESTIGATION") {
      return { type: "CONFLICT" };
    }

    const investigation = existing.investigation;

    if (!investigation) {
      return { type: "NOT_FOUND" };
    }

    const progress = calculateProgress(input.actions);

    await transaction.investigation.update({
      where: {
        id: investigation.id
      },
      data: investigationData(input, actor, progress, {
        actionPlanDraft: null
      })
    });

    await syncCorrectiveActions(transaction, {
      incidentId: existing.id,
      investigationId: investigation.id,
      actions: input.actions
    });

    await transaction.incident.update({
      where: {
        id: existing.id
      },
      data: {
        status: "CORRECTIVE_ACTION"
      }
    });

    await transaction.auditLog.create({
      data: auditData({
        actor,
        auditData,
        incident: existing,
        action: "UPDATE",
        description: `Corrective Action untuk incident ${existing.incidentCode} dimulai oleh ${actor.username}.`,
        previousValue: {
          status: existing.status
        },
        newValue: {
          status: "CORRECTIVE_ACTION",
          actionCount: input.actions.length,
          progress
        }
      })
    });

    const updated = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    return {
      type: "OK",
      case: updated
    };
  });
}

export function submitInvestigationToManagementWithAudit({
  incidentIdentifier,
  input,
  actor,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    if (!existing || !existing.investigation) {
      return { type: "NOT_FOUND" };
    }

    if (
      !["CORRECTIVE_ACTION", "REVISION_REQUIRED"].includes(existing.status)
    ) {
      return { type: "CONFLICT" };
    }

    const now = new Date();
    const investigation = existing.investigation;

    await transaction.investigation.update({
      where: {
        id: investigation.id
      },
      data: investigationData(input, actor, 100, {
        actionPlanDraft: null,
        submittedByName: actor.username,
        submittedAt: now
      })
    });

    await syncCorrectiveActions(transaction, {
      incidentId: existing.id,
      investigationId: investigation.id,
      actions: input.actions
    });

    await transaction.incident.update({
      where: {
        id: existing.id
      },
      data: {
        status: "MANAGEMENT_REVIEW"
      }
    });

    await transaction.managementReview.upsert({
      where: {
        incidentId: existing.id
      },
      create: {
        incidentId: existing.id,
        status: "WAITING_REVIEW",
        note: null,
        reviewedById: null,
        reviewedAt: null
      },
      update: {
        status: "WAITING_REVIEW",
        note: null,
        reviewedById: null,
        reviewedAt: null
      }
    });

    await transaction.auditLog.create({
      data: auditData({
        actor,
        auditData,
        incident: existing,
        action: "SUBMIT",
        description: `Final investigation report ${existing.incidentCode} dikirim ke Management oleh ${actor.username}.`,
        previousValue: {
          status: existing.status
        },
        newValue: {
          status: "MANAGEMENT_REVIEW",
          progress: 100
        }
      })
    });

    const updated = await findCaseInTransaction(
      transaction,
      incidentIdentifier
    );

    return {
      type: "OK",
      case: updated
    };
  });
}
