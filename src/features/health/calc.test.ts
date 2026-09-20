import { describe, expect, it } from "vitest";
import {
  addDays,
  ageFromBirthDate,
  beatsPrior,
  bmiCategory,
  calcBmi,
  calcBmr,
  calcTdee,
  currentStreak,
  daysBetween,
  estimate1RM,
  goalProgress,
  monthlyAverages,
  movingAverage,
  personalRecords,
  suggestTargets,
  sumMacros,
  totalVolume,
  weekStart,
  weeklyAverages,
} from "./calc";

describe("date helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // leap year
  });

  it("finds the Monday of a week (weeks run Mon–Sun)", () => {
    expect(weekStart("2026-09-07")).toBe("2026-09-07"); // Monday
    expect(weekStart("2026-09-06")).toBe("2026-08-31"); // Sunday belongs to the previous week
    expect(weekStart("2026-09-10")).toBe("2026-09-07");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-09-01", "2026-09-10")).toBe(9);
  });
});

describe("weight averages", () => {
  const points = [
    { date: "2026-08-31", weightKg: 80 },
    { date: "2026-09-02", weightKg: 79 },
    { date: "2026-09-06", weightKg: 78 },
    { date: "2026-09-07", weightKg: 77.5 },
    { date: "2026-09-09", weightKg: 77 },
  ];

  it("averages by calendar week, newest first, with change vs the previous week", () => {
    const weeks = weeklyAverages(points);
    expect(weeks.map((w) => w.average)).toEqual([77.3, 79]);
    expect(weeks[0].entries).toBe(2);
    expect(weeks[0].delta).toBe(-1.7);
    expect(weeks[1].delta).toBeNull(); // nothing older to compare with
  });

  it("averages by month", () => {
    const months = monthlyAverages(points);
    expect(months.map((m) => [m.key, m.average])).toEqual([
      ["2026-09", 77.9],
      ["2026-08", 80],
    ]);
  });

  it("computes a trailing 7-day moving average", () => {
    const ma = movingAverage(points, 7);
    expect(ma.get("2026-09-07")).toBe(78.2); // Sep 1–7: 79, 78, 77.5
    expect(ma.get("2026-08-31")).toBe(80);
  });

  it("clamps goal progress between 0 and 100", () => {
    expect(goalProgress(80, 77, 70)).toBe(30);
    expect(goalProgress(80, 85, 70)).toBe(0); // moved the wrong way
    expect(goalProgress(80, 60, 70)).toBe(100); // overshot
    expect(goalProgress(70, 70, 70)).toBeNull();
  });
});

describe("body calculations", () => {
  it("computes BMI and its category", () => {
    expect(calcBmi(70, 175)).toBe(22.9);
    expect(bmiCategory(17)).toBe("Underweight");
    expect(bmiCategory(22.9)).toBe("Healthy");
    expect(bmiCategory(27)).toBe("Overweight");
    expect(bmiCategory(31)).toBe("Obese");
  });

  it("computes age from a birth date", () => {
    expect(ageFromBirthDate("1996-09-20", "2026-09-19")).toBe(29);
    expect(ageFromBirthDate("1996-09-20", "2026-09-20")).toBe(30);
  });

  it("uses Mifflin–St Jeor and activity factors", () => {
    expect(calcBmr("male", 80, 175, 30)).toBe(1749);
    expect(calcBmr("female", 60, 165, 30)).toBe(1320);
    expect(calcTdee(1749, "moderate")).toBe(2711);
  });

  it("suggests calories from goal and rate, never below 1200", () => {
    const lose = suggestTargets(2711, 80, "lose", 0.5);
    expect(lose.calories).toBe(2161);
    expect(lose.proteinG).toBe(144);
    const gain = suggestTargets(2711, 80, "gain", 0.5);
    expect(gain.calories).toBe(3261);
    expect(suggestTargets(1300, 50, "lose", 1).calories).toBe(1200);
    expect(suggestTargets(2400, 70, "maintain", null).calories).toBe(2400);
  });
});

describe("workout maths", () => {
  it("estimates 1RM with the Epley formula", () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(60, 8)).toBe(76);
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(60, 0)).toBe(0);
  });

  it("counts volume only for completed working sets", () => {
    expect(
      totalVolume([
        { reps: 8, weightKg: 60, isWarmup: false, done: true },
        { reps: 8, weightKg: 60, isWarmup: true, done: true }, // warm-up ignored
        { reps: 5, weightKg: 70, isWarmup: false, done: false }, // not done ignored
        { reps: 10, weightKg: null, isWarmup: false, done: true }, // no weight
      ])
    ).toBe(480);
  });

  it("tracks personal records per exercise", () => {
    const pr = personalRecords([
      { exerciseId: "bench", reps: 8, weightKg: 60, date: "2026-09-01" },
      { exerciseId: "bench", reps: 5, weightKg: 70, date: "2026-09-08" },
      { exerciseId: "bench", reps: 0, weightKg: 100, date: "2026-09-09" }, // ignored
      { exerciseId: "squat", reps: 5, weightKg: 100, date: "2026-09-08" },
    ]).get("bench")!;
    expect(pr.maxWeight).toMatchObject({ weightKg: 70, reps: 5 });
    expect(pr.bestE1rm?.value).toBe(81.7);
    expect(pr.bestVolume?.volume).toBe(480);
  });

  it("only flags a PR when there is history to beat", () => {
    expect(beatsPrior(70, 5, null)).toBe(false);
    expect(beatsPrior(70, 5, { maxWeight: 60, bestE1rm: 76 })).toBe(true);
    expect(beatsPrior(60, 8, { maxWeight: 60, bestE1rm: 76 })).toBe(false); // equal is not a record
    expect(beatsPrior(50, 15, { maxWeight: 60, bestE1rm: 76 })).toBe(false);
    expect(beatsPrior(null, 5, { maxWeight: 60, bestE1rm: 76 })).toBe(false);
  });

  it("computes the current streak, allowing today to be empty", () => {
    expect(currentStreak(["2026-09-17", "2026-09-18", "2026-09-19"], "2026-09-19")).toBe(3);
    expect(currentStreak(["2026-09-17", "2026-09-18"], "2026-09-19")).toBe(2); // not yet today
    expect(currentStreak(["2026-09-15"], "2026-09-19")).toBe(0);
    expect(currentStreak([], "2026-09-19")).toBe(0);
  });
});

describe("nutrition", () => {
  it("sums macros with sensible rounding", () => {
    expect(
      sumMacros([
        { calories: 100.4, protein: 5.25, carbs: 10, fat: 1.1 },
        { calories: 200.4, protein: 4.05, carbs: 20.3, fat: 2.2 },
      ])
    ).toEqual({ calories: 301, protein: 9.3, carbs: 30.3, fat: 3.3 });
    expect(sumMacros([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
