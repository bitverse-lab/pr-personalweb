import { cookies } from "next/headers";

export const TZ_COOKIE = "tz";
const DEFAULT_TZ = "Asia/Jakarta";

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function getUserTimeZone(): Promise<string> {
  const value = (await cookies()).get(TZ_COOKIE)?.value;
  return value && isValidTimeZone(value) ? value : DEFAULT_TZ;
}

/** "YYYY-MM-DD" for the current moment in the user's timezone. */
export async function todayInUserTz(): Promise<string> {
  const tz = await getUserTimeZone();
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date()
  );
}
