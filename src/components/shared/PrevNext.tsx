import Link from "next/link";
import { MdArrowForward, MdOutlineArrowBack } from "react-icons/md";

export interface Neighbour {
  href: string;
  title: string;
}

// Older / newer neighbours of the current item, shown at the end of an article or project.
export default function PrevNext({ prev, next, prevLabel = "Previous", nextLabel = "Next" }: { prev: Neighbour | null; next: Neighbour | null; prevLabel?: string; nextLabel?: string }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="More to read" className="row g-3 mt-4">
      <div className="col-md-6">
        {prev && (
          <Link href={prev.href} className="card border-0 shadow rounded h-100 text-decoration-none">
            <div className="card-body">
              <span className="text-muted small d-inline-flex align-items-center gap-1"><MdOutlineArrowBack aria-hidden /> {prevLabel}</span>
              <span className="d-block fw-semibold text-dark mt-1">{prev.title}</span>
            </div>
          </Link>
        )}
      </div>
      <div className="col-md-6">
        {next && (
          <Link href={next.href} className="card border-0 shadow rounded h-100 text-decoration-none text-md-end">
            <div className="card-body">
              <span className="text-muted small d-inline-flex align-items-center gap-1">{nextLabel} <MdArrowForward aria-hidden /></span>
              <span className="d-block fw-semibold text-dark mt-1">{next.title}</span>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
