import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createIncident,
  decideIncident,
  getIncident,
  getOperatorDashboard,
  listIncidents
} from "../controllers/incident.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

const createIncidentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Pengiriman laporan terlalu sering. Silakan tunggu lalu coba kembali."
  }
});

router.get("/", authenticate, listIncidents);

router.get(
  "/operator-dashboard",
  authenticate,
  authorize("OPERATOR"),
  getOperatorDashboard
);

router.patch(
  "/:incidentIdentifier/decision",
  authenticate,
  authorize("OPERATOR"),
  decideIncident
);

router.get("/:incidentIdentifier", authenticate, getIncident);

router.post(
  "/",
  authenticate,
  authorize("USER"),
  createIncidentLimiter,
  createIncident
);

export default router;
