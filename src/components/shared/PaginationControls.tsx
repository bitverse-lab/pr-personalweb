"use client";

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  page,
  pageCount,
  start,
  end,
  total,
  itemLabel,
  onPageChange,
}: PaginationControlsProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mt-3">
      <span className="text-muted small" aria-live="polite">
        Showing {start}–{end} of {total} {itemLabel}
      </span>
      <nav aria-label={`${itemLabel} pages`}>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button type="button" className="page-link" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </button>
          </li>
          <li className="page-item disabled" aria-current="page">
            <span className="page-link">Page {page} of {pageCount}</span>
          </li>
          <li className={`page-item ${page === pageCount ? "disabled" : ""}`}>
            <button type="button" className="page-link" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
