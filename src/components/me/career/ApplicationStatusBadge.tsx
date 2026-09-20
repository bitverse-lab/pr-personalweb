import {
  FiBookmark,
  FiCheckCircle,
  FiMessageCircle,
  FiSend,
  FiSearch,
  FiSlash,
  FiXCircle,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ApplicationStatus } from "@/db/schema/career";
import { STATUS_META } from "@/features/career/status";

const ICONS: Record<ApplicationStatus, IconType> = {
  wishlist: FiBookmark,
  applied: FiSend,
  screening: FiSearch,
  interview: FiMessageCircle,
  offer: FiCheckCircle,
  rejected: FiXCircle,
  withdrawn: FiSlash,
};

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const Icon = ICONS[status];
  const meta = STATUS_META[status];
  return (
    <span className={`${meta.badge} d-inline-flex align-items-center gap-1`}>
      <Icon aria-hidden /> {meta.label}
    </span>
  );
}
