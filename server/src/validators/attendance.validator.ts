import { z } from "zod";

export const checkInSchema = z.object({
  memberId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid member ID"),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
