import { FiDownload, FiInfo } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import { requireUserId } from "@/server/auth";
import { DATA_GROUPS, exportService } from "@/server/services/export-service";

export default async function DataSettingsPage() {
  const userId = await requireUserId();
  const counts = await exportService.counts(userId);
  const groups = DATA_GROUPS.map((g) => ({ label: g.label, total: g.tables.reduce((s, t) => s + (counts[t] ?? 0), 0) }));
  const total = groups.reduce((s, g) => s + g.total, 0);

  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Data" description="Everything you have stored here belongs to you. Download a copy any time." backHref="/me/settings" backLabel="Back to Settings" />

      <div className="card rounded shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h6 className="mb-1">Export all my data</h6>
            <p className="text-muted small mb-0">
              One JSON file with your profile, projects, articles, journal, tasks, career, health and more ({total.toLocaleString("en-US")} records). Uploaded files are listed but not included; login tokens are never exported.
            </p>
          </div>
          <a href="/me/settings/data/export" className="btn btn-primary d-inline-flex align-items-center gap-1" download>
            <FiDownload aria-hidden /> Download export
          </a>
        </div>
      </div>

      <div className="card rounded shadow-sm mb-3">
        <div className="card-body">
          <h6 className="mb-3">What is stored</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Area</th>
                  <th className="text-end">Records</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.label}>
                    <td>{g.label}</td>
                    <td className="text-end">{g.total.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="alert alert-info d-flex gap-2 mb-0">
        <FiInfo className="flex-shrink-0 mt-1" aria-hidden />
        <div className="small">
          <strong>Backups.</strong> This export is a convenient copy of your records, not a full backup: it does not include the uploaded files themselves. For a complete backup, also dump the database and download the storage buckets (see the README).
        </div>
      </div>
    </div>
  );
}
