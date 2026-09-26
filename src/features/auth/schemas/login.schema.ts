import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: "Username or email is required" })
    .trim()
    .min(1, "Please enter your username or email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Please enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
