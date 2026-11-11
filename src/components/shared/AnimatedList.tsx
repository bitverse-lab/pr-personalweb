"use client";

import { createElement } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

/**
 * A list whose items ease in, out and into new places when they are added, removed or reordered
 * (a task ticked off, a message deleted, an entry filtered). auto-animate already does nothing
 * under prefers-reduced-motion. Not for dnd-kit lists: two libraries would move the same nodes.
 */
export default function AnimatedList({
  as = "ul",
  ...props
}: { as?: "ul" | "ol" | "div" } & React.HTMLAttributes<HTMLElement>) {
  const [ref] = useAutoAnimate<HTMLElement>({ duration: 220, easing: "ease-out" });
  return createElement(as, { ...props, ref });
}
