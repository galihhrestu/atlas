import { Router } from "express";
import {
  addInvestigationUpdate,
  beginCorrectiveAction,
  getInvestigation,
  getInvestigationMonitoring,
  saveInvestigation,
  submitManagement
} from "../controllers/investigation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get(
  "/monitoring",
  authenticate,
  authorize("OPERATOR", "ADMIN"),
  getInvestigationMonitoring
);

router.get(
  "/:incidentIdentifier",
  authenticate,
  authorize("OPERATOR", "MANAGEMENT", "ADMIN"),
  getInvestigation
);

router.put(
  "/:incidentIdentifier",
  authenticate,
  authorize("OPERATOR", "ADMIN"),
  saveInvestigation
);

router.post(
  "/:incidentIdentifier/updates",
  authenticate,
  authorize("OPERATOR", "ADMIN"),
  addInvestigationUpdate
);

router.post(
  "/:incidentIdentifier/start-corrective-action",
  authenticate,
  authorize("OPERATOR", "ADMIN"),
  beginCorrectiveAction
);

router.post(
  "/:incidentIdentifier/submit-management",
  authenticate,
  authorize("OPERATOR", "ADMIN"),
  submitManagement
);

export default router;
