import type { EventColor } from "@/db/schema/productivity";

export const EVENT_COLOR_KEYS = ["blue", "orange", "green", "pink", "violet", "red"] as const;

// Categorical slots from the dataviz reference palette, used unchanged.
export const EVENT_COLORS: Record<EventColor, string> = {
  blue: "#2a78d6",
  orange: "#eb6834",
  green: "#1baf7a",
  pink: "#e87ba4",
  violet: "#4a3aa7",
  red: "#e34948",
};

export function eventColorHex(color: EventColor | null | undefined): string {
  return EVENT_COLORS[color ?? "blue"];
}
