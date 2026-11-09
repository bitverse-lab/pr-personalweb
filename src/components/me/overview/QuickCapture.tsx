"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FiBriefcase, FiBookOpen, FiCheckSquare, FiCoffee, FiDroplet, FiPlus, FiTrendingUp } from "react-icons/fi";
import { createTask } from "@/features/tasks/actions";
import { logWeight } from "@/features/health/weight-actions";
import { addMealItem, addWater } from "@/features/health/nutrition-actions";
import { addJournalNote } from "@/features/content/journal-actions";
import { createApplication } from "@/features/career/actions";
import { useToast } from "@/components/shared/ToastProvider";
import type { MealType } from "@/db/schema/health";

type Mode = "task" | "weight" | "meal" | "water" | "note" | "job";

const TABS: { mode: Mode; label: string; Icon: typeof FiCheckSquare }[] = [
  { mode: "task", label: "Task", Icon: FiCheckSquare },
  { mode: "weight", label: "Weight", Icon: FiTrendingUp },
  { mode: "meal", label: "Meal", Icon: FiCoffee },
  { mode: "water", label: "Water", Icon: FiDroplet },
  { mode: "note", label: "Note", Icon: FiBookOpen },
  { mode: "job", label: "Job lead", Icon: FiBriefcase },
];

function guessMealType(): MealType {
  const h = new Date().getHours();
  return h < 10 ? "breakfast" : h < 15 ? "lunch" : h < 21 ? "dinner" : "snack";
}

type Outcome = { ok: boolean; error?: string };

// One place to log the things you do many times a day. Press "c" anywhere on the Overview to jump here.
export default function QuickCapture({ today }: { today: string }) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("task");
  const [isPending, startTransition] = useTransition();
  const first = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [kg, setKg] = useState("");
  const [meal, setMeal] = useState("");
  const [kcal, setKcal] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [ml, setMl] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => setMealType(guessMealType()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (e.key === "c" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        first.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => first.current?.focus({ preventScroll: true }), [mode]);

  const finish = (result: Outcome, message: string, reset: () => void) => {
    if (!result.ok) return toast.error(result.error ?? "Something went wrong");
    toast.success(message);
    reset();
    first.current?.focus({ preventScroll: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (mode === "task") {
        finish(await createTask({ title, dueDate: due || undefined }), "Task added", () => {
          setTitle("");
          setDue("");
        });
      } else if (mode === "weight") {
        finish(await logWeight({ date: today, weightKg: kg }), "Weight logged", () => setKg(""));
      } else if (mode === "meal") {
        finish(
          await addMealItem({ date: today, mealType, name: meal || "Quick add", servings: 1, calories: kcal, protein: 0, carbs: 0, fat: 0 }),
          `Added to ${mealType}`,
          () => {
            setMeal("");
            setKcal("");
          }
        );
      } else if (mode === "water") {
        finish(await addWater({ date: today, amountMl: ml }), `+${ml} ml`, () => setMl(""));
      } else if (mode === "note") {
        finish(await addJournalNote({ text: note }), "Saved to today's journal", () => setNote(""));
      } else {
        finish(await createApplication({ companyName: company, roleTitle: role, status: "wishlist" }), "Added to your wishlist", () => {
          setCompany("");
          setRole("");
        });
      }
    });
  };

  const quickWater = (amount: number) =>
    startTransition(async () => {
      finish(await addWater({ date: today, amountMl: amount }), `+${amount} ml`, () => undefined);
    });

  const canSubmit =
    mode === "task" ? !!title.trim() : mode === "weight" ? !!kg : mode === "meal" ? !!kcal : mode === "water" ? !!ml : mode === "note" ? !!note.trim() : !!company.trim() && !!role.trim();

  return (
    <div className="card rounded shadow-sm mb-4 me-quick-capture">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="features feature-primary feature-clean me-capture-feature flex-shrink-0" aria-hidden="true">
              <div className="icons rounded">
                <FiPlus className="icon" />
              </div>
            </div>
            <h6 className="mb-0">Quick capture</h6>
          </div>
          <div className="me-capture-tabs d-flex flex-wrap gap-2" role="tablist" aria-label="What do you want to log?">
            {TABS.map(({ mode: m, label, Icon }) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} className={`btn btn-sm btn-pills d-inline-flex align-items-center gap-1 ${mode === m ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode(m)}>
                <Icon aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="d-flex flex-wrap gap-2 align-items-center">
          {mode === "task" && (
            <>
              <input ref={first} className="form-control flex-grow-1" style={{ minWidth: 200, width: "auto" }} placeholder="What needs doing?" aria-label="Task title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
              <input type="date" className="form-control" style={{ width: 160 }} aria-label="Due date (optional)" value={due} onChange={(e) => setDue(e.target.value)} />
            </>
          )}
          {mode === "weight" && (
            <input ref={first} type="number" step="0.1" min="20" max="400" inputMode="decimal" className="form-control" style={{ width: 160 }} placeholder="kg, e.g. 72.4" aria-label="Weight in kg" value={kg} onChange={(e) => setKg(e.target.value)} />
          )}
          {mode === "meal" && (
            <>
              <input ref={first} className="form-control flex-grow-1" style={{ minWidth: 160, width: "auto" }} placeholder="What did you eat?" aria-label="Meal name" maxLength={160} value={meal} onChange={(e) => setMeal(e.target.value)} />
              <input type="number" min="0" step="1" inputMode="numeric" className="form-control" style={{ width: 110 }} placeholder="kcal" aria-label="Calories" value={kcal} onChange={(e) => setKcal(e.target.value)} />
              <select className="form-select" style={{ width: 130 }} aria-label="Meal type" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </>
          )}
          {mode === "water" && (
            <>
              {[250, 500].map((a) => (
                <button key={a} type="button" className="btn btn-outline-primary" disabled={isPending} onClick={() => quickWater(a)}>
                  +{a} ml
                </button>
              ))}
              <input ref={first} type="number" min="1" max="5000" inputMode="numeric" className="form-control" style={{ width: 130 }} placeholder="custom ml" aria-label="Water in ml" value={ml} onChange={(e) => setMl(e.target.value)} />
            </>
          )}
          {mode === "note" && (
            <input ref={first} className="form-control flex-grow-1" style={{ minWidth: 220, width: "auto" }} placeholder="A thought for today's journal…" aria-label="Journal note" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
          {mode === "job" && (
            <>
              <input ref={first} className="form-control flex-grow-1" style={{ minWidth: 150, width: "auto" }} placeholder="Company" aria-label="Company" maxLength={120} value={company} onChange={(e) => setCompany(e.target.value)} />
              <input className="form-control flex-grow-1" style={{ minWidth: 150, width: "auto" }} placeholder="Role" aria-label="Role" maxLength={160} value={role} onChange={(e) => setRole(e.target.value)} />
            </>
          )}
          <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-1" disabled={isPending || !canSubmit}>
            <FiPlus aria-hidden /> {mode === "weight" ? "Log" : mode === "note" ? "Save" : "Add"}
          </button>
        </form>
        <div className="text-muted small mt-2">
          Press <kbd>c</kbd> to jump here.
          {mode === "meal" && " Log full nutrition on the Nutrition page."}
          {mode === "job" && " Added as a wishlist lead; add details later."}
        </div>
      </div>
    </div>
  );
}
