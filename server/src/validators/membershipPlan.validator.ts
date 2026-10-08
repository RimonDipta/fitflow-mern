import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const createMembershipPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Membership plan name must be at least 2 characters")
    .max(100, "Membership plan name cannot exceed 100 characters"),

  description: optionalString(500),

  durationDays: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be greater than 0")
    .max(3650, "Duration cannot exceed 3650 days"),

  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(100000000, "Price cannot exceed 100,000,000"),
});

export const updateMembershipPlanSchema = createMembershipPlanSchema.partial();

export const updateMembershipPlanStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateMembershipPlanInput = z.infer<
  typeof createMembershipPlanSchema
>;

export type UpdateMembershipPlanInput = z.infer<
  typeof updateMembershipPlanSchema
>;

export type UpdateMembershipPlanStatusInput = z.infer<
  typeof updateMembershipPlanStatusSchema
>;
