import { FiArchive, FiEdit3, FiGlobe } from "react-icons/fi";
import type { ArticleStatus } from "@/db/schema/content";

const META: Record<ArticleStatus, { label: string; cls: string; Icon: typeof FiGlobe }> = {
  draft: { label: "Draft", cls: "bg-soft-warning text-warning", Icon: FiEdit3 },
  published: { label: "Published", cls: "bg-soft-success text-success", Icon: FiGlobe },
  archived: { label: "Archived", cls: "bg-soft-secondary text-secondary", Icon: FiArchive },
};

export default function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const { label, cls, Icon } = META[status];
  return (
    <span className={`badge ${cls} d-inline-flex align-items-center gap-1`}>
      <Icon aria-hidden /> {label}
    </span>
  );
}
