import { Router } from "express";

import {
  createMemberController,
  deleteMemberController,
  getMemberController,
  listMembersController,
  updateMemberController,
  updateMemberStatusController,
} from "../controllers/member.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireGym } from "../middleware/requireGym.js";
import { validate } from "../middleware/validate.js";
import { UserRole } from "../models/User.js";
import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
} from "../validators/member.validator.js";

const router = Router();

const memberManagementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.GYM_ADMIN,
  UserRole.STAFF,
];

router.use(authenticate);
router.use(requireGym);

router.get("/", authorize(...memberManagementRoles), listMembersController);

router.post(
  "/",
  authorize(...memberManagementRoles),
  validate(createMemberSchema),
  createMemberController,
);

router.get(
  "/:memberId",
  authorize(...memberManagementRoles),
  getMemberController,
);

router.patch(
  "/:memberId",
  authorize(...memberManagementRoles),
  validate(updateMemberSchema),
  updateMemberController,
);

router.patch(
  "/:memberId/status",
  authorize(...memberManagementRoles),
  validate(updateMemberStatusSchema),
  updateMemberStatusController,
);

router.delete(
  "/:memberId",
  authorize(UserRole.SUPER_ADMIN, UserRole.GYM_ADMIN),
  deleteMemberController,
);

export default router;
