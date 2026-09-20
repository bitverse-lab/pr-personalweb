import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaBucket } from "@/db/schema/media";
import { MAX_DOC_BYTES, MAX_IMAGE_BYTES } from "@/features/media/rules";

// Server-only Supabase Storage access using the service-role key. Never import this from client code.

let client: SupabaseClient | null = null;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.");
  }
}

export function isStorageConfigured() {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getStorageClient(): SupabaseClient {
  if (!isStorageConfigured()) throw new StorageNotConfiguredError();
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const BUCKETS: Record<MediaBucket, { public: boolean; maxBytes: number }> = {
  "public-media": { public: true, maxBytes: MAX_IMAGE_BYTES },
  "private-docs": { public: false, maxBytes: MAX_DOC_BYTES },
};

const ensured = new Set<MediaBucket>();

/** Creates the bucket on first use. Safe to call repeatedly. */
export async function ensureBucket(bucket: MediaBucket) {
  if (ensured.has(bucket)) return;
  const storage = getStorageClient().storage;
  const { error } = await storage.createBucket(bucket, { public: BUCKETS[bucket].public, fileSizeLimit: BUCKETS[bucket].maxBytes });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`Could not prepare storage: ${error.message}`);
  ensured.add(bucket);
}

export function publicObjectUrl(bucket: MediaBucket, key: string): string | null {
  if (!BUCKETS[bucket].public || !process.env.SUPABASE_URL) return null;
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${key}`;
}
