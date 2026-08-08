import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getAuthConfig } from "../config/env.js";

const TOKEN_ISSUER = "insightk3-api";
const TOKEN_AUDIENCE = "insightk3-web";

export function signAccessToken(user) {
  const config = getAuthConfig();

  return jwt.sign(
    {
      type: "access",
      username: user.username,
      role: user.role
    },
    config.accessSecret,
    {
      algorithm: "HS256",
      subject: user.id,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: crypto.randomUUID(),
      expiresIn: config.accessExpiresIn
    }
  );
}

export function signRefreshToken({ userId, sessionId }) {
  const config = getAuthConfig();

  return jwt.sign(
    {
      type: "refresh",
      sid: sessionId
    },
    config.refreshSecret,
    {
      algorithm: "HS256",
      subject: userId,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: crypto.randomUUID(),
      expiresIn: config.refreshExpiresIn
    }
  );
}

export function verifyAccessToken(token) {
  const config = getAuthConfig();

  return jwt.verify(token, config.accessSecret, {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}

export function verifyRefreshToken(token) {
  const config = getAuthConfig();

  return jwt.verify(token, config.refreshSecret, {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getTokenExpiry(token) {
  const decodedToken = jwt.decode(token);

  if (
    !decodedToken ||
    typeof decodedToken === "string" ||
    typeof decodedToken.exp !== "number"
  ) {
    throw new Error("Token tidak memiliki waktu kedaluwarsa yang valid.");
  }

  return new Date(decodedToken.exp * 1000);
}

export function tokenHashesMatch(firstHash, secondHash) {
  if (
    typeof firstHash !== "string" ||
    typeof secondHash !== "string" ||
    firstHash.length !== secondHash.length
  ) {
    return false;
  }

  const firstBuffer = Buffer.from(firstHash, "hex");
  const secondBuffer = Buffer.from(secondHash, "hex");

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

export function createSessionId() {
  return crypto.randomUUID();
}
