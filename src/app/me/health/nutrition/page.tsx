import DayHeader from "@/components/me/health/nutrition/DayHeader";
import DaySummary from "@/components/me/health/nutrition/DaySummary";
import NutritionBoard from "@/components/me/health/nutrition/NutritionBoard";
import WaterTracker from "@/components/me/health/nutrition/WaterTracker";
import CalorieHistoryChart from "@/components/me/health/nutrition/CalorieHistoryChart";
import FoodLibrary from "@/components/me/health/nutrition/FoodLibrary";
import { getFoods, getNutritionDay } from "@/features/health/nutrition-actions";
import { todayInUserTz } from "@/lib/timezone";

export default async function NutritionPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const today = await todayInUserTz();
  const [day, { foods, recent }] = await Promise.all([getNutritionDay(date ?? today), getFoods()]);
  const isEmpty = day.meals.every((m) => m.items.length === 0);

  return (
    <>
      <DayHeader date={day.date} today={today} isEmpty={isEmpty} />
      <div className="row g-3">
        <div className="col-lg-8">
          <DaySummary day={day} />
          <NutritionBoard key={`${day.date}:${day.meals.map((m) => m.items.map((i) => i.id).join()).join("|")}`} date={day.date} meals={day.meals} foods={foods} recent={recent} />
        </div>
        <div className="col-lg-4">
          <WaterTracker date={day.date} totalMl={day.waterMl} targetMl={day.targets.waterMl} entries={day.waterEntries} />
          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-2">Last 14 days</h6>
              <CalorieHistoryChart data={day.history} target={day.targets.calories} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <FoodLibrary foods={foods} />
      </div>
    </>
  );
}
