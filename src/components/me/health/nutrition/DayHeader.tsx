"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiChevronLeft, FiChevronRight, FiCopy } from "react-icons/fi";
import { addDays } from "@/features/health/calc";
import { fmtDate } from "@/features/health/format";
import { copyMealsFromDate } from "@/features/health/nutrition-actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function DayHeader({ date, today, isEmpty }: { date: string; today: string; isEmpty: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const go = (d: string) => router.push(d === today ? "/me/health/nutrition" : `/me/health/nutrition?date=${d}`);

  const copyPrevious = () => {
    startTransition(async () => {
      const result = await copyMealsFromDate({ from: addDays(date, -1), to: date });
      if (!result.ok) return toast.error(result.error);
      toast.success(`Copied ${result.data.count} items from the previous day`);
    });
  };

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-outline-primary btn-sm" aria-label="Previous day" onClick={() => go(addDays(date, -1))}>
          <FiChevronLeft />
        </button>
        <input type="date" className="form-control form-control-sm" style={{ width: 160 }} aria-label="Pick a date" value={date} max={today} onChange={(e) => e.target.value && go(e.target.value)} />
        <button type="button" className="btn btn-outline-primary btn-sm" aria-label="Next day" disabled={date >= today} onClick={() => go(addDays(date, 1))}>
          <FiChevronRight />
        </button>
        {date !== today && (
          <button type="button" className="btn btn-link btn-sm" onClick={() => go(today)}>Today</button>
        )}
        <span className="text-muted small d-none d-md-inline">{fmtDate(date, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
      {isEmpty && (
        <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" disabled={isPending} onClick={copyPrevious}>
          <FiCopy /> Copy previous day
        </button>
      )}
    </div>
  );
}
