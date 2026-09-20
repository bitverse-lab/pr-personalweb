export default function StorageSetupNotice() {
  return (
    <div className="alert alert-warning">
      <strong>File storage is not set up yet.</strong> Uploads need two values in <code>.env.local</code>, then a restart of the dev server:
      <ol className="mb-0 mt-2 small">
        <li>
          <code>SUPABASE_URL</code> — Supabase dashboard → Project Settings → API → <em>Project URL</em>
        </li>
        <li>
          <code>SUPABASE_SERVICE_ROLE_KEY</code> — same page → the <em>service_role</em> (secret) key. Keep it private: it must never be shared or committed.
        </li>
      </ol>
    </div>
  );
}
