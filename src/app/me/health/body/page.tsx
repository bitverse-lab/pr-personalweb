import BodyPanel from "@/components/me/health/body/BodyPanel";
import { getMeasurements } from "@/features/health/weight-actions";
import { todayInUserTz } from "@/lib/timezone";

export default async function BodyPage() {
  const [rows, today] = await Promise.all([getMeasurements(), todayInUserTz()]);
  return (
    <BodyPanel
      today={today}
      rows={rows.map((r) => ({
        id: r.id,
        date: r.date,
        waistCm: r.waistCm,
        chestCm: r.chestCm,
        hipsCm: r.hipsCm,
        armCm: r.armCm,
        thighCm: r.thighCm,
        neckCm: r.neckCm,
      }))}
    />
  );
}
