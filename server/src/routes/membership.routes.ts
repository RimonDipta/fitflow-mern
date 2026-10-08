import { Router } from "express";

import {
  createMembershipController,
  getMembershipController,
  listMembershipsController,
  updateMembershipController,
} from "../controllers/membership.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";
import { validate } from "../middleware/validate.js";

import { UserRole } from "../models/User.js";

import {
  createMembershipSchema,
  updateMembershipSchema,
} from "../validators/membership.validator.js";

const router = Router();

const membershipManagementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.GYM_ADMIN,
  UserRole.STAFF,
];

router.use(authenticate);
router.use(requireGym);

router.get(
  "/",
  authorize(...membershipManagementRoles),
  listMembershipsController,
);

router.post(
  "/",
  authorize(...membershipManagementRoles),
  validate(createMembershipSchema),
  createMembershipController,
);

router.get(
  "/:membershipId",
  authorize(...membershipManagementRoles),
  getMembershipController,
);

router.patch(
  "/:membershipId",
  authorize(...membershipManagementRoles),
  validate(updateMembershipSchema),
  updateMembershipController,
);

export default router;
