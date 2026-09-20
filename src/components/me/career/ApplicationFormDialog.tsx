"use client";

import { useState, useTransition } from "react";
import { createApplication, updateApplication } from "@/features/career/actions";
import { ALL_STATUSES, STATUS_META } from "@/features/career/status";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApplicationStatus, WorkMode } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

interface ApplicationFormDialogProps {
  application?: ApplicationDto;
  companies: string[];
  initialStatus?: ApplicationStatus;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export default function ApplicationFormDialog({
  application,
  companies,
  initialStatus = "wishlist",
  onClose,
  onSaved,
}: ApplicationFormDialogProps) {
  const isEdit = Boolean(application);
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const toast = useToast();
  const [companyName, setCompanyName] = useState(application?.companyName ?? "");
  const [roleTitle, setRoleTitle] = useState(application?.roleTitle ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? initialStatus);
  const [location, setLocation] = useState(application?.location ?? "");
  const [workMode, setWorkMode] = useState<WorkMode | "">(application?.workMode ?? "");
  const [jobUrl, setJobUrl] = useState(application?.jobUrl ?? "");
  const [salaryRange, setSalaryRange] = useState(application?.salaryRange ?? "");
  const [appliedAt, setAppliedAt] = useState(application?.appliedAt ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateApplication({
            id: application!.id,
            companyName,
            roleTitle,
            location,
            workMode: workMode || null,
            jobUrl,
            salaryRange,
            appliedAt: appliedAt || null,
            notes,
          })
        : await createApplication({
            companyName,
            roleTitle,
            status,
            location: location || undefined,
            workMode: workMode || undefined,
            jobUrl: jobUrl || undefined,
            salaryRange: salaryRange || undefined,
            appliedAt: appliedAt || undefined,
            notes: notes || undefined,
          });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(isEdit ? "Application updated" : "Application added");
      onSaved?.(result.data.id);
      onClose();
    });
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="me-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h6 id="application-dialog-title" className="mb-3">
          {isEdit ? "Edit application" : "New application"}
        </h6>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-company">Company</label>
              <input id="app-company"
                name="company"
                className="form-control"
                list="career-company-options"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <datalist id="career-company-options">
                {companies.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-role">Role</label>
              <input id="app-role"
                name="role"
                className="form-control"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="row">
            {!isEdit && (
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="app-status">Stage</label>
                <select id="app-status"
                  name="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                >
                  {ALL_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_META[value].label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-appliedAt">Applied on</label>
              <input id="app-appliedAt"
                name="appliedAt"
                type="date"
                className="form-control"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-location">Location</label>
              <input id="app-location"
                name="location"
                className="form-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-workMode">Work mode</label>
              <select id="app-workMode"
                name="workMode"
                className="form-select"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
              >
                <option value="">Not set</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-jobUrl">Job posting URL</label>
              <input id="app-jobUrl"
                name="jobUrl"
                type="url"
                className="form-control"
                placeholder="https://"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="app-salaryRange">Salary range</label>
              <input id="app-salaryRange"
                name="salaryRange"
                className="form-control"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="app-notes">Notes</label>
            <textarea id="app-notes"
              name="notes"
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isPending || !companyName.trim() || !roleTitle.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
