import { z } from "zod";

const optionalNum = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.coerce.number().min(min).max(max).optional()
  );

export const dateSchema = z.iso.date();

export const logWeightSchema = z.object({
  date: dateSchema,
  weightKg: z.coerce.number().min(20, "Weight must be at least 20 kg").max(400, "Weight must be under 400 kg"),
  bodyFatPct: optionalNum(2, 70),
  note: z.string().trim().max(300).optional(),
});

export const weightIdSchema = z.object({ id: z.uuid() });
export const restoreWeightSchema = logWeightSchema;

export const weightRangeSchema = z.enum(["30d", "90d", "1y", "all"]).default("90d");
export type WeightRange = z.infer<typeof weightRangeSchema>;

export const logMeasurementSchema = z
  .object({
    date: dateSchema,
    waistCm: optionalNum(10, 300),
    chestCm: optionalNum(10, 300),
    hipsCm: optionalNum(10, 300),
    armCm: optionalNum(5, 100),
    thighCm: optionalNum(10, 150),
    neckCm: optionalNum(10, 100),
  })
  .refine(
    (v) => [v.waistCm, v.chestCm, v.hipsCm, v.armCm, v.thighCm, v.neckCm].some((x) => x !== undefined),
    { message: "Enter at least one measurement" }
  );

// ---- nutrition ----

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const macro = (max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? 0 : v), z.coerce.number().min(0).max(max));

export const foodSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().max(80).nullish(),
  servingSize: z.coerce.number().gt(0, "Serving size must be above 0").max(10000),
  servingUnit: z.enum(["g", "ml", "piece", "cup", "tbsp", "slice"]),
  calories: z.coerce.number().min(0).max(5000),
  protein: macro(500),
  carbs: macro(1000),
  fat: macro(500),
  fiber: macro(200),
});

export const updateFoodSchema = z.object({ id: z.uuid(), data: foodSchema.partial().extend({ isFavorite: z.boolean().optional() }) });

export const addMealItemSchema = z.object({
  date: dateSchema,
  mealType: mealTypeSchema,
  foodId: z.uuid().optional(),
  servings: z.coerce.number().gt(0, "Servings must be above 0").max(100),
  name: z.string().trim().min(1).max(160).optional(),
  servingLabel: z.string().max(60).nullish(),
  calories: z.coerce.number().min(0).max(20000).optional(),
  protein: z.coerce.number().min(0).max(2000).optional(),
  carbs: z.coerce.number().min(0).max(4000).optional(),
  fat: z.coerce.number().min(0).max(2000).optional(),
});

export const updateServingsSchema = z.object({ id: z.uuid(), servings: z.coerce.number().gt(0).max(100) });
export const copyDaySchema = z.object({ from: dateSchema, to: dateSchema });
export const addWaterSchema = z.object({ date: dateSchema, amountMl: z.coerce.number().int().min(1).max(5000) });
export const idSchema = z.object({ id: z.uuid() });

export const saveProfileSchema = z.object({
  heightCm: optionalNum(80, 260),
  sex: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["male", "female"]).optional()),
  birthDate: z.preprocess((v) => (v === "" ? undefined : v), dateSchema.optional()),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goalType: z.enum(["lose", "maintain", "gain"]),
  targetWeightKg: optionalNum(20, 400),
  weeklyRateKg: optionalNum(0, 2),
  dailyCalories: optionalNum(800, 10000),
  proteinG: optionalNum(0, 600),
  carbsG: optionalNum(0, 1200),
  fatG: optionalNum(0, 400),
  waterMl: optionalNum(500, 10000),
  weeklyWorkoutTarget: optionalNum(0, 14),
});

// ---- workouts ----

const nullableNum = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? null : v),
    z.coerce.number().min(0).max(max).nullable()
  );

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  muscleGroup: z.enum(["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "cardio", "full_body"]),
  equipment: z.enum(["barbell", "dumbbell", "machine", "cable", "bodyweight", "other"]),
  kind: z.enum(["strength", "bodyweight", "cardio"]),
});
export const updateExerciseSchema = z.object({ id: z.uuid(), data: exerciseSchema.partial() });

export const startWorkoutSchema = z.object({ name: z.string().trim().max(80).optional(), routineId: z.uuid().optional() });
export const workoutExerciseSchema = z.object({ workoutId: z.uuid(), exerciseId: z.uuid() });
export const updateSetSchema = z.object({
  id: z.uuid(),
  reps: nullableNum(1000).optional(),
  weightKg: nullableNum(1500).optional(),
  durationSec: nullableNum(86400).optional(),
  distanceKm: nullableNum(1000).optional(),
  isWarmup: z.boolean().optional(),
  done: z.boolean().optional(),
});
export const updateWorkoutSchema = z.object({ id: z.uuid(), name: z.string().trim().min(1).max(80).optional(), notes: z.string().max(2000).nullish() });
export const finishWorkoutSchema = z.object({ id: z.uuid(), notes: z.string().max(2000).nullish() });

const snapshotSet = z.object({
  exerciseId: z.uuid(),
  exerciseOrder: z.number().int().min(0),
  setNumber: z.number().int().min(1),
  reps: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  durationSec: z.number().int().nullable(),
  distanceKm: z.number().nullable(),
  isWarmup: z.boolean(),
  done: z.boolean(),
});
export const restoreWorkoutSchema = z.object({
  date: dateSchema,
  name: z.string().min(1).max(80),
  notes: z.string().nullable(),
  routineId: z.uuid().nullable(),
  status: z.enum(["in_progress", "completed"]),
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: z.iso.datetime({ offset: true }).nullable(),
  sets: z.array(snapshotSet).max(500),
});

export const saveRoutineSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Give the routine a name").max(80),
  notes: z.string().trim().max(500).nullish(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.uuid(),
        targetSets: z.coerce.number().int().min(1).max(20),
        targetReps: z.coerce.number().int().min(1).max(200),
      })
    )
    .min(1, "Add at least one exercise")
    .max(30),
});
