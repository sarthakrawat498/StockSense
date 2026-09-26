import { apiSuccess, handleApiError } from "@/lib/api";
import { withAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/db";

// GET /api/users — MANAGER only
export const GET = withAuth(
  async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          warehouseId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
      return apiSuccess(users, "Users fetched successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: ["MANAGER"] }
);
