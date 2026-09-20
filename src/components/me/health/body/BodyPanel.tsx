"use client";

import { useState, useTransition } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiActivity, FiTrash2 } from "react-icons/fi";
import { deleteMeasurement, logMeasurement } from "@/features/health/weight-actions";
import { fmtDate } from "@/features/health/format";
import { round1 } from "@/features/health/calc";
import { useToast } from "@/components/shared/ToastProvider";
import EmptyState from "@/components/shared/EmptyState";

export interface MeasurementRow {
  id: string;
  date: string;
  waistCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  neckCm: number | null;
}

type Metric = "waistCm" | "chestCm" | "hipsCm" | "armCm" | "thighCm" | "neckCm";
const METRICS: { key: Metric; label: string }[] = [
  { key: "waistCm", label: "Waist" },
  { key: "chestCm", label: "Chest" },
  { key: "hipsCm", label: "Hips" },
  { key: "armCm", label: "Arm" },
  { key: "thighCm", label: "Thigh" },
  { key: "neckCm", label: "Neck" },
];

const LINE = "#2a78d6";
const MUTED = "#5f6368";
const GRID = "#e1e0d9";

export default function BodyPanel({ rows, today }: { rows: MeasurementRow[]; today: string }) {
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<Metric, string>>({ waistCm: "", chestCm: "", hipsCm: "", armCm: "", thighCm: "", neckCm: "" });
  const [metric, setMetric] = useState<Metric>("waistCm");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await logMeasurement({ date, ...values });
      if (!result.ok) return toast.error(result.error);
      toast.success("Measurements saved");
      setValues({ waistCm: "", chestCm: "", hipsCm: "", armCm: "", thighCm: "", neckCm: "" });
    });
  };

  const remove = (row: MeasurementRow) => {
    startTransition(async () => {
      const result = await deleteMeasurement(row.id);
      if (!result.ok) return toast.error(result.error);
      toast.success("Entry deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            const { id, ...rest } = row;
            void id;
            void logMeasurement(Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? ""]))).then((r) =>
              r.ok ? toast.success("Entry restored") : toast.error(r.error)
            );
          },
        },
      });
    });
  };

  const series = rows.filter((r) => r[metric] !== null).map((r) => ({ date: r.date, value: r[metric] as number }));
  const change = series.length >= 2 ? round1(series[series.length - 1].value - series[0].value) : null;
  const newestFirst = [...rows].reverse();

  return (
    <>
      <div className="card rounded shadow-sm mb-4">
        <div className="card-body">
          <h6 className="mb-3">Log measurements</h6>
          <form onSubmit={submit} className="row g-2 align-items-end">
            <div className="col-6 col-md-3 col-lg-2">
              <label className="form-label small mb-1" htmlFor="m-date">Date</label>
              <input id="m-date" type="date" className="form-control" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
            </div>
            {METRICS.map((m) => (
              <div className="col-6 col-md-3 col-lg-2" key={m.key}>
                <label className="form-label small mb-1" htmlFor={`m-${m.key}`}>{m.label} (cm)</label>
                <input id={`m-${m.key}`} type="number" step="0.1" min="0" inputMode="decimal" className="form-control" value={values[m.key]} onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-12 col-lg-2">
              <button type="submit" className="btn btn-primary w-100" disabled={isPending}>Save</button>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <EmptyState icon={FiActivity} title="No measurements yet" description="Track waist, chest, arms and more to see changes the scale can't show." />
          </div>
        </div>
      ) : (
        <>
          <div className="card rounded shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <div className="btn-group btn-group-sm" role="group" aria-label="Metric">
                  {METRICS.map((m) => (
                    <button key={m.key} type="button" className={`btn ${metric === m.key ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMetric(m.key)}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <span className="text-muted small">{change === null ? "Need two entries for a change" : `Change since first entry: ${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)} cm`}</span>
              </div>
              {series.length === 0 ? (
                <p className="text-muted small mb-0">No {METRICS.find((m) => m.key === metric)?.label.toLowerCase()} entries yet.</p>
              ) : (
                <div style={{ width: "100%", height: 260 }} role="img" aria-label={`${metric} over time`}>
                  <ResponsiveContainer>
                    <LineChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(d) => fmtDate(String(d))} tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={28} />
                      <YAxis domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={44} unit=" cm" />
                      <Tooltip labelFormatter={(d) => fmtDate(String(d), { month: "short", day: "numeric", year: "numeric" })} formatter={(v) => [`${v} cm`]} />
                      <Line dataKey="value" stroke={LINE} strokeWidth={2.5} dot={{ r: 3, fill: LINE }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">History</h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th>Date</th>
                      {METRICS.map((m) => (<th key={m.key} className="text-end">{m.label}</th>))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {newestFirst.map((r) => (
                      <tr key={r.id}>
                        <td>{fmtDate(r.date, { month: "short", day: "numeric", year: "numeric" })}</td>
                        {METRICS.map((m) => (<td key={m.key} className="text-end">{r[m.key] ?? "—"}</td>))}
                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => remove(r)} aria-label={`Delete measurements ${r.date}`} disabled={isPending}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
