import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(80, "Username cannot exceed 80 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  role: z.enum(["MANAGER", "STAFF"]).optional(),
  warehouseId: z.string().uuid("Invalid warehouse ID").nullable().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
