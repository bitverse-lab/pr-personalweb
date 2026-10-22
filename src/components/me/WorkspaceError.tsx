"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export interface WorkspaceErrorProps {
  /** What failed to load, in the owner's words: "your tasks", "this application". */
  what?: string;
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * The error state for every workspace page. Each route used to carry its own near-identical
 * copy, so a fix had to be made thirteen times; now only the wording differs.
 */
export default function WorkspaceError({ what = "this page", error, reset }: WorkspaceErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="card rounded shadow-sm">
        <div className="card-body text-center py-5">
          <FiAlertTriangle className="text-danger mb-3" size={28} aria-hidden />
          <h1 className="h6 mb-1">Something went wrong loading {what}</h1>
          <p className="text-muted small mb-3">
            Your data is safe. This is usually temporary — trying again often fixes it.
            {error.digest && <span className="d-block mt-1">Reference: {error.digest}</span>}
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={reset}>
              Try again
            </button>
            <Link href="/me" className="btn btn-sm btn-outline-primary">
              Back to overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
