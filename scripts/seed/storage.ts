import { ensureBucket, getStorageClient, isStorageConfigured } from "../../src/server/storage/client";
import { DEMO_KEY_PREFIX } from "./ids";

export { isStorageConfigured };

const BUCKET = "public-media";
const FOLDER = DEMO_KEY_PREFIX.replace(/\/$/, "");

/** Keys of demo objects already in storage, e.g. "de5eed00/<id>.png". */
export async function listDemoKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await getStorageClient().storage.from(BUCKET).list(FOLDER, { limit: 1000, offset });
    if (error) throw new Error(`Listing demo images failed: ${error.message}`);
    for (const f of data ?? []) keys.add(`${DEMO_KEY_PREFIX}${f.name}`);
    if (!data || data.length < 1000) return keys;
  }
}

/** Uploads what is missing; never overwrites. Returns how many were uploaded. */
export async function uploadPlaceholders(items: { key: string; bytes: Uint8Array }[], existingKeys: Set<string>): Promise<number> {
  await ensureBucket(BUCKET);
  let uploaded = 0;
  for (const { key, bytes } of items) {
    if (existingKeys.has(key)) continue;
    const { error } = await getStorageClient().storage.from(BUCKET).upload(key, bytes, { contentType: "image/png", upsert: false });
    if (error) throw new Error(`Uploading ${key} failed: ${error.message}`);
    uploaded++;
  }
  return uploaded;
}

/** Removes every object under the demo prefix, with or without a matching row. */
export async function removeDemoKeys(): Promise<number> {
  const keys = Array.from(await listDemoKeys());
  for (let i = 0; i < keys.length; i += 100) {
    const { error } = await getStorageClient().storage.from(BUCKET).remove(keys.slice(i, i + 100));
    if (error) throw new Error(`Removing demo images failed: ${error.message}`);
  }
  return keys.length;
}
