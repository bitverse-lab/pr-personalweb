"use server";

import { requireUserId } from "@/server/auth";
import { setupService } from "@/server/services/setup-service";

export async function getSetupChecklist() {
  const userId = await requireUserId();
  return setupService.checklist(userId);
}
