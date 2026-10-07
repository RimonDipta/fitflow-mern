import { z } from "zod";

const gymDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Gym name must be at least 2 characters")
    .max(150, "Gym name cannot exceed 150 characters"),

  slug: z
    .string()
    .trim()
    .min(2, "Gym slug must be at least 2 characters")
    .max(100, "Gym slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Gym slug can only contain lowercase letters, numbers, and hyphens",
    )
    .transform((value) => value.toLowerCase()),

  email: z
    .string()
    .trim()
    .email("Please provide a valid gym email address")
    .toLowerCase()
    .optional(),

  phone: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters")
    .optional(),

  city: z
    .string()
    .trim()
    .max(100, "City cannot exceed 100 characters")
    .optional(),

  country: z
    .string()
    .trim()
    .max(100, "Country cannot exceed 100 characters")
    .optional(),
});

const gymAdminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Admin name must be at least 2 characters")
    .max(100, "Admin name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid admin email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export const createGymSchema = z.object({
  gym: gymDetailsSchema,

  admin: gymAdminSchema,
});

export type CreateGymInput = z.infer<typeof createGymSchema>;
