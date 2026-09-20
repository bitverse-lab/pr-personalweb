"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { addMealItem, deleteMealItem, updateMealItemServings, type FoodDto } from "@/features/health/nutrition-actions";
import { useToast } from "@/components/shared/ToastProvider";
import AddFoodDialog from "./AddFoodDialog";
import type { MealGroup, MealItemDto } from "@/server/services/nutrition-service";
import type { MealType } from "@/db/schema/health";

const MEAL_LABEL: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };

function ServingsInput({ item }: { item: MealItemDto }) {
  const [value, setValue] = useState(String(item.servings));
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const commit = () => {
    const n = Number(value);
    if (!n || n <= 0) return setValue(String(item.servings));
    if (n === item.servings) return;
    startTransition(async () => {
      const result = await updateMealItemServings({ id: item.id, servings: n });
      if (!result.ok) {
        toast.error(result.error);
        setValue(String(item.servings));
      }
    });
  };

  return (
    <input
      type="number"
      min="0.1"
      step="0.25"
      inputMode="decimal"
      className="form-control form-control-sm text-center"
      style={{ width: 70 }}
      aria-label={`Servings of ${item.name}`}
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

export default function NutritionBoard({
  date,
  meals,
  foods,
  recent,
}: {
  date: string;
  meals: MealGroup[];
  foods: FoodDto[];
  recent: FoodDto[];
}) {
  const [adding, setAdding] = useState<MealType | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const remove = (mealType: MealType, item: MealItemDto) => {
    startTransition(async () => {
      const result = await deleteMealItem(item.id);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Removed ${item.name}`, {
        action: {
          label: "Undo",
          onClick: () => {
            void addMealItem({
              date,
              mealType,
              foodId: item.foodId ?? undefined,
              servings: item.servings,
              name: item.name,
              servingLabel: item.servingLabel,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            }).then((r) => (r.ok ? toast.success("Restored") : toast.error(r.error)));
          },
        },
      });
    });
  };

  return (
    <>
      <div className="row g-3">
        {meals.map((meal) => (
          <div className="col-12 col-xl-6" key={meal.mealType}>
            <div className="card rounded shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 className="mb-0">{MEAL_LABEL[meal.mealType]}</h6>
                    <span className="text-muted small">
                      {meal.totals.calories} kcal · P {meal.totals.protein} · C {meal.totals.carbs} · F {meal.totals.fat}
                    </span>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onClick={() => setAdding(meal.mealType)}>
                    <FiPlus /> Add food
                  </button>
                </div>
                {meal.items.length === 0 ? (
                  <p className="text-muted small mb-0">Nothing logged.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {meal.items.map((item) => (
                      <li key={item.id} className="d-flex align-items-center gap-2 py-2 border-top">
                        <div className="flex-grow-1 min-w-0">
                          <div className="text-truncate">{item.name}</div>
                          <div className="text-muted small">
                            {Math.round(item.calories)} kcal · P {item.protein} · C {item.carbs} · F {item.fat}
                          </div>
                        </div>
                        <ServingsInput key={`${item.id}:${item.servings}`} item={item} />
                        <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Remove ${item.name}`} disabled={isPending} onClick={() => remove(meal.mealType, item)}>
                          <FiTrash2 />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {adding && <AddFoodDialog date={date} mealType={adding} foods={foods} recent={recent} onClose={() => setAdding(null)} />}
    </>
  );
}
