/**
 * The one place chart colours are defined.
 *
 * Every chart in the workspace used to declare its own copy of these values under a
 * different name (RAW / BAR / LINE / SERIES_COLOR for the same blue), which made a
 * palette change a hunt through six files and let the charts drift apart. They are the
 * validated defaults from the dataviz reference palette, used unchanged.
 */
export const chart = {
  /** Categorical slot 1. The default for a single-series chart. */
  series1: "#2a78d6",
  /** Categorical slot 2. Pairs with series1 (raw values vs their average). */
  series2: "#eb6834",
  /** Categorical slot 3. */
  series3: "#eab308",
  /** Categorical slot 4. */
  series4: "#e87ba4",
  /** Recessive gridlines: present enough to read a value against, quiet enough to ignore. */
  grid: "#e1e0d9",
  /** Axis labels, tick text and reference lines. */
  muted: "#5f6368",
} as const;

/** Sequential blue ramp (light to dark) for density, e.g. the activity heatmap. */
export const heatSteps = ["#f0efec", "#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"] as const;

/** Axis defaults shared by every chart, so tick size and colour never drift apart. */
export const axisTick = { fontSize: 11, fill: chart.muted } as const;
export const axisLine = { stroke: chart.grid } as const;
