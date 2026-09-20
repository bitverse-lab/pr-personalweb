"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ApplicationFormDialog from "./ApplicationFormDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import { changeApplicationStatus, deleteApplication } from "@/features/career/actions";
import { ALL_STATUSES, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

export default function ApplicationHeaderActions({
  application,
  companies,
}: {
  application: ApplicationDto;
  companies: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [isPending, startTransition] = useTransition();

  const handleStatus = (next: ApplicationStatus) => {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await changeApplicationStatus({ id: application.id, status: next });
      if (!result.ok) {
        setStatus(previous);
        toast.error(result.error);
        return;
      }
      toast.success(`Moved to ${STATUS_META[next].label}`);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteApplication(application.id);
      setConfirming(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Application deleted");
      router.push("/me/career");
    });
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <select
          name="status"
          className="form-select form-select-sm"
          style={{ width: "auto" }}
          value={status}
          onChange={(e) => handleStatus(e.target.value as ApplicationStatus)}
          disabled={isPending}
          aria-label="Application stage"
        >
          {ALL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_META[value].label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" onClick={() => setEditing(true)}>
          <FiEdit2 /> Edit
        </button>
        <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" onClick={() => setConfirming(true)}>
          <FiTrash2 /> Delete
        </button>
      </div>
      {editing && (
        <ApplicationFormDialog application={application} companies={companies} onClose={() => setEditing(false)} />
      )}
      {confirming && (
        <ConfirmDialog
          title="Delete application?"
          message={`"${application.roleTitle}" at ${application.companyName} and its timeline, contacts and interviews will be permanently deleted.`}
          isPending={isPending}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
