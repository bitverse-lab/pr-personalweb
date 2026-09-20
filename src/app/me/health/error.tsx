"use client";

import { FiAlertTriangle } from "react-icons/fi";

export default function HealthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card rounded shadow-sm">
      <div className="card-body text-center py-5">
        <FiAlertTriangle className="text-danger mb-2" size={28} />
        <h6 className="mb-1">Something went wrong loading this page</h6>
        <button type="button" className="btn btn-sm btn-primary mt-2" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
