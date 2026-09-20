"use server";

import { requireUserId } from "@/server/auth";
import { healthDashboardService } from "@/server/services/health-dashboard-service";
import { todayInUserTz } from "@/lib/timezone";

export async function getHealthDashboard() {
  const userId = await requireUserId();
  return healthDashboardService.build(userId, await todayInUserTz());
}
