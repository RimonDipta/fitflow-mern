import { Router } from "express";

import {
  createMembershipPlanController,
  getMembershipPlanController,
  listMembershipPlansController,
  updateMembershipPlanController,
  updateMembershipPlanStatusController,
} from "../controllers/membershipPlan.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";
import { validate } from "../middleware/validate.js";

import { UserRole } from "../models/User.js";

import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  updateMembershipPlanStatusSchema,
} from "../validators/membershipPlan.validator.js";

const router = Router();

const membershipPlanManagementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.GYM_ADMIN,
  UserRole.STAFF,
];

router.use(authenticate);
router.use(requireGym);

router.get(
  "/",
  authorize(...membershipPlanManagementRoles),
  listMembershipPlansController,
);

router.post(
  "/",
  authorize(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN),
  validate(createMembershipPlanSchema),
  createMembershipPlanController,
);

router.get(
  "/:planId",
  authorize(...membershipPlanManagementRoles),
  getMembershipPlanController,
);

router.patch(
  "/:planId",
  authorize(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN),
  validate(updateMembershipPlanSchema),
  updateMembershipPlanController,
);

router.patch(
  "/:planId/status",
  authorize(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN),
  validate(updateMembershipPlanStatusSchema),
  updateMembershipPlanStatusController,
);

export default router;
