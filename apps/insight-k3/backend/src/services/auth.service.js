import {
  createAuditLog,
  createAuthSession,
  findAuthSessionById,
  findPublicUserById,
  findUserByIdentifier,
  revokeAuthSession,
  rotateAuthSession
} from "../repositories/auth.repository.js";
import { verifyPassword } from "../utils/password.js";
import {
  createSessionId,
  getTokenExpiry,
  hashToken,
  signAccessToken,
  signRefreshToken,
  tokenHashesMatch,
  verifyRefreshToken
} from "../utils/token.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    department: user.department,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function ensureActiveUser(user) {
  if (!user) {
    throw createHttpError(401, "Kredensial login tidak valid.");
  }

  if (user.status === "INACTIVE") {
    throw createHttpError(403, "Akun belum aktif.");
  }

  if (user.status === "SUSPENDED") {
    throw createHttpError(403, "Akun sedang ditangguhkan.");
  }

  if (user.status !== "ACTIVE") {
    throw createHttpError(403, "Akun tidak dapat digunakan.");
  }
}

async function safeWriteAuditLog(data) {
  try {
    await createAuditLog(data);
  } catch (error) {
    console.error("Audit autentikasi gagal disimpan:", error);
  }
}

function buildSessionData({
  sessionId,
  userId,
  refreshToken,
  refreshExpiresAt,
  ipAddress,
  userAgent
}) {
  return {
    id: sessionId,
    userId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  };
}

export async function loginUser({
  identifier,
  password,
  ipAddress,
  userAgent
}) {
  const user = await findUserByIdentifier(identifier);

  ensureActiveUser(user);

  const passwordMatches = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw createHttpError(401, "Kredensial login tidak valid.");
  }

  const accessToken = signAccessToken(user);
  const sessionId = createSessionId();
  const refreshToken = signRefreshToken({
    userId: user.id,
    sessionId
  });
  const refreshExpiresAt = getTokenExpiry(refreshToken);

  await createAuthSession(
    buildSessionData({
      sessionId,
      userId: user.id,
      refreshToken,
      refreshExpiresAt,
      ipAddress,
      userAgent
    })
  );

  await safeWriteAuditLog({
    actorId: user.id,
    actorUsername: user.username,
    actorRole: user.role,
    module: "AUTH",
    action: "LOGIN",
    recordType: "AuthSession",
    recordId: sessionId,
    description: "Pengguna berhasil login.",
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    refreshExpiresAt
  };
}

export async function refreshUserSession({
  refreshToken,
  ipAddress,
  userAgent
}) {
  if (!refreshToken) {
    throw createHttpError(401, "Refresh token tidak tersedia.");
  }

  let tokenPayload;

  try {
    tokenPayload = verifyRefreshToken(refreshToken);
  } catch {
    throw createHttpError(
      401,
      "Refresh token tidak valid atau telah kedaluwarsa."
    );
  }

  if (
    tokenPayload.type !== "refresh" ||
    typeof tokenPayload.sub !== "string" ||
    typeof tokenPayload.sid !== "string"
  ) {
    throw createHttpError(401, "Refresh token tidak valid.");
  }

  const currentSession = await findAuthSessionById(tokenPayload.sid);

  if (
    !currentSession ||
    currentSession.userId !== tokenPayload.sub ||
    currentSession.revokedAt ||
    currentSession.expiresAt <= new Date()
  ) {
    throw createHttpError(
      401,
      "Sesi refresh tidak tersedia atau telah berakhir."
    );
  }

  const suppliedTokenHash = hashToken(refreshToken);

  if (
    !tokenHashesMatch(
      currentSession.refreshTokenHash,
      suppliedTokenHash
    )
  ) {
    await revokeAuthSession(currentSession.id);
    throw createHttpError(401, "Refresh token tidak cocok dengan sesi.");
  }

  ensureActiveUser(currentSession.user);

  const newSessionId = createSessionId();
  const newRefreshToken = signRefreshToken({
    userId: currentSession.user.id,
    sessionId: newSessionId
  });
  const newRefreshExpiresAt = getTokenExpiry(newRefreshToken);

  await rotateAuthSession(
    currentSession.id,
    buildSessionData({
      sessionId: newSessionId,
      userId: currentSession.user.id,
      refreshToken: newRefreshToken,
      refreshExpiresAt: newRefreshExpiresAt,
      ipAddress,
      userAgent
    })
  );

  return {
    user: toPublicUser(currentSession.user),
    accessToken: signAccessToken(currentSession.user),
    refreshToken: newRefreshToken,
    refreshExpiresAt: newRefreshExpiresAt
  };
}

export async function logoutUser({
  refreshToken,
  ipAddress,
  userAgent
}) {
  if (!refreshToken) {
    return;
  }

  let tokenPayload;

  try {
    tokenPayload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  if (
    tokenPayload.type !== "refresh" ||
    typeof tokenPayload.sid !== "string"
  ) {
    return;
  }

  const session = await findAuthSessionById(tokenPayload.sid);

  await revokeAuthSession(tokenPayload.sid);

  if (session?.user) {
    await safeWriteAuditLog({
      actorId: session.user.id,
      actorUsername: session.user.username,
      actorRole: session.user.role,
      module: "AUTH",
      action: "LOGOUT",
      recordType: "AuthSession",
      recordId: tokenPayload.sid,
      description: "Pengguna logout.",
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
  }
}

export async function getCurrentUser(userId) {
  const user = await findPublicUserById(userId);

  ensureActiveUser(user);

  return toPublicUser(user);
}
