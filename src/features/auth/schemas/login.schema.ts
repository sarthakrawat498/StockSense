import { z } from "zod";

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.identifier || data.username || data.email), {
    message: "Username or email is required",
    path: ["identifier"],
  })
  .transform((data) => ({
    identifier: (data.identifier || data.username || data.email)!.trim(),
    password: data.password,
  }));

export type LoginInput = z.infer<typeof loginSchema>;
