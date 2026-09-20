import { db } from "@/db";
import { nutritionRepository, type MealItemValues } from "@/server/repositories/nutrition-repository";
import { healthProfileRepository } from "@/server/repositories/health-profile-repository";
import { addDays, round1, sumMacros, type Macros } from "@/features/health/calc";
import { STARTER_FOODS } from "./seed-foods";
import type { MealType } from "@/db/schema/health";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export interface MealItemDto extends Macros {
  id: string;
  foodId: string | null;
  name: string;
  servings: number;
  servingLabel: string | null;
}

export interface MealGroup {
  mealType: MealType;
  items: MealItemDto[];
  totals: Macros;
}

export interface DayView {
  date: string;
  meals: MealGroup[];
  totals: Macros;
  waterMl: number;
  waterEntries: { id: string; amountMl: number }[];
  targets: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null; waterMl: number | null };
  history: { date: string; calories: number }[]; // last 14 days ending at `date`
}

export interface AddItemInput {
  date: string;
  mealType: MealType;
  foodId?: string;
  servings: number;
  name?: string;
  servingLabel?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

const scale = (n: number, factor: number) => round1(n * factor);

export const nutritionService = {
  // Seeds the starter catalog once (only while the user has no foods at all).
  async ensureSeeded(userId: string) {
    if ((await nutritionRepository.countFoods(userId)) > 0) return;
    await nutritionRepository.insertFoodsIgnoreDuplicates(
      userId,
      STARTER_FOODS.map((f) => ({
        name: f.name,
        servingSize: f.size,
        servingUnit: f.unit,
        calories: f.cal,
        protein: f.p,
        carbs: f.c,
        fat: f.f,
        fiber: f.fiber ?? 0,
      }))
    );
  },

  async addItem(userId: string, input: AddItemInput) {
    return db.transaction(async (tx) => {
      let values: MealItemValues;
      if (input.calories !== undefined) {
        // explicit snapshot: quick add, or undo of a deleted item
        values = {
          foodId: input.foodId ?? null,
          name: input.name ?? "Quick add",
          servings: input.servings,
          servingLabel: input.servingLabel ?? null,
          calories: input.calories,
          protein: input.protein ?? 0,
          carbs: input.carbs ?? 0,
          fat: input.fat ?? 0,
        };
      } else {
        const food = input.foodId ? await nutritionRepository.findFood(userId, input.foodId, tx) : null;
        if (!food) return null;
        values = {
          foodId: food.id,
          name: food.brand ? `${food.name} (${food.brand})` : food.name,
          servings: input.servings,
          servingLabel: `${food.servingSize} ${food.servingUnit}`,
          calories: scale(food.calories, input.servings),
          protein: scale(food.protein, input.servings),
          carbs: scale(food.carbs, input.servings),
          fat: scale(food.fat, input.servings),
        };
      }
      const meal = await nutritionRepository.findOrCreateMeal(userId, input.date, input.mealType, tx);
      return nutritionRepository.insertItem(userId, meal.id, values, tx);
    });
  },

  async updateServings(userId: string, id: string, servings: number) {
    const found = await nutritionRepository.findItem(userId, id);
    if (!found || found.item.servings <= 0) return null;
    const factor = servings / found.item.servings;
    return nutritionRepository.updateItem(userId, id, {
      servings,
      calories: scale(found.item.calories, factor),
      protein: scale(found.item.protein, factor),
      carbs: scale(found.item.carbs, factor),
      fat: scale(found.item.fat, factor),
    });
  },

  // Appends every item of `from` to the same meal types on `to`, atomically.
  async copyDay(userId: string, from: string, to: string) {
    const rows = await nutritionRepository.itemsForRange(userId, from, from);
    if (rows.length === 0) return 0;
    await db.transaction(async (tx) => {
      for (const { item, mealType } of rows) {
        const meal = await nutritionRepository.findOrCreateMeal(userId, to, mealType, tx);
        await nutritionRepository.insertItem(
          userId,
          meal.id,
          {
            foodId: item.foodId,
            name: item.name,
            servings: item.servings,
            servingLabel: item.servingLabel,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          },
          tx
        );
      }
    });
    return rows.length;
  },

  async dayView(userId: string, date: string): Promise<DayView> {
    const from = addDays(date, -13);
    const [rows, water, profile] = await Promise.all([
      nutritionRepository.itemsForRange(userId, from, date),
      nutritionRepository.waterForRange(userId, date, date),
      healthProfileRepository.find(userId),
    ]);

    const perDay = new Map<string, number>();
    for (const r of rows) perDay.set(r.date, (perDay.get(r.date) ?? 0) + r.item.calories);
    const history = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(from, i);
      return { date: d, calories: Math.round(perDay.get(d) ?? 0) };
    });

    const today = rows.filter((r) => r.date === date);
    const meals: MealGroup[] = MEAL_TYPES.map((mealType) => {
      const items = today
        .filter((r) => r.mealType === mealType)
        .map(({ item }) => ({
          id: item.id,
          foodId: item.foodId,
          name: item.name,
          servings: item.servings,
          servingLabel: item.servingLabel,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        }));
      return { mealType, items, totals: sumMacros(items) };
    });

    return {
      date,
      meals,
      totals: sumMacros(meals.flatMap((m) => m.items)),
      waterMl: water.reduce((s, w) => s + w.amountMl, 0),
      waterEntries: water.map((w) => ({ id: w.id, amountMl: w.amountMl })),
      targets: {
        calories: profile?.dailyCalories ?? null,
        protein: profile?.proteinG ?? null,
        carbs: profile?.carbsG ?? null,
        fat: profile?.fatG ?? null,
        waterMl: profile?.waterMl ?? null,
      },
      history,
    };
  },
};
