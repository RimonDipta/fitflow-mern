import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const createMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Member name must be at least 2 characters")
    .max(100, "Member name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(255)
    .optional()
    .or(z.literal("")),

  phone: optionalString(20),

  dateOfBirth: z.string().datetime({ offset: true }).optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),

  address: optionalString(300),

  city: optionalString(100),

  country: optionalString(100),

  emergencyContactName: optionalString(100),

  emergencyContactPhone: optionalString(20),

  emergencyContactRelation: optionalString(50),

  height: z.number().positive().max(300).optional(),

  weight: z.number().positive().max(500).optional(),

  joinedAt: z.string().datetime({ offset: true }).optional(),

  notes: optionalString(2000),
});

export const updateMemberSchema = createMemberSchema.partial();

export const updateMemberStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;
