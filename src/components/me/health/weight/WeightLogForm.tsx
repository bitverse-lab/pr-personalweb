"use client";

import { useState, useTransition } from "react";
import { logWeight } from "@/features/health/weight-actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function WeightLogForm({ today, lastWeight }: { today: string; lastWeight: number | null }) {
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(lastWeight?.toString() ?? "");
  const [bodyFat, setBodyFat] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await logWeight({ date, weightKg: weight, bodyFatPct: bodyFat, note });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Logged ${result.data.weightKg} kg`);
      setBodyFat("");
      setNote("");
    });
  };

  return (
    <form onSubmit={submit} className="row g-2 align-items-end">
      <div className="col-6 col-md-3">
        <label className="form-label small mb-1" htmlFor="w-date">Date</label>
        <input id="w-date" type="date" className="form-control" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label small mb-1" htmlFor="w-kg">Weight (kg)</label>
        <input id="w-kg" type="number" step="0.1" min="20" max="400" inputMode="decimal" className="form-control" value={weight} onChange={(e) => setWeight(e.target.value)} required />
      </div>
      <div className="col-6 col-md-2">
        <label className="form-label small mb-1" htmlFor="w-bf">Body fat % <span className="text-muted">(opt.)</span></label>
        <input id="w-bf" type="number" step="0.1" min="2" max="70" inputMode="decimal" className="form-control" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
      </div>
      <div className="col-6 col-md-3">
        <label className="form-label small mb-1" htmlFor="w-note">Note <span className="text-muted">(opt.)</span></label>
        <input id="w-note" className="form-control" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="col-12 col-md-2">
        <button type="submit" className="btn btn-primary w-100" disabled={isPending || !weight}>
          {isPending ? "Saving…" : "Log weight"}
        </button>
      </div>
    </form>
  );
}
