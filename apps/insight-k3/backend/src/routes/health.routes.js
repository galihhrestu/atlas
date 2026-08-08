import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "INSIGHTK3 API",
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

router.get("/database-status", async (req, res, next) => {
  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const latencyMs = Math.round(performance.now() - startedAt);

    res.status(200).json({
      success: true,
      status: "ok",
      database: "connected",
      provider: "postgresql",
      latencyMs,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  } catch (error) {
    error.statusCode = 503;
    error.message = "Database PostgreSQL belum dapat dihubungi.";
    next(error);
  }
});

export default router;
