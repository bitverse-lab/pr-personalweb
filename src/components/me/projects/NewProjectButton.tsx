"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiPlus } from "react-icons/fi";
import { createProjectDraft } from "@/features/projects/actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function NewProjectButton() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const result = await createProjectDraft();
      if (!result.ok) return toast.error(result.error);
      router.push(`/me/projects/${result.data.id}`);
    });

  return (
    <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" disabled={isPending} onClick={create}>
      <FiPlus /> New project
    </button>
  );
}
