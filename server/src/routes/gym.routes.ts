import { Router } from "express";

import {
  createGym,
  getCurrentGymController,
} from "../controllers/gym.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";
import { validate } from "../middleware/validate.js";
import { UserRole } from "../models/User.js";
import { createGymSchema } from "../validators/gym.validator.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate(createGymSchema),
  createGym,
);

router.get("/current", authenticate, requireGym, getCurrentGymController);

export default router;
