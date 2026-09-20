"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { nutritionRepository } from "@/server/repositories/nutrition-repository";
import { nutritionService, type DayView } from "@/server/services/nutrition-service";
import { todayInUserTz } from "@/lib/timezone";
import {
  addMealItemSchema,
  addWaterSchema,
  copyDaySchema,
  dateSchema,
  foodSchema,
  idSchema,
  updateFoodSchema,
  updateServingsSchema,
} from "./schema";
import type { ActionResult } from "@/types/action-result";
import type { ServingUnit } from "@/db/schema/health";

function revalidateNutrition() {
  revalidatePath("/me/health", "layout");
  revalidatePath("/me");
}

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

export interface FoodDto {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: ServingUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isFavorite: boolean;
}

const toFood = (f: FoodDto): FoodDto => ({
  id: f.id,
  name: f.name,
  brand: f.brand,
  servingSize: f.servingSize,
  servingUnit: f.servingUnit,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
  fiber: f.fiber,
  isFavorite: f.isFavorite,
});

// ---- queries ----

export async function getNutritionDay(date?: string): Promise<DayView> {
  const userId = await requireUserId();
  const parsed = dateSchema.safeParse(date);
  const day = parsed.success ? parsed.data : await todayInUserTz();
  await nutritionService.ensureSeeded(userId);
  return nutritionService.dayView(userId, day);
}

export async function getFoods(): Promise<{ foods: FoodDto[]; recent: FoodDto[] }> {
  const userId = await requireUserId();
  await nutritionService.ensureSeeded(userId);
  const [all, recent] = await Promise.all([nutritionRepository.listFoods(userId), nutritionRepository.recentFoods(userId)]);
  return { foods: all.map(toFood), recent: recent.map(toFood) };
}

// ---- foods ----

export async function createFood(input: unknown): Promise<ActionResult<FoodDto>> {
  const userId = await requireUserId();
  const parsed = foodSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const food = await nutritionRepository.createFood(userId, parsed.data);
    revalidateNutrition();
    return { ok: true, data: toFood(food) };
  } catch {
    return { ok: false, error: "A food with that name and brand already exists" };
  }
}

export async function updateFood(input: unknown): Promise<ActionResult<FoodDto>> {
  const userId = await requireUserId();
  const parsed = updateFoodSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const food = await nutritionRepository.updateFood(userId, parsed.data.id, parsed.data.data);
    if (!food) return { ok: false, error: "Food not found" };
    revalidateNutrition();
    return { ok: true, data: toFood(food) };
  } catch {
    return { ok: false, error: "A food with that name and brand already exists" };
  }
}

export async function deleteFood(id: string): Promise<ActionResult<FoodDto>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid food" };
  const food = await nutritionRepository.deleteFood(userId, parsed.data.id);
  if (!food) return { ok: false, error: "Food not found" };
  revalidateNutrition();
  return { ok: true, data: toFood(food) };
}

// ---- meal items ----

export async function addMealItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = addMealItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.calories === undefined && !parsed.data.foodId) return { ok: false, error: "Pick a food or enter calories" };
  const item = await nutritionService.addItem(userId, parsed.data);
  if (!item) return { ok: false, error: "Food not found" };
  revalidateNutrition();
  return { ok: true, data: { id: item.id } };
}

export async function updateMealItemServings(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateServingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const item = await nutritionService.updateServings(userId, parsed.data.id, parsed.data.servings);
  if (!item) return { ok: false, error: "Item not found" };
  revalidateNutrition();
  return { ok: true, data: { id: item.id } };
}

export async function deleteMealItem(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid item" };
  const item = await nutritionRepository.deleteItem(userId, parsed.data.id);
  if (!item) return { ok: false, error: "Item not found" };
  revalidateNutrition();
  return { ok: true, data: { id: item.id } };
}

export async function copyMealsFromDate(input: unknown): Promise<ActionResult<{ count: number }>> {
  const userId = await requireUserId();
  const parsed = copyDaySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.from === parsed.data.to) return { ok: false, error: "Pick a different day to copy from" };
  const count = await nutritionService.copyDay(userId, parsed.data.from, parsed.data.to);
  if (count === 0) return { ok: false, error: "Nothing logged on that day" };
  revalidateNutrition();
  return { ok: true, data: { count } };
}

// ---- water ----

export async function addWater(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = addWaterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await nutritionRepository.addWater(userId, parsed.data.date, parsed.data.amountMl);
  revalidateNutrition();
  return { ok: true, data: { id: row.id } };
}

export async function deleteWater(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid entry" };
  const row = await nutritionRepository.deleteWater(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Entry not found" };
  revalidateNutrition();
  return { ok: true, data: { id: row.id } };
}
