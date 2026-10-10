import { Router } from "express";

import {
  checkInController,
  checkOutController,
  listAttendanceController,
} from "../controllers/attendance.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";
import { validate } from "../middleware/validate.js";
import { UserRole } from "../models/User.js";
import { checkInSchema } from "../validators/attendance.validator.js";

const router = Router();

const attendanceManagementRoles = [
  UserRole.GYM_ADMIN,
  UserRole.STAFF,
  UserRole.TRAINER,
];

router.use(authenticate);
router.use(requireGym);
router.use(authorize(...attendanceManagementRoles));

router.get("/", listAttendanceController);

router.post("/check-in", validate(checkInSchema), checkInController);

router.patch("/:attendanceId/check-out", checkOutController);

export default router;
