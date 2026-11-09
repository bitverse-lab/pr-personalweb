import Link from "next/link";
import type { IconType } from "react-icons";
import { FiArrowRight } from "react-icons/fi";

interface OverviewCardProps {
  title: string;
  icon: IconType;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}

export default function OverviewCard({ title, icon: Icon, href, linkLabel = "Open", children }: OverviewCardProps) {
  return (
    <div className="card rounded shadow-sm h-100 me-overview-card">
      <div className="card-body">
        <div className="me-overview-card-heading d-flex justify-content-between align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="features feature-primary feature-clean me-overview-feature flex-shrink-0" aria-hidden="true">
              <div className="icons rounded">
                <Icon className="icon" />
              </div>
            </div>
            <h2 className="h6 mb-0">{title}</h2>
          </div>
          {href && (
            <Link href={href} className="small d-inline-flex align-items-center gap-1 text-nowrap">
              {linkLabel} <FiArrowRight aria-hidden />
            </Link>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
