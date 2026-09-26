import type { NextRequest } from "next/server";
import { z } from "zod";

import { apiSuccess, apiNotFound, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/db";

const updateRoleSchema = z.object({
  role: z.enum(["MANAGER", "STAFF"]),
});

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/users/:id — MANAGER only — update role
export const PATCH = withAuth<RouteContext>(
  async (req: NextRequest, context: RouteContext, _user) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const { role } = updateRoleSchema.parse(body);

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return apiNotFound("User not found");

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true, username: true, email: true,
          firstName: true, lastName: true, role: true,
          warehouseId: true, createdAt: true,
        },
      });

      return apiSuccess(updated, `User role updated to ${role}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: ["MANAGER"] }
);
