import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/**
 * Root page — immediately redirects to the dashboard.
 * The middleware guards protected routes, so unauthenticated users
 * will be bounced to /login before ever seeing the dashboard.
 */
export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
