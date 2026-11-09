"use server";

import { requireUserId } from "@/server/auth";
import { setupService } from "@/server/services/setup-service";

export async function getSetupChecklist() {
  const userId = await requireUserId();
  return setupService.checklist(userId);
}

/** True while `pnpm db:seed` data is loaded, so the owner remembers to remove it before sharing. */
export async function getDemoStatus(): Promise<boolean> {
  const userId = await requireUserId();
  return setupService.hasDemoData(userId);
}
