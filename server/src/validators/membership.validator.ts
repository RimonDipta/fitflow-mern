import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const createMembershipSchema = z.object({
  memberId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid member ID"),

  membershipPlanId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid membership plan ID"),

  startDate: z.string().datetime({
    offset: true,
  }),

  paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "REFUNDED"]).optional(),

  notes: optionalString(2000),
});

export const updateMembershipSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "REFUNDED"]).optional(),

  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),

  notes: optionalString(2000),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
