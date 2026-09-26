import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api/middleware";

export const GET = withAuth(async (_req, _context, user) => {
  return apiSuccess(user, "User session fetched successfully");
});
