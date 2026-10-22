"use server";

import { auth } from "@/server/auth";

/**
 * Cheap liveness check for the current session (JWT only, no database).
 * The client uses it to tell "your session expired" apart from "something else failed",
 * because Next.js hides the real cause of a failed Server Action in production.
 */
export async function isSessionAlive(): Promise<boolean> {
  try {
    const session = await auth();
    return !!session?.user?.id;
  } catch {
    return false;
  }
}
