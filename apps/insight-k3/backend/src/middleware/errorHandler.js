export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Unhandled request error:", error);

  const statusCode = Number(error.statusCode || error.status || 500);

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Terjadi kesalahan pada server."
        : error.message,
    requestId: req.requestId || null,
    ...(process.env.NODE_ENV === "development" && {
      detail: error.message
    })
  });
}
