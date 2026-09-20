"use client";

import { useMemo, useState, useTransition } from "react";
import { FiEdit2, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";
import { createFood, deleteFood, updateFood, type FoodDto } from "@/features/health/nutrition-actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import FoodFormDialog from "./FoodFormDialog";

export default function FoodLibrary({ foods }: { foods: FoodDto[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FoodDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<FoodDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)) : foods;
  }, [foods, query]);

  const toggleFavorite = (f: FoodDto) =>
    startTransition(async () => {
      const result = await updateFood({ id: f.id, data: { isFavorite: !f.isFavorite } });
      if (!result.ok) toast.error(result.error);
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const food = deleting;
    startTransition(async () => {
      const result = await deleteFood(food.id);
      setDeleting(null);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Deleted ${food.name}`, {
        action: {
          label: "Undo",
          onClick: () => {
            const { id, ...rest } = food;
            void id;
            void createFood(rest).then((r) => (r.ok ? toast.success("Restored") : toast.error(r.error)));
          },
        },
      });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h6 className="mb-0">Food library <span className="text-muted small">({foods.length})</span></h6>
          <div className="d-flex gap-2">
            <input className="form-control form-control-sm" style={{ width: 200 }} placeholder="Search…" aria-label="Search food library" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}>
              <FiPlus /> New food
            </button>
          </div>
        </div>
        <div className="table-responsive" style={{ maxHeight: 420, overflowY: "auto" }}>
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr className="text-muted small">
                <th />
                <th>Food</th>
                <th className="text-end">Serving</th>
                <th className="text-end">kcal</th>
                <th className="text-end d-none d-md-table-cell">P / C / F</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td style={{ width: 32 }}>
                    <button type="button" className="btn btn-sm border-0 p-0" aria-label={f.isFavorite ? `Unfavorite ${f.name}` : `Favorite ${f.name}`} aria-pressed={f.isFavorite} disabled={isPending} onClick={() => toggleFavorite(f)}>
                      <FiStar className={f.isFavorite ? "text-warning" : "text-muted"} fill={f.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td>{f.name}{f.brand && <span className="text-muted small"> · {f.brand}</span>}</td>
                  <td className="text-end text-muted">{f.servingSize} {f.servingUnit}</td>
                  <td className="text-end">{Math.round(f.calories)}</td>
                  <td className="text-end text-muted d-none d-md-table-cell">{f.protein} / {f.carbs} / {f.fat}</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f)}><FiEdit2 /></button>
                    <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${f.name}`} onClick={() => setDeleting(f)}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (<tr><td colSpan={6} className="text-muted small py-3">No foods found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <FoodFormDialog food={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog title="Delete food?" message={`"${deleting.name}" will be removed from your library. Meals you already logged keep their values.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
