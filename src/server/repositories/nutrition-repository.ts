import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { foods, mealItems, meals, waterEntries } from "@/db/schema";
import type { MealType, ServingUnit } from "@/db/schema/health";

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface FoodInput {
  name: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: ServingUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealItemValues {
  foodId: string | null;
  name: string;
  servings: number;
  servingLabel: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const nutritionRepository = {
  // ---- foods ----
  listFoods(userId: string, q?: string) {
    return db
      .select()
      .from(foods)
      .where(and(eq(foods.userId, userId), q ? ilike(foods.name, `%${q.replace(/[%_]/g, "")}%`) : undefined))
      .orderBy(desc(foods.isFavorite), asc(foods.name));
  },

  findFood(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.foods.findFirst({ where: and(eq(foods.id, id), eq(foods.userId, userId)) });
  },

  createFood(userId: string, input: FoodInput) {
    return db
      .insert(foods)
      .values({ userId, ...input, brand: input.brand || null })
      .returning()
      .then((r) => r[0]);
  },

  insertFoodsIgnoreDuplicates(userId: string, rows: FoodInput[]) {
    if (rows.length === 0) return Promise.resolve();
    return db
      .insert(foods)
      .values(rows.map((r) => ({ userId, ...r })))
      .onConflictDoNothing()
      .then(() => undefined);
  },

  countFoods(userId: string) {
    return db
      .select({ n: sql<number>`count(*)::int` })
      .from(foods)
      .where(eq(foods.userId, userId))
      .then((r) => r[0]?.n ?? 0);
  },

  updateFood(userId: string, id: string, input: Partial<FoodInput> & { isFavorite?: boolean }) {
    return db
      .update(foods)
      .set({ ...input, brand: input.brand === undefined ? undefined : input.brand || null })
      .where(and(eq(foods.id, id), eq(foods.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteFood(userId: string, id: string) {
    return db
      .delete(foods)
      .where(and(eq(foods.id, id), eq(foods.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // Distinct foods used most recently in meals.
  recentFoods(userId: string, limit = 8) {
    return db
      .select({ food: foods, last: sql<string>`max(${mealItems.createdAt})` })
      .from(mealItems)
      .innerJoin(foods, eq(foods.id, mealItems.foodId))
      .where(eq(mealItems.userId, userId))
      .groupBy(foods.id)
      .orderBy(desc(sql`max(${mealItems.createdAt})`))
      .limit(limit)
      .then((rows) => rows.map((r) => r.food));
  },

  // ---- meals ----
  async findOrCreateMeal(userId: string, date: string, mealType: MealType, ex: DbExecutor = db) {
    const existing = await ex.query.meals.findFirst({
      where: and(eq(meals.userId, userId), eq(meals.date, date), eq(meals.mealType, mealType)),
    });
    if (existing) return existing;
    const rows = await ex.insert(meals).values({ userId, date, mealType }).returning();
    return rows[0];
  },

  insertItem(userId: string, mealId: string, values: MealItemValues, ex: DbExecutor = db) {
    return ex
      .insert(mealItems)
      .values({ userId, mealId, ...values })
      .returning()
      .then((r) => r[0]);
  },

  itemsForRange(userId: string, from: string, to: string) {
    return db
      .select({ item: mealItems, date: meals.date, mealType: meals.mealType })
      .from(mealItems)
      .innerJoin(meals, eq(meals.id, mealItems.mealId))
      .where(and(eq(mealItems.userId, userId), gte(meals.date, from), lte(meals.date, to)))
      .orderBy(asc(meals.date), asc(mealItems.createdAt));
  },

  findItem(userId: string, id: string) {
    return db
      .select({ item: mealItems, date: meals.date, mealType: meals.mealType })
      .from(mealItems)
      .innerJoin(meals, eq(meals.id, mealItems.mealId))
      .where(and(eq(mealItems.id, id), eq(mealItems.userId, userId)))
      .then((r) => r[0] ?? null);
  },

  updateItem(userId: string, id: string, values: Partial<MealItemValues>) {
    return db
      .update(mealItems)
      .set(values)
      .where(and(eq(mealItems.id, id), eq(mealItems.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // Removes the item, and its meal too when it was the last item.
  async deleteItem(userId: string, id: string) {
    return db.transaction(async (tx) => {
      const rows = await tx
        .delete(mealItems)
        .where(and(eq(mealItems.id, id), eq(mealItems.userId, userId)))
        .returning();
      const item = rows[0];
      if (!item) return null;
      const left = await tx.select({ id: mealItems.id }).from(mealItems).where(eq(mealItems.mealId, item.mealId)).limit(1);
      if (left.length === 0) await tx.delete(meals).where(and(eq(meals.id, item.mealId), eq(meals.userId, userId)));
      return item;
    });
  },

  deleteMealItemsByIds(userId: string, ids: string[]) {
    if (ids.length === 0) return Promise.resolve();
    return db.delete(mealItems).where(and(eq(mealItems.userId, userId), inArray(mealItems.id, ids))).then(() => undefined);
  },

  // ---- water ----
  waterForRange(userId: string, from: string, to: string) {
    return db
      .select()
      .from(waterEntries)
      .where(and(eq(waterEntries.userId, userId), gte(waterEntries.date, from), lte(waterEntries.date, to)))
      .orderBy(asc(waterEntries.createdAt));
  },

  addWater(userId: string, date: string, amountMl: number) {
    return db
      .insert(waterEntries)
      .values({ userId, date, amountMl })
      .returning()
      .then((r) => r[0]);
  },

  deleteWater(userId: string, id: string) {
    return db
      .delete(waterEntries)
      .where(and(eq(waterEntries.id, id), eq(waterEntries.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  latestWaterEntry(userId: string, date: string) {
    return db.query.waterEntries.findFirst({
      where: and(eq(waterEntries.userId, userId), eq(waterEntries.date, date)),
      orderBy: [desc(waterEntries.createdAt)],
    });
  },
};
