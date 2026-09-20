import Link from "next/link";
import { FiTrendingUp } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import HealthStat from "@/components/me/health/HealthStat";
import WeightLogForm from "@/components/me/health/weight/WeightLogForm";
import WeightChart from "@/components/me/health/weight/WeightChart";
import WeightEntryList from "@/components/me/health/weight/WeightEntryList";
import AveragesTable from "@/components/me/health/weight/AveragesTable";
import { getWeightOverview } from "@/features/health/weight-actions";
import { fmtDelta } from "@/features/health/format";
import { todayInUserTz } from "@/lib/timezone";

const RANGES = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All" },
];

export default async function WeightPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const active = RANGES.some((r) => r.value === range) ? (range as string) : "90d";
  const [overview, today] = await Promise.all([getWeightOverview(active), todayInUserTz()]);
  const { latest, chart, weekly, monthly, entries, bmi, target } = overview;

  return (
    <>
      <div className="card rounded shadow-sm mb-4">
        <div className="card-body">
          <WeightLogForm today={today} lastWeight={latest?.weightKg ?? null} />
        </div>
      </div>

      <div className="row row-cols-2 row-cols-lg-4 g-2 mb-4">
        <HealthStat label="Current" value={latest ? `${latest.weightKg} kg` : "—"} hint={latest ? `logged ${latest.date}` : "no entries yet"} />
        <HealthStat label="7-day average" value={overview.sevenDayAverage ? `${overview.sevenDayAverage} kg` : "—"} hint={`this week vs last: ${fmtDelta(overview.weekDelta)}`} />
        <HealthStat label="BMI" value={bmi ? bmi.value : "—"} hint={bmi ? bmi.category : "set your height in Goals"} />
        <HealthStat
          label="Goal progress"
          value={target?.progress != null ? `${target.progress}%` : "—"}
          hint={target ? `target ${target.weightKg} kg` : "set a target in Goals"}
        />
      </div>

      {entries.length === 0 && chart.length === 0 ? (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <EmptyState
              icon={FiTrendingUp}
              title="No weight entries yet"
              description="Log your first weight above. Weekly and monthly averages appear automatically."
            />
          </div>
        </div>
      ) : (
        <>
          <div className="card rounded shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <h6 className="mb-0">Trend</h6>
                <div className="btn-group btn-group-sm" role="group" aria-label="Range">
                  {RANGES.map((r) => (
                    <Link
                      key={r.value}
                      href={`/me/health/weight?range=${r.value}`}
                      className={`btn ${active === r.value ? "btn-primary" : "btn-outline-primary"}`}
                      aria-current={active === r.value ? "true" : undefined}
                    >
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>
              {chart.length === 0 ? (
                <p className="text-muted small mb-0">No entries in this range.</p>
              ) : (
                <WeightChart data={chart} targetKg={target?.weightKg ?? null} />
              )}
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <AveragesTable title="Weekly averages" rows={weekly} limit={8} />
            </div>
            <div className="col-lg-6">
              <AveragesTable title="Monthly averages" rows={monthly} limit={12} />
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Entries</h6>
              {entries.length === 0 ? <p className="text-muted small mb-0">No entries in this range.</p> : <WeightEntryList entries={entries} />}
            </div>
          </div>
        </>
      )}
    </>
  );
}
