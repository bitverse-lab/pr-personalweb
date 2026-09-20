"use client";

import { useMemo, useState, useTransition } from "react";
import { saveHealthProfile } from "@/features/health/profile-actions";
import { ACTIVITY_LABEL, ageFromBirthDate, calcBmr, calcTdee, suggestTargets } from "@/features/health/calc";
import { useToast } from "@/components/shared/ToastProvider";
import type { ActivityLevel, GoalType, Sex } from "@/db/schema/health";

export interface GoalsInitial {
  heightCm: number | null;
  sex: Sex | null;
  birthDate: string | null;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeightKg: number | null;
  weeklyRateKg: number | null;
  dailyCalories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  waterMl: number | null;
  weeklyWorkoutTarget: number | null;
}

const s = (n: number | null) => (n === null ? "" : String(n));

export default function GoalsForm({ initial, currentWeightKg, today }: { initial: GoalsInitial; currentWeightKg: number | null; today: string }) {
  const [f, setF] = useState({
    heightCm: s(initial.heightCm),
    sex: initial.sex ?? "",
    birthDate: initial.birthDate ?? "",
    activityLevel: initial.activityLevel,
    goalType: initial.goalType,
    targetWeightKg: s(initial.targetWeightKg),
    weeklyRateKg: s(initial.weeklyRateKg ?? (initial.goalType === "maintain" ? null : 0.5)),
    dailyCalories: s(initial.dailyCalories),
    proteinG: s(initial.proteinG),
    carbsG: s(initial.carbsG),
    fatG: s(initial.fatG),
    waterMl: s(initial.waterMl ?? 2500),
    weeklyWorkoutTarget: s(initial.weeklyWorkoutTarget ?? 3),
  });
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((cur) => ({ ...cur, [key]: e.target.value }));

  const estimate = useMemo(() => {
    const height = Number(f.heightCm);
    if (!currentWeightKg || !height || !f.sex || !f.birthDate) return null;
    const bmr = calcBmr(f.sex as Sex, currentWeightKg, height, ageFromBirthDate(f.birthDate, today));
    const tdee = calcTdee(bmr, f.activityLevel);
    return { bmr, tdee, targets: suggestTargets(tdee, currentWeightKg, f.goalType, f.weeklyRateKg ? Number(f.weeklyRateKg) : null) };
  }, [f.heightCm, f.sex, f.birthDate, f.activityLevel, f.goalType, f.weeklyRateKg, currentWeightKg, today]);

  const applySuggestion = () => {
    if (!estimate) return;
    const t = estimate.targets;
    setF((cur) => ({ ...cur, dailyCalories: String(t.calories), proteinG: String(t.proteinG), carbsG: String(t.carbsG), fatG: String(t.fatG) }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveHealthProfile(f);
      if (!result.ok) toast.error(result.error);
      else toast.success("Goals saved");
    });
  };

  const field = (label: string, key: keyof typeof f, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="col-6 col-md-4">
      <label className="form-label small mb-1" htmlFor={`g-${key}`}>{label}</label>
      <input id={`g-${key}`} className="form-control" value={f[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit}>
      <div className="card rounded shadow-sm mb-4">
        <div className="card-body">
          <h6 className="mb-3">About you</h6>
          <div className="row g-3">
            {field("Height (cm)", "heightCm", { type: "number", step: "0.1", min: 80, max: 260 })}
            <div className="col-6 col-md-4">
              <label className="form-label small mb-1" htmlFor="g-sex">Sex (for calorie formula)</label>
              <select id="g-sex" className="form-select" value={f.sex} onChange={set("sex")}>
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            {field("Birth date", "birthDate", { type: "date", max: today })}
            <div className="col-12 col-md-8">
              <label className="form-label small mb-1" htmlFor="g-activity">Activity level</label>
              <select id="g-activity" className="form-select" value={f.activityLevel} onChange={set("activityLevel")}>
                {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => (
                  <option key={k} value={k}>{ACTIVITY_LABEL[k]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card rounded shadow-sm mb-4">
        <div className="card-body">
          <h6 className="mb-3">Weight goal</h6>
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <label className="form-label small mb-1" htmlFor="g-goal">Goal</label>
              <select id="g-goal" className="form-select" value={f.goalType} onChange={set("goalType")}>
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain weight</option>
              </select>
            </div>
            {field("Target weight (kg)", "targetWeightKg", { type: "number", step: "0.1", min: 20, max: 400 })}
            {f.goalType !== "maintain" && field("Rate (kg / week)", "weeklyRateKg", { type: "number", step: "0.05", min: 0, max: 2 })}
          </div>
        </div>
      </div>

      <div className="card rounded shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
            <h6 className="mb-0">Daily targets</h6>
            {estimate && (
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={applySuggestion}>
                Apply suggestion
              </button>
            )}
          </div>
          {estimate ? (
            <p className="small text-muted">
              Based on {currentWeightKg} kg: BMR <strong>{estimate.bmr}</strong> kcal, maintenance (TDEE) <strong>{estimate.tdee}</strong> kcal. Suggested:{" "}
              <strong>{estimate.targets.calories} kcal</strong> · {estimate.targets.proteinG} g protein · {estimate.targets.carbsG} g carbs · {estimate.targets.fatG} g fat.
            </p>
          ) : (
            <p className="small text-muted">Log your weight and fill height, sex and birth date to get a calorie suggestion.</p>
          )}
          <div className="row g-3">
            {field("Calories (kcal)", "dailyCalories", { type: "number", min: 800, max: 10000 })}
            {field("Protein (g)", "proteinG", { type: "number", min: 0 })}
            {field("Carbs (g)", "carbsG", { type: "number", min: 0 })}
            {field("Fat (g)", "fatG", { type: "number", min: 0 })}
            {field("Water (ml)", "waterMl", { type: "number", step: 50, min: 500 })}
            {field("Workouts / week", "weeklyWorkoutTarget", { type: "number", min: 0, max: 14 })}
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Saving…" : "Save goals"}
      </button>
    </form>
  );
}
