import Link from "next/link";
import { FiCheckCircle, FiLogOut } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import { auth, signOut } from "@/server/auth";
import { requireUserId } from "@/server/auth";
import { isStorageConfigured } from "@/server/storage/client";
import { mediaService } from "@/server/services/media-service";
import { formatBytes, STORAGE_SOFT_LIMIT_BYTES } from "@/features/media/rules";
import { getUserTimeZone } from "@/lib/timezone";
import { siteUrl } from "@/lib/site";

export default async function AccountSettingsPage() {
  const session = await auth();
  const userId = await requireUserId();
  const [usage, timeZone] = await Promise.all([isStorageConfigured() ? mediaService.usage(userId) : Promise.resolve(null), getUserTimeZone()]);
  const user = session?.user;
  const pct = usage ? Math.min(100, Math.round((usage.bytes / STORAGE_SOFT_LIMIT_BYTES) * 100)) : 0;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Sign-in method", value: "Google" },
    { label: "Access", value: "Owner only — no other account can open /me" },
    { label: "Session length", value: "Up to 30 days on this browser, then you sign in again" },
    { label: "Timezone (from your browser)", value: timeZone },
    { label: "Site address", value: siteUrl() },
  ];

  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Account" description="Who is signed in, and how this workspace is protected." backHref="/me/settings" backLabel="Back to Settings" />

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-3">Signed in as</h6>
              <div className="d-flex align-items-center gap-3 mb-3">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" width={56} height={56} className="rounded-circle" referrerPolicy="no-referrer" />
                ) : (
                  <div className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-semibold fs-4" style={{ width: 56, height: 56 }} aria-hidden>
                    {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="fw-semibold">{user?.name ?? "Owner"}</div>
                  <div className="text-muted small">{user?.email}</div>
                  <span className="badge bg-soft-success text-success d-inline-flex align-items-center gap-1 mt-1">
                    <FiCheckCircle aria-hidden /> Verified owner
                  </span>
                </div>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1">
                  <FiLogOut aria-hidden /> Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-3">Security</h6>
              <dl className="row mb-0 small">
                {rows.map((r) => (
                  <div className="row mx-0 px-0 mb-2" key={r.label}>
                    <dt className="col-5 fw-medium">{r.label}</dt>
                    <dd className="col-7 text-muted mb-0">{r.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted small mt-3 mb-0">
                To sign out every device at once, change <code>AUTH_SECRET</code> on the server. To change which Google account owns the workspace, change <code>OWNER_EMAIL</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">File storage</h6>
              {usage ? (
                <>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>{usage.count} file{usage.count === 1 ? "" : "s"}</span>
                    <span>{formatBytes(usage.bytes)} of 1 GB used</span>
                  </div>
                  <div className="progress mb-2" style={{ height: 6 }} role="progressbar" aria-label="Storage used" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${Math.max(pct, usage.bytes > 0 ? 1 : 0)}%` }} />
                  </div>
                  <Link href="/me/media" className="small">Manage files</Link>
                </>
              ) : (
                <p className="text-muted small mb-0">
                  Storage is not connected yet. <Link href="/me/media">See how to set it up</Link>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
