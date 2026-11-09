// Demo rows (scripts/seed) carry this id prefix so they can be found and removed without
// touching anything the owner created. Pure module: shared by the app and the seed scripts.
export const DEMO_PREFIX = "de5eed00-";

/** Storage keys of demo uploads start with this, so cleanup can sweep them even without rows. */
export const DEMO_KEY_PREFIX = "de5eed00/";

export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_PREFIX);
}
