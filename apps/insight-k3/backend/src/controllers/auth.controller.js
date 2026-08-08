import { getAuthConfig } from "../config/env.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserSession
} from "../services/auth.service.js";
import { validateLoginInput } from "../validators/auth.validator.js";

function getRequestContext(req) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null
  };
}

function getCookieBaseOptions() {
  const config = getAuthConfig();

  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/api/auth"
  };
}

function setRefreshCookie(res, refreshToken, refreshExpiresAt) {
  const config = getAuthConfig();

  res.cookie(config.cookieName, refreshToken, {
    ...getCookieBaseOptions(),
    expires: refreshExpiresAt
  });
}

function clearRefreshCookie(res) {
  const config = getAuthConfig();

  res.clearCookie(config.cookieName, getCookieBaseOptions());
}

export async function login(req, res) {
  const input = validateLoginInput(req.body);
  const result = await loginUser({
    ...input,
    ...getRequestContext(req)
  });

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshExpiresAt
  );

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Login berhasil.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      tokenType: "Bearer",
      expiresIn: getAuthConfig().accessExpiresIn
    },
    requestId: req.requestId
  });
}

export async function refresh(req, res) {
  const config = getAuthConfig();
  const result = await refreshUserSession({
    refreshToken: req.cookies?.[config.cookieName],
    ...getRequestContext(req)
  });

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshExpiresAt
  );

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Token akses berhasil diperbarui.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      tokenType: "Bearer",
      expiresIn: config.accessExpiresIn
    },
    requestId: req.requestId
  });
}

export async function logout(req, res) {
  const config = getAuthConfig();

  await logoutUser({
    refreshToken: req.cookies?.[config.cookieName],
    ...getRequestContext(req)
  });

  clearRefreshCookie(res);
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Logout berhasil.",
    requestId: req.requestId
  });
}

export async function me(req, res) {
  const user = await getCurrentUser(req.auth.userId);

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    data: {
      user
    },
    requestId: req.requestId
  });
}
