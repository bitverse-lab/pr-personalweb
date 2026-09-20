import GoalsForm, { type GoalsInitial } from "@/components/me/health/goals/GoalsForm";
import { getHealthProfile } from "@/features/health/profile-actions";
import { getWeightOverview } from "@/features/health/weight-actions";
import { todayInUserTz } from "@/lib/timezone";

export default async function GoalsPage() {
  const [profile, weight, today] = await Promise.all([getHealthProfile(), getWeightOverview("30d"), todayInUserTz()]);

  const initial: GoalsInitial = {
    heightCm: profile?.heightCm ?? null,
    sex: profile?.sex ?? null,
    birthDate: profile?.birthDate ?? null,
    activityLevel: profile?.activityLevel ?? "light",
    goalType: profile?.goalType ?? "maintain",
    targetWeightKg: profile?.targetWeightKg ?? null,
    weeklyRateKg: profile?.weeklyRateKg ?? null,
    dailyCalories: profile?.dailyCalories ?? null,
    proteinG: profile?.proteinG ?? null,
    carbsG: profile?.carbsG ?? null,
    fatG: profile?.fatG ?? null,
    waterMl: profile?.waterMl ?? null,
    weeklyWorkoutTarget: profile?.weeklyWorkoutTarget ?? null,
  };

  return <GoalsForm initial={initial} currentWeightKg={weight.latest?.weightKg ?? null} today={today} />;
}
