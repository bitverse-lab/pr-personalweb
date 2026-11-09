import ProductivityHeatmap, { type ActivityPoint } from "./ProductivityHeatmap";
import ProductivityTrendChart from "./ProductivityTrendChart";
import ProductivityStats from "./ProductivityStats";
import { FiActivity } from "react-icons/fi";
import OverviewCard from "./OverviewCard";

export default function ProductivitySection({
  activity = [],
  overdue = 0,
}: {
  activity?: ActivityPoint[];
  overdue?: number;
}) {
  return (
    <OverviewCard title="Productivity" icon={FiActivity}>
      <ProductivityStats activity={activity} overdue={overdue} />

      <p className="text-muted small mb-2">Last 90 days</p>
      <ProductivityHeatmap activity={activity} />

      <p className="text-muted small mb-2 mt-4">Completed per week</p>
      <ProductivityTrendChart activity={activity} />
    </OverviewCard>
  );
}
