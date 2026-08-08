import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { getServerConfig } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestId } from "./middleware/requestId.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import investigationRoutes from "./routes/investigation.routes.js";
import userRoutes from "./routes/user.routes.js";

const config = getServerConfig();
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = config.corsOrigin
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      const error = new Error("Origin tidak diizinkan oleh CORS.");
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Terlalu banyak permintaan. Silakan coba kembali."
    }
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "INSIGHTK3 API",
    version: "1.0.0",
    stage: "Authentication, User Management, and Incident Reporting",
    endpoints: {
      health: "/api/health",
      databaseStatus: "/api/database-status",
      auth: {
        login: "POST /api/auth/login",
        refresh: "POST /api/auth/refresh",
        logout: "POST /api/auth/logout",
        currentUser: "GET /api/auth/me"
      },
      incidentReporting: {
        list: "GET /api/incidents",
        detail: "GET /api/incidents/:incidentIdentifier",
        create: "POST /api/incidents"
      },
      investigation: {
        monitoring: "GET /api/investigations/monitoring",
        detail: "GET /api/investigations/:incidentIdentifier",
        saveDraft: "PUT /api/investigations/:incidentIdentifier",
        addUpdate: "POST /api/investigations/:incidentIdentifier/updates",
        startCorrectiveAction: "POST /api/investigations/:incidentIdentifier/start-corrective-action",
        submitManagement: "POST /api/investigations/:incidentIdentifier/submit-management"
      },
      userManagement: {
        list: "GET /api/users",
        detail: "GET /api/users/:userId",
        create: "POST /api/users",
        update: "PATCH /api/users/:userId",
        resetPassword: "POST /api/users/:userId/reset-password"
      }
    },
    requestId: req.requestId
  });
});

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/investigations", investigationRoutes);
app.use("/api/users", userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
