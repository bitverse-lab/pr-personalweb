import Link from "next/link";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import type { SetupItem } from "@/server/services/setup-service";

// Onboarding card: shows what is left to set up, and disappears once everything is done.
export default function SetupChecklist({ items }: { items: SetupItem[] }) {
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return null;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="card rounded shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <h6 className="mb-0">Finish setting up</h6>
          <span className="text-muted small">{done} of {items.length} done</span>
        </div>
        <div className="progress mb-3" style={{ height: 6 }} role="progressbar" aria-label="Setup progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <ul className="list-unstyled mb-0 row row-cols-1 row-cols-md-2 g-2">
          {items.map((item) => (
            <li className="col" key={item.key}>
              {item.done ? (
                <div className="d-flex align-items-start gap-2 text-muted">
                  <FiCheckCircle className="text-success mt-1 flex-shrink-0" aria-label="Done" />
                  <span className="text-decoration-line-through">{item.label}</span>
                </div>
              ) : (
                <Link href={item.href} className="d-flex align-items-start gap-2 text-decoration-none text-dark">
                  <FiCircle className="text-primary mt-1 flex-shrink-0" aria-label="To do" />
                  <span>
                    <span className="fw-semibold">{item.label}</span>
                    <span className="d-block text-muted small">{item.hint}</span>
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
