import { prisma } from "../lib/prisma.js";

const publicUserSelect = {
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

export function findUserByIdentifier(identifier) {
  return prisma.user.findFirst({
    where: {
      OR: [
        {
          username: {
            equals: identifier,
            mode: "insensitive"
          }
        },
        {
          email: {
            equals: identifier,
            mode: "insensitive"
          }
        }
      ]
    },
    select: {
      ...publicUserSelect,
      passwordHash: true
    }
  });
}

export function findPublicUserById(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
    select: publicUserSelect
  });
}

export function createAuthSession(data) {
  return prisma.authSession.create({
    data
  });
}

export function findAuthSessionById(sessionId) {
  return prisma.authSession.findUnique({
    where: {
      id: sessionId
    },
    include: {
      user: {
        select: publicUserSelect
      }
    }
  });
}

export function revokeAuthSession(sessionId) {
  return prisma.authSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export function rotateAuthSession(oldSessionId, newSessionData) {
  return prisma.$transaction(async (transaction) => {
    const revocationResult = await transaction.authSession.updateMany({
      where: {
        id: oldSessionId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    if (revocationResult.count !== 1) {
      const error = new Error("Sesi refresh tidak lagi aktif.");
      error.statusCode = 401;
      throw error;
    }

    return transaction.authSession.create({
      data: newSessionData
    });
  });
}

export function createAuditLog(data) {
  return prisma.auditLog.create({
    data
  });
}
