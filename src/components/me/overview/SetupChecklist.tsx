import Link from "next/link";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import type { SetupItem } from "@/server/services/setup-service";

// Onboarding card: shows what is left to set up, and disappears once everything is done.
export default function SetupChecklist({ items }: { items: SetupItem[] }) {
  const done = items.filter((i) => i.done).length;
  const remaining = items.filter((i) => !i.done);
  if (done === items.length) return null;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="card rounded shadow-sm mb-4 me-setup-card">
      <div className="card-body">
        <div className="row align-items-center g-4">
          <div className="col-12 col-xl-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="features feature-primary feature-clean me-setup-feature flex-shrink-0" aria-hidden="true">
                <div className="icons rounded">
                  <FiCheckCircle className="icon" />
                </div>
              </div>
              <div>
                <h6 className="mb-1">Finish setting up</h6>
                <span className="text-muted small">{done} of {items.length} complete</span>
              </div>
            </div>
            <div className="progress" role="progressbar" aria-label="Setup progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <ul className="me-setup-items col-12 col-xl-8 list-unstyled mb-0">
            {remaining.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="me-setup-item d-flex align-items-start gap-3 h-100 p-3 rounded text-decoration-none">
                  <div className="features feature-primary feature-clean me-setup-item-icon flex-shrink-0" aria-hidden="true">
                    <div className="icons rounded">
                      <FiCircle className="icon" />
                    </div>
                  </div>
                  <span>
                    <span className="fw-semibold d-block">{item.label}</span>
                    <span className="text-muted small">{item.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
