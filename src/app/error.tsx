"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a page fails while rendering. The details stay in the server logs; visitors only see this.
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-half-170 d-table w-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7 text-center">
            <div className="display-1 fw-bold text-primary mb-2">Oops</div>
            <h4 className="mb-3">Something went wrong</h4>
            <p className="text-muted mb-4">
              An unexpected error happened while loading this page. Please try again in a moment.
              {error.digest && <span className="d-block small mt-2">Reference: {error.digest}</span>}
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
              <Link href="/" className="btn btn-outline-primary">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
