import { Router } from "express";

import {
  getAdminAccessCheck,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { UserRole } from "../models/User.js";

const router = Router();

router.get("/me", authenticate, getCurrentUser);

router.get(
  "/admin-access",
  authenticate,
  authorize(UserRole.GYM_ADMIN),
  getAdminAccessCheck,
);

export default router;
