"use client";

import { FiArrowDown, FiArrowUp } from "react-icons/fi";

export const monthValue = (date: string | null) => (date ? date.slice(0, 7) : "");
export const monthToDate = (month: string) => (month ? `${month}-01` : "");

export function fmtMonth(date: string | null): string {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function MoveButtons({ index, count, onMove }: { index: number; count: number; onMove: (delta: -1 | 1) => void }) {
  return (
    <>
      <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
        <FiArrowUp />
      </button>
      <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
        <FiArrowDown />
      </button>
    </>
  );
}

export function moveItem<T extends { id: string }>(items: T[], index: number, delta: -1 | 1): T[] {
  const j = index + delta;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}
