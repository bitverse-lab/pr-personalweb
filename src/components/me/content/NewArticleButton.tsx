"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiPlus } from "react-icons/fi";
import { createArticleDraft } from "@/features/content/article-actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function NewArticleButton({ className = "btn btn-primary btn-sm d-inline-flex align-items-center gap-1" }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const result = await createArticleDraft();
      if (!result.ok) return toast.error(result.error);
      router.push(`/me/articles/${result.data.id}`);
    });

  return (
    <button type="button" className={className} disabled={isPending} onClick={create}>
      <FiPlus /> New article
    </button>
  );
}
