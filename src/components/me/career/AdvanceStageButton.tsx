"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { changeApplicationStatus } from "@/features/career/actions";
import { PIPELINE_COLUMNS, STATUS_META } from "@/features/career/status";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApplicationStatus } from "@/db/schema/career";

/** The one-click next step ("Move to Interview"), with Undo. Absent at Offer or once closed. */
export default function AdvanceStageButton({ id, status }: { id: string; status: ApplicationStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const index = PIPELINE_COLUMNS.indexOf(status);
  const next = index >= 0 ? PIPELINE_COLUMNS[index + 1] : undefined;
  if (!next) return null;

  const go = (to: ApplicationStatus, back?: ApplicationStatus) =>
    startTransition(async () => {
      const result = await changeApplicationStatus({ id, status: to });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      if (back) toast.success(`Moved to ${STATUS_META[to].label}`, { action: { label: "Undo", onClick: () => go(back) } });
    });

  return (
    <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" disabled={isPending} onClick={() => go(next, status)}>
      Move to {STATUS_META[next].label} <FiArrowRight aria-hidden />
    </button>
  );
}
