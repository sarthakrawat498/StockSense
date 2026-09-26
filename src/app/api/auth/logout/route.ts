
import { apiSuccess } from "@/lib/api";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  const response = apiSuccess(null, "Logged out successfully");
  clearAuthCookies(response);
  return response;
}
