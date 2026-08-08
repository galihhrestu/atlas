import {
  countOtherActiveAdministrators,
  createManagedUserWithAudit,
  findManagedUserById,
  findManagedUserConflict,
  listManagedUsers,
  resetManagedUserPasswordWithAudit,
  updateManagedUserWithAudit
} from "../repositories/user.repository.js";
import { hashPassword } from "../utils/password.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildAuditData(actor, requestContext) {
  return {
    actorId: actor.userId,
    actorUsername: actor.username,
    actorRole: actor.role,
    module: "USER_MANAGEMENT",
    ipAddress: requestContext.ipAddress || null,
    userAgent: requestContext.userAgent || null
  };
}

function getConflictMessage(conflict, username, email) {
  if (
    username &&
    conflict.username.toLowerCase() === username.toLowerCase()
  ) {
    return "Username sudah digunakan oleh akun lain.";
  }

  if (
    email &&
    conflict.email.toLowerCase() === email.toLowerCase()
  ) {
    return "Email sudah digunakan oleh akun lain.";
  }

  return "Username atau email sudah digunakan oleh akun lain.";
}

async function ensureUniqueIdentity({
  username,
  email,
  excludeUserId
}) {
  const conflict = await findManagedUserConflict({
    username,
    email,
    excludeUserId
  });

  if (conflict) {
    throw createHttpError(
      409,
      getConflictMessage(conflict, username, email)
    );
  }
}

async function ensureAdministratorContinuity(targetUser, updates) {
  const roleAfterUpdate = updates.role ?? targetUser.role;
  const statusAfterUpdate = updates.status ?? targetUser.status;

  const targetStopsBeingActiveAdmin =
    targetUser.role === "ADMIN" &&
    targetUser.status === "ACTIVE" &&
    (roleAfterUpdate !== "ADMIN" || statusAfterUpdate !== "ACTIVE");

  if (!targetStopsBeingActiveAdmin) {
    return;
  }

  const otherActiveAdministrators =
    await countOtherActiveAdministrators(targetUser.id);

  if (otherActiveAdministrators === 0) {
    throw createHttpError(
      409,
      "Administrator aktif terakhir tidak boleh dinonaktifkan, ditangguhkan, atau diubah rolenya."
    );
  }
}

function normalizePrismaConflict(error) {
  if (error?.code === "P2002") {
    throw createHttpError(
      409,
      "Username atau email sudah digunakan oleh akun lain."
    );
  }

  throw error;
}

export async function getManagedUsers(query) {
  const result = await listManagedUsers(query);
  const totalPages = Math.max(
    1,
    Math.ceil(result.total / query.limit)
  );

  return {
    users: result.items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages
    },
    summary: result.summary
  };
}

export async function getManagedUser(userId) {
  const user = await findManagedUserById(userId);

  if (!user) {
    throw createHttpError(404, "Pengguna tidak ditemukan.");
  }

  return user;
}

export async function createManagedUser({
  input,
  actor,
  requestContext
}) {
  await ensureUniqueIdentity({
    username: input.username,
    email: input.email
  });

  const passwordHash = await hashPassword(input.password);

  try {
    return await createManagedUserWithAudit({
      userData: {
        username: input.username,
        email: input.email,
        passwordHash,
        fullName: input.fullName ?? null,
        department: input.department ?? null,
        role: input.role,
        status: input.status
      },
      auditData: buildAuditData(actor, requestContext)
    });
  } catch (error) {
    normalizePrismaConflict(error);
  }
}

export async function updateManagedUser({
  userId,
  input,
  actor,
  requestContext
}) {
  const targetUser = await getManagedUser(userId);

  if (targetUser.id === actor.userId) {
    const roleWillChange =
      input.role !== undefined && input.role !== targetUser.role;
    const statusWillChange =
      input.status !== undefined && input.status !== targetUser.status;

    if (roleWillChange || statusWillChange) {
      throw createHttpError(
        409,
        "Administrator tidak boleh mengubah role atau status akunnya sendiri dari halaman User Management."
      );
    }
  }

  await ensureAdministratorContinuity(targetUser, input);
  await ensureUniqueIdentity({
    username: input.username,
    email: input.email,
    excludeUserId: userId
  });

  const roleAfterUpdate = input.role ?? targetUser.role;
  const statusAfterUpdate = input.status ?? targetUser.status;
  const revokeSessions =
    roleAfterUpdate !== targetUser.role ||
    statusAfterUpdate !== targetUser.status ||
    statusAfterUpdate !== "ACTIVE";

  try {
    return await updateManagedUserWithAudit({
      userId,
      userData: input,
      previousUser: targetUser,
      revokeSessions,
      auditData: buildAuditData(actor, requestContext)
    });
  } catch (error) {
    normalizePrismaConflict(error);
  }
}

export async function resetManagedUserPassword({
  userId,
  input,
  actor,
  requestContext
}) {
  const targetUser = await getManagedUser(userId);

  if (targetUser.id === actor.userId) {
    throw createHttpError(
      409,
      "Password akun sendiri tidak dapat direset dari User Management. Gunakan menu pengaturan akun."
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  return resetManagedUserPasswordWithAudit({
    userId,
    passwordHash,
    targetUser,
    auditData: buildAuditData(actor, requestContext)
  });
}
