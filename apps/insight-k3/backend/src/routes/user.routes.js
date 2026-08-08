import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

const userWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Permintaan perubahan pengguna terlalu banyak. Silakan coba kembali."
  }
});

router.use(authenticate, authorize("ADMIN"));

router.get("/", listUsers);
router.get("/:userId", getUser);
router.post("/", userWriteLimiter, createUser);
router.patch("/:userId", userWriteLimiter, updateUser);
router.post(
  "/:userId/reset-password",
  userWriteLimiter,
  resetUserPassword
);

export default router;
