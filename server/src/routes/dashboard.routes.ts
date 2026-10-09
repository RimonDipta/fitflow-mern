import { Router } from "express";

import { getDashboardStatsController } from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";

import { UserRole } from "../models/User.js";

const router = Router();

router.use(authenticate);
router.use(requireGym);

router.get(
  "/stats",
  authorize(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN, UserRole.STAFF),
  getDashboardStatsController,
);

export default router;
