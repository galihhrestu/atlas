import { findPublicUserById } from "../repositories/auth.repository.js";
import { verifyAccessToken } from "../utils/token.js";

function createUnauthorizedError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

export async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw createUnauthorizedError("Token akses tidak tersedia.");
    }

    const accessToken = authorizationHeader.slice(7).trim();

    if (!accessToken) {
      throw createUnauthorizedError("Token akses tidak tersedia.");
    }

    let tokenPayload;

    try {
      tokenPayload = verifyAccessToken(accessToken);
    } catch {
      throw createUnauthorizedError(
        "Token akses tidak valid atau telah kedaluwarsa."
      );
    }

    if (
      tokenPayload.type !== "access" ||
      typeof tokenPayload.sub !== "string"
    ) {
      throw createUnauthorizedError("Token akses tidak valid.");
    }

    const user = await findPublicUserById(tokenPayload.sub);

    if (!user || user.status !== "ACTIVE") {
      throw createUnauthorizedError(
        "Pengguna tidak tersedia atau tidak aktif."
      );
    }

    req.auth = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
