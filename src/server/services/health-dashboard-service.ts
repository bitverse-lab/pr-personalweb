import { healthProfileRepository } from "@/server/repositories/health-profile-repository";
import { nutritionService, type DayView } from "./nutrition-service";
import { weightService, type WeightOverview } from "./weight-service";
import { workoutService, type WorkoutsOverview } from "./workout-service";

export interface HealthDashboard {
  today: string;
  hasGoals: boolean;
  day: DayView;
  weight: WeightOverview;
  workouts: Pick<WorkoutsOverview, "active" | "week" | "streak" | "records">;
  weekly: { weekStart: string; count: number; volumeKg: number }[];
}

export const healthDashboardService = {
  async build(userId: string, today: string): Promise<HealthDashboard> {
    await Promise.all([nutritionService.ensureSeeded(userId), workoutService.ensureSeeded(userId)]);
    const [profile, day, weight, overview, weekly] = await Promise.all([
      healthProfileRepository.find(userId),
      nutritionService.dayView(userId, today),
      weightService.overview(userId, "30d", today),
      workoutService.overview(userId, today),
      workoutService.weeklyTrend(userId, today, 8),
    ]);
    return {
      today,
      hasGoals: !!profile && (profile.dailyCalories !== null || profile.targetWeightKg !== null),
      day,
      weight,
      workouts: { active: overview.active, week: overview.week, streak: overview.streak, records: overview.records },
      weekly,
    };
  },
};
