// Downloads every object in every Supabase Storage bucket into <outDir>/<bucket>/<key>, and writes
// <outDir>/buckets.json (bucket settings + object list) so a restore can recreate them.
// Usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/backup/storage.mjs <outDir>
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const outDir = process.argv[2];
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!outDir || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/backup/storage.mjs <outDir>");
  process.exit(2);
}

const storage = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }).storage;

// Folders come back as entries with a null id; walk into them.
async function walk(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) files.push(...(await walk(bucket, path)));
      else files.push({ path, size: entry.metadata?.size ?? null, contentType: entry.metadata?.mimetype ?? null });
    }
    if (data.length < 1000) return files;
  }
}

const { data: buckets, error } = await storage.listBuckets();
if (error) throw new Error(`listing buckets: ${error.message}`);

const manifest = [];
let failed = 0;
for (const bucket of buckets) {
  const files = await walk(bucket.id);
  for (const file of files) {
    const { data, error: e } = await storage.from(bucket.id).download(file.path);
    if (e) {
      failed++;
      console.error(`download failed: ${bucket.id}/${file.path}: ${e.message}`);
      continue;
    }
    const target = join(outDir, bucket.id, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await data.arrayBuffer()));
  }
  manifest.push({ id: bucket.id, public: bucket.public, fileSizeLimit: bucket.file_size_limit, allowedMimeTypes: bucket.allowed_mime_types, files });
  console.log(`${bucket.id}: ${files.length} object(s)`);
}
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "buckets.json"), JSON.stringify(manifest, null, 2));
// A partial backup must not look like a good one.
if (failed) {
  console.error(`${failed} object(s) could not be downloaded`);
  process.exit(1);
}
