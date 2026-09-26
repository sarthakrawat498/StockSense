import { z } from "zod";

const optionalAddress = z
  .string()
  .trim()
  .max(500, "Address must be 500 characters or fewer")
  .optional();

export const createWarehouseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    code: z.string().trim().min(1, "Code is required").max(30),
    address: optionalAddress,
  })
  .strict();

export const updateWarehouseSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(120).optional(),
    address: optionalAddress,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

export const createLocationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    code: z.string().trim().min(1, "Code is required").max(30),
  })
  .strict();

export const updateLocationSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(120),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
