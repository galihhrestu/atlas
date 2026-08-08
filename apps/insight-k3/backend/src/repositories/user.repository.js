import { prisma } from "../lib/prisma.js";

export const managedUserSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  department: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

function buildUserSearchWhere({ search, role, status }) {
  const where = {};

  if (search) {
    where.OR = [
      {
        username: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        fullName: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        department: {
          contains: search,
          mode: "insensitive"
        }
      }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  return where;
}

function toAuditUserSnapshot(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    department: user.department,
    role: user.role,
    status: user.status
  };
}

export async function listManagedUsers({
  search,
  role,
  status,
  page,
  limit
}) {
  const where = buildUserSearchWhere({ search, role, status });
  const skip = (page - 1) * limit;

  const [
    items,
    total,
    allUsers,
    active,
    inactive,
    suspended,
    admin
  ] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: managedUserSelect,
        orderBy: [
          { createdAt: "desc" },
          { username: "asc" }
        ],
        skip,
        take: limit
      }),
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "INACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { role: "ADMIN" } })
    ]);

  return {
    items,
    total,
    summary: {
      total: allUsers,
      active,
      inactive,
      suspended,
      admin
    }
  };
}

export function findManagedUserById(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
    select: managedUserSelect
  });
}

export function findManagedUserConflict({
  username,
  email,
  excludeUserId
}) {
  const conditions = [];

  if (username) {
    conditions.push({
      username: {
        equals: username,
        mode: "insensitive"
      }
    });
  }

  if (email) {
    conditions.push({
      email: {
        equals: email,
        mode: "insensitive"
      }
    });
  }

  if (conditions.length === 0) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: conditions,
      ...(excludeUserId
        ? {
            NOT: {
              id: excludeUserId
            }
          }
        : {})
    },
    select: {
      id: true,
      username: true,
      email: true
    }
  });
}

export function countOtherActiveAdministrators(userId) {
  return prisma.user.count({
    where: {
      id: {
        not: userId
      },
      role: "ADMIN",
      status: "ACTIVE"
    }
  });
}

export function createManagedUserWithAudit({
  userData,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: userData,
      select: managedUserSelect
    });

    await transaction.auditLog.create({
      data: {
        ...auditData,
        action: "CREATE",
        recordType: "User",
        recordId: user.id,
        description: `Akun ${user.username} dibuat.`,
        previousValue: null,
        newValue: toAuditUserSnapshot(user)
      }
    });

    return user;
  });
}

export function updateManagedUserWithAudit({
  userId,
  userData,
  previousUser,
  revokeSessions,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: {
        id: userId
      },
      data: userData,
      select: managedUserSelect
    });

    let revokedSessionCount = 0;

    if (revokeSessions) {
      const revocation = await transaction.authSession.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      revokedSessionCount = revocation.count;
    }

    await transaction.auditLog.create({
      data: {
        ...auditData,
        action: "UPDATE",
        recordType: "User",
        recordId: user.id,
        description: `Akun ${user.username} diperbarui.`,
        previousValue: toAuditUserSnapshot(previousUser),
        newValue: {
          ...toAuditUserSnapshot(user),
          sessionsRevoked: revokedSessionCount
        }
      }
    });

    return {
      user,
      revokedSessionCount
    };
  });
}

export function resetManagedUserPasswordWithAudit({
  userId,
  passwordHash,
  targetUser,
  auditData
}) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash
      },
      select: managedUserSelect
    });

    const revocation = await transaction.authSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        ...auditData,
        action: "UPDATE",
        recordType: "User",
        recordId: user.id,
        description: `Password akun ${targetUser.username} direset oleh administrator.`,
        previousValue: null,
        newValue: {
          passwordReset: true,
          sessionsRevoked: revocation.count
        }
      }
    });

    return {
      user,
      revokedSessionCount: revocation.count
    };
  });
}
