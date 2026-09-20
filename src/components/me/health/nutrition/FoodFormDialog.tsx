"use client";

import { useState, useTransition } from "react";
import { createFood, updateFood, type FoodDto } from "@/features/health/nutrition-actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useToast } from "@/components/shared/ToastProvider";

const UNITS = ["g", "ml", "piece", "cup", "tbsp", "slice"] as const;

export default function FoodFormDialog({ food, onClose }: { food?: FoodDto; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [f, setF] = useState({
    name: food?.name ?? "",
    brand: food?.brand ?? "",
    servingSize: String(food?.servingSize ?? 100),
    servingUnit: food?.servingUnit ?? "g",
    calories: food ? String(food.calories) : "",
    protein: food ? String(food.protein) : "",
    carbs: food ? String(food.carbs) : "",
    fat: food ? String(food.fat) : "",
    fiber: food ? String(food.fiber) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = food ? await updateFood({ id: food.id, data: f }) : await createFood(f);
      if (!result.ok) return setError(result.error);
      toast.success(food ? "Food updated" : "Food added");
      onClose();
    });
  };

  const num = (label: string, k: keyof typeof f, required = false) => (
    <div className="col-6 col-md-4">
      <label className="form-label small mb-1" htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} type="number" min="0" step="0.1" inputMode="decimal" className="form-control" value={f[k]} onChange={set(k)} required={required} />
    </div>
  );

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="food-form-title" onClick={(e) => e.stopPropagation()}>
        <h6 id="food-form-title" className="mb-3">{food ? "Edit food" : "New food"}</h6>
        <p className="text-muted small">Values are per one serving. Changing a food never rewrites meals you already logged.</p>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="row g-2 mb-2">
            <div className="col-12 col-md-8">
              <label className="form-label small mb-1" htmlFor="f-name">Name</label>
              <input id="f-name" className="form-control" maxLength={120} value={f.name} onChange={set("name")} required />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small mb-1" htmlFor="f-brand">Brand (opt.)</label>
              <input id="f-brand" className="form-control" maxLength={80} value={f.brand} onChange={set("brand")} />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="f-size">Serving size</label>
              <input id="f-size" type="number" min="0.1" step="0.1" className="form-control" value={f.servingSize} onChange={set("servingSize")} required />
            </div>
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="f-unit">Unit</label>
              <select id="f-unit" className="form-select" value={f.servingUnit} onChange={set("servingUnit")}>
                {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            {num("Calories (kcal)", "calories", true)}
            {num("Protein (g)", "protein")}
            {num("Carbs (g)", "carbs")}
            {num("Fat (g)", "fat")}
            {num("Fiber (g)", "fiber")}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !f.name.trim() || !f.calories}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
