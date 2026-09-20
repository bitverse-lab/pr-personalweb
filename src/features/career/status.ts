import type { ApplicationStatus, InterviewKind, TimelineEventType } from "@/db/schema/career";

export const STATUS_META: Record<ApplicationStatus, { label: string; badge: string }> = {
  wishlist: { label: "Wishlist", badge: "badge bg-soft-secondary text-secondary" },
  applied: { label: "Applied", badge: "badge bg-soft-primary text-primary" },
  screening: { label: "Screening", badge: "badge bg-soft-info text-info" },
  interview: { label: "Interview", badge: "badge bg-soft-warning text-warning" },
  offer: { label: "Offer", badge: "badge bg-soft-success text-success" },
  rejected: { label: "Rejected", badge: "badge bg-soft-danger text-danger" },
  withdrawn: { label: "Withdrawn", badge: "badge bg-soft-secondary text-secondary" },
};

export const PIPELINE_COLUMNS: ApplicationStatus[] = ["wishlist", "applied", "screening", "interview", "offer"];
export const CLOSED_STATUSES: ApplicationStatus[] = ["rejected", "withdrawn"];
export const ALL_STATUSES: ApplicationStatus[] = [...PIPELINE_COLUMNS, ...CLOSED_STATUSES];

export const INTERVIEW_KIND_LABEL: Record<InterviewKind, string> = {
  phone: "Phone",
  technical: "Technical",
  hr: "HR",
  onsite: "Onsite",
  other: "Other",
};

export const TIMELINE_TYPE_LABEL: Record<TimelineEventType, string> = {
  created: "Created",
  status_changed: "Status",
  note: "Note",
  interview_scheduled: "Interview",
  interview_completed: "Interview",
  interview_cancelled: "Interview",
  contact_added: "Contact",
};

// Column accent colors (categorical palette slots + neutral gray for inactive stages).
export const STATUS_ACCENT: Record<ApplicationStatus, string> = {
  wishlist: "#898781",
  applied: "#2a78d6",
  screening: "#e87ba4",
  interview: "#eb6834",
  offer: "#1baf7a",
  rejected: "#e34948",
  withdrawn: "#898781",
};
