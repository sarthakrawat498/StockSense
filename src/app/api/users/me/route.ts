import { type NextRequest } from "next/server";
import { z } from "zod";

import { apiSuccess, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (_req, _context, user) => {
  return apiSuccess(user, "Current user fetched successfully");
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName:  z.string().min(1).max(80).optional(),
});

export const PATCH = withAuth(async (req: NextRequest, _context, user) => {
  try {
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(validated.firstName !== undefined && { firstName: validated.firstName }),
        ...(validated.lastName  !== undefined && { lastName:  validated.lastName  }),
      },
    });

    return apiSuccess(
      {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        warehouseId: updated.warehouseId,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
});
