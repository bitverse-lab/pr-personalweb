import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type ServingUnit = "g" | "ml" | "piece" | "cup" | "tbsp" | "slice";
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "core"
  | "cardio"
  | "full_body";
export type Equipment = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "other";
export type ExerciseKind = "strength" | "bodyweight" | "cardio";
export type WorkoutStatus = "in_progress" | "completed";

const userRef = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

const num = (name: string, precision: number, scale: number) => numeric(name, { precision, scale, mode: "number" });

export const healthProfiles = pgTable("health_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef().unique(),
  heightCm: num("height_cm", 5, 1),
  sex: text("sex").$type<Sex | null>(),
  birthDate: date("birth_date", { mode: "string" }),
  activityLevel: text("activity_level").$type<ActivityLevel>().notNull().default("light"),
  goalType: text("goal_type").$type<GoalType>().notNull().default("maintain"),
  targetWeightKg: num("target_weight_kg", 5, 1),
  weeklyRateKg: num("weekly_rate_kg", 4, 2),
  dailyCalories: integer("daily_calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  waterMl: integer("water_ml"),
  weeklyWorkoutTarget: integer("weekly_workout_target"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weightEntries = pgTable(
  "weight_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    weightKg: num("weight_kg", 5, 1).notNull(),
    bodyFatPct: num("body_fat_pct", 4, 1),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("weight_entry_user_date_idx").on(t.userId, t.date)]
);

export const bodyMeasurements = pgTable(
  "body_measurement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    waistCm: num("waist_cm", 5, 1),
    chestCm: num("chest_cm", 5, 1),
    hipsCm: num("hips_cm", 5, 1),
    armCm: num("arm_cm", 5, 1),
    thighCm: num("thigh_cm", 5, 1),
    neckCm: num("neck_cm", 5, 1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("body_measurement_user_date_idx").on(t.userId, t.date)]
);

export const foods = pgTable(
  "food",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    name: text("name").notNull(),
    brand: text("brand"),
    servingSize: num("serving_size", 7, 2).notNull().default(100),
    servingUnit: text("serving_unit").$type<ServingUnit>().notNull().default("g"),
    calories: num("calories", 7, 1).notNull(),
    protein: num("protein", 6, 1).notNull().default(0),
    carbs: num("carbs", 6, 1).notNull().default(0),
    fat: num("fat", 6, 1).notNull().default(0),
    fiber: num("fiber", 6, 1).notNull().default(0),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("food_user_name_idx").on(t.userId, sql`lower(${t.name})`, sql`coalesce(${t.brand}, '')`)]
);

export const meals = pgTable(
  "meal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    mealType: text("meal_type").$type<MealType>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("meal_user_date_idx").on(t.userId, t.date)]
);

export const mealItems = pgTable("meal_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  servings: num("servings", 7, 2).notNull().default(1),
  servingLabel: text("serving_label"),
  calories: num("calories", 8, 1).notNull(),
  protein: num("protein", 7, 1).notNull().default(0),
  carbs: num("carbs", 7, 1).notNull().default(0),
  fat: num("fat", 7, 1).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const waterEntries = pgTable(
  "water_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    amountMl: integer("amount_ml").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("water_entry_user_date_idx").on(t.userId, t.date)]
);

export const exercises = pgTable(
  "exercise",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").$type<MuscleGroup>().notNull(),
    equipment: text("equipment").$type<Equipment>().notNull().default("other"),
    kind: text("kind").$type<ExerciseKind>().notNull().default("strength"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("exercise_user_name_idx").on(t.userId, sql`lower(${t.name})`)]
);

export const routines = pgTable("routine", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const routineExercises = pgTable("routine_exercise", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  routineId: uuid("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  targetSets: integer("target_sets").notNull().default(3),
  targetReps: integer("target_reps").notNull().default(10),
});

export const workouts = pgTable(
  "workout",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    name: text("name").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notes: text("notes"),
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    status: text("status").$type<WorkoutStatus>().notNull().default("in_progress"),
  },
  (t) => [index("workout_user_date_idx").on(t.userId, t.date)]
);

export const workoutSets = pgTable("workout_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  exerciseOrder: integer("exercise_order").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weightKg: num("weight_kg", 6, 2),
  durationSec: integer("duration_sec"),
  distanceKm: num("distance_km", 6, 2),
  isWarmup: boolean("is_warmup").notNull().default(false),
  done: boolean("done").notNull().default(false),
});
