export function authorize(...allowedRoles) {
  const normalizedRoles = new Set(allowedRoles);

  return function roleAuthorizationMiddleware(req, res, next) {
    if (!req.auth) {
      const error = new Error("Autentikasi diperlukan.");
      error.statusCode = 401;
      return next(error);
    }

    if (!normalizedRoles.has(req.auth.role)) {
      const error = new Error(
        "Anda tidak memiliki hak akses untuk endpoint ini."
      );
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
}
