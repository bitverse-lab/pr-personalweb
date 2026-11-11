import ProductivityHeatmap, { type ActivityPoint } from "./ProductivityHeatmap";
import ProductivityTrendChart from "./ProductivityTrendChart";
import ProductivityStats from "./ProductivityStats";
import { FiActivity } from "react-icons/fi";
import OverviewCard from "./OverviewCard";

export default function ProductivitySection({
  activity = [],
  overdue = 0,
  today,
}: {
  activity?: ActivityPoint[];
  overdue?: number;
  /** The owner's day ("YYYY-MM-DD"); every day key below is counted from it. */
  today: string;
}) {
  return (
    <OverviewCard title="Productivity" icon={FiActivity}>
      <ProductivityStats activity={activity} overdue={overdue} today={today} />

      <div className="row g-4 mt-0">
        <div className="col-md-5">
          <p className="text-muted small mb-2">Last 90 days</p>
          <ProductivityHeatmap activity={activity} today={today} />
        </div>
        <div className="col-md-7">
          <p className="text-muted small mb-2">Completed per week</p>
          <ProductivityTrendChart activity={activity} today={today} />
        </div>
      </div>
    </OverviewCard>
  );
}
