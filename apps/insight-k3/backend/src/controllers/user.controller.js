import {
  createManagedUser,
  getManagedUser,
  getManagedUsers,
  resetManagedUserPassword,
  updateManagedUser
} from "../services/user.service.js";
import {
  validateCreateUserInput,
  validateListUserQuery,
  validateResetPasswordInput,
  validateUpdateUserInput,
  validateUserId
} from "../validators/user.validator.js";

function getRequestContext(req) {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null
  };
}

export async function listUsers(req, res) {
  const query = validateListUserQuery(req.query);
  const result = await getManagedUsers(query);

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    data: result,
    requestId: req.requestId
  });
}

export async function getUser(req, res) {
  const userId = validateUserId(req.params.userId);
  const user = await getManagedUser(userId);

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    data: {
      user
    },
    requestId: req.requestId
  });
}

export async function createUser(req, res) {
  const input = validateCreateUserInput(req.body);
  const user = await createManagedUser({
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.status(201).json({
    success: true,
    message: "Pengguna berhasil dibuat.",
    data: {
      user
    },
    requestId: req.requestId
  });
}

export async function updateUser(req, res) {
  const userId = validateUserId(req.params.userId);
  const input = validateUpdateUserInput(req.body);
  const result = await updateManagedUser({
    userId,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.status(200).json({
    success: true,
    message: "Pengguna berhasil diperbarui.",
    data: result,
    requestId: req.requestId
  });
}

export async function resetUserPassword(req, res) {
  const userId = validateUserId(req.params.userId);
  const input = validateResetPasswordInput(req.body);
  const result = await resetManagedUserPassword({
    userId,
    input,
    actor: req.auth,
    requestContext: getRequestContext(req)
  });

  return res.status(200).json({
    success: true,
    message: "Password pengguna berhasil direset.",
    data: result,
    requestId: req.requestId
  });
}
