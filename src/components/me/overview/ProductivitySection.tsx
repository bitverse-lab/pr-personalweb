import ProductivityHeatmap, { type ActivityPoint } from "./ProductivityHeatmap";
import ProductivityTrendChart from "./ProductivityTrendChart";
import ProductivityStats from "./ProductivityStats";

export default function ProductivitySection({
  activity = [],
  overdue = 0,
}: {
  activity?: ActivityPoint[];
  overdue?: number;
}) {
  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title mb-3">Productivity</h6>

        <ProductivityStats activity={activity} overdue={overdue} />

        <p className="text-muted small mb-2">Last 90 days</p>
        <ProductivityHeatmap activity={activity} />

        <p className="text-muted small mb-2 mt-4">Completed per week</p>
        <ProductivityTrendChart activity={activity} />
      </div>
    </div>
  );
}
