"use client";

import WorkspaceError from "@/components/me/WorkspaceError";

export default function RouteError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <WorkspaceError what="your career tracker" {...props} />;
}
