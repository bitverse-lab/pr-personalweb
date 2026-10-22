"use client";

import { useMemo, useState, useTransition } from "react";
import { FiStar } from "react-icons/fi";
import { addMealItem, type FoodDto } from "@/features/health/nutrition-actions";
import { round1 } from "@/features/health/calc";
import { useToast } from "@/components/shared/ToastProvider";
import type { MealType } from "@/db/schema/health";
import DialogShell from "@/components/shared/DialogShell";

const MEAL_LABEL: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

type Tab = "library" | "recent" | "quick";

export default function AddFoodDialog({
  date,
  mealType,
  foods,
  recent,
  onClose,
}: {
  date: string;
  mealType: MealType;
  foods: FoodDto[];
  recent: FoodDto[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodDto | null>(null);
  const [servings, setServings] = useState("1");
  const [quick, setQuick] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const list = useMemo(() => {
    const base = tab === "recent" ? recent : foods;
    const q = query.trim().toLowerCase();
    return q ? base.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)) : base;
  }, [tab, query, foods, recent]);

  const n = Number(servings) || 0;
  const submit = (payload: Record<string, unknown>, label: string) => {
    startTransition(async () => {
      const result = await addMealItem({ date, mealType, ...payload });
      if (!result.ok) return toast.error(result.error);
      toast.success(`Added ${label}`);
      onClose();
    });
  };

  return (
    <DialogShell title={`Add to ${MEAL_LABEL[mealType]}`} onClose={onClose} maxWidth={520}>

      <div className="btn-group btn-group-sm w-100 mb-3" role="group" aria-label="Source">
        {(["library", "recent", "quick"] as Tab[]).map((t) => (
          <button key={t} type="button" className={`btn ${tab === t ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { setTab(t); setSelected(null); }}>
            {t === "library" ? "Food library" : t === "recent" ? "Recent" : "Quick add"}
          </button>
        ))}
      </div>

      {tab === "quick" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit({ name: quick.name || "Quick add", servings: 1, calories: quick.calories, protein: quick.protein || 0, carbs: quick.carbs || 0, fat: quick.fat || 0 }, quick.name || "entry");
          }}
        >
          <div className="mb-2">
            <label className="form-label small mb-1" htmlFor="q-name">Name</label>
            <input id="q-name" className="form-control" maxLength={160} value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} placeholder="e.g. Lunch at the canteen" />
          </div>
          <div className="row g-2 mb-3">
            {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
              <div className="col-6 col-md-3" key={k}>
                <label className="form-label small mb-1" htmlFor={`q-${k}`}>{k === "calories" ? "Calories" : `${k[0].toUpperCase()}${k.slice(1)} (g)`}</label>
                <input id={`q-${k}`} type="number" min="0" step="0.1" inputMode="decimal" className="form-control" value={quick[k]} onChange={(e) => setQuick({ ...quick, [k]: e.target.value })} required={k === "calories"} />
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !quick.calories}>Add</button>
          </div>
        </form>
      ) : selected ? (
        <div>
          <div className="mb-2">
            <div className="fw-semibold">{selected.name}{selected.brand ? ` (${selected.brand})` : ""}</div>
            <div className="text-muted small">per {selected.servingSize} {selected.servingUnit}</div>
          </div>
          <label className="form-label small mb-1" htmlFor="servings">Servings</label>
          <div className="input-group mb-3" style={{ maxWidth: 220 }}>
            <button type="button" className="btn btn-outline-primary" aria-label="Fewer servings" onClick={() => setServings(String(Math.max(0.25, round1(n - 0.5))))}>−</button>
            <input id="servings" type="number" min="0.1" step="0.25" inputMode="decimal" className="form-control text-center" value={servings} onChange={(e) => setServings(e.target.value)} />
            <button type="button" className="btn btn-outline-primary" aria-label="More servings" onClick={() => setServings(String(round1(n + 0.5)))}>+</button>
          </div>
          <div className="row text-center g-2 mb-3">
            {[
              ["kcal", Math.round(selected.calories * n)],
              ["Protein", `${round1(selected.protein * n)} g`],
              ["Carbs", `${round1(selected.carbs * n)} g`],
              ["Fat", `${round1(selected.fat * n)} g`],
            ].map(([label, value]) => (
              <div className="col-3" key={label}>
                <div className="fw-semibold">{value}</div>
                <div className="text-muted small">{label}</div>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setSelected(null)}>Back</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={isPending || n <= 0} onClick={() => submit({ foodId: selected.id, servings: n }, selected.name)}>Add</button>
          </div>
        </div>
      ) : (
        <>
          <input className="form-control mb-2" placeholder="Search foods…" aria-label="Search foods" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          <div style={{ maxHeight: 320, overflowY: "auto" }} className="list-group">
            {list.length === 0 && <div className="text-muted small p-3">{tab === "recent" ? "Nothing logged yet." : "No foods match. Try Quick add or add it in the food library."}</div>}
            {list.map((f) => (
              <button key={f.id} type="button" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => { setSelected(f); setServings("1"); }}>
                <span>
                  {f.isFavorite && <FiStar className="text-warning me-1" aria-label="Favorite" />}
                  {f.name}{f.brand ? ` (${f.brand})` : ""}
                  <span className="text-muted small d-block">{f.servingSize} {f.servingUnit}</span>
                </span>
                <span className="text-muted small text-nowrap">{Math.round(f.calories)} kcal</span>
              </button>
            ))}
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </DialogShell>
  );
}
