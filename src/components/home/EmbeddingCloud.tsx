"use client";

import { useEffect, useRef } from "react";

// The hero's backdrop: the owner's stack drawn as an embedding space. Each layer (frontend, ml, …)
// is a cluster, each skill a point in it, each project a bright node tied to the layers it uses.
// Pointing at a row in the query console lights the matching cluster or project here too.
// Plain Canvas 2D with a hand-rolled projection: a few hundred points need no WebGL library.

export interface CloudLayer {
  name: string;
  skills: string[];
}
export interface CloudProject {
  slug: string;
  title: string;
  layers: string[];
}
/** Sent by the query console: which layer or project the visitor is pointing at. */
export type CloudFocus = { layer: string } | { slug: string } | null;
export const CLOUD_FOCUS_EVENT = "hero:focus";

type Kind = "dust" | "skill" | "project";
interface Pt {
  x: number;
  y: number;
  z: number;
  kind: Kind;
  layer?: string;
  slug?: string;
  label?: string;
  glow: number; // eased 0..1 highlight
}

// Deterministic randomness, so the cloud has the same shape on every visit.
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function build(layers: CloudLayer[], projects: CloudProject[], dust: number): Pt[] {
  const r = rng(layers.map((l) => l.name).join("|") || "cloud");
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  const centers = new Map<string, [number, number, number]>();
  // Layers spread evenly over a sphere (Fibonacci lattice).
  layers.forEach((l, i) => {
    const n = Math.max(layers.length, 2);
    const y = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    centers.set(l.name, [Math.cos(phi) * rad * 0.85, y * 0.75, Math.sin(phi) * rad * 0.85]);
  });
  const pts: Pt[] = [];
  for (const l of layers) {
    const [cx, cy, cz] = centers.get(l.name)!;
    // A few extra points per skill so small stacks still read as clusters.
    for (const s of l.skills) {
      for (let k = 0; k < 6; k++) {
        pts.push({ x: cx + gauss() * 0.27, y: cy + gauss() * 0.27, z: cz + gauss() * 0.27, kind: "skill", layer: l.name, label: k === 0 ? s : undefined, glow: 0 });
      }
    }
  }
  for (const p of projects) {
    const cs = p.layers.map((l) => centers.get(l)).filter((c): c is [number, number, number] => !!c);
    if (!cs.length) continue;
    const avg = cs.reduce((a, c) => [a[0] + c[0] / cs.length, a[1] + c[1] / cs.length, a[2] + c[2] / cs.length], [0, 0, 0]);
    pts.push({ x: avg[0] * 0.7 + gauss() * 0.08, y: avg[1] * 0.7 + gauss() * 0.08, z: avg[2] * 0.7 + gauss() * 0.08, kind: "project", slug: p.slug, label: p.title, glow: 0 });
  }
  for (let i = 0; i < dust; i++) {
    const t = r() * Math.PI * 2;
    const u = r() * 2 - 1;
    const d = 0.4 + r() * 0.95;
    const s = Math.sqrt(1 - u * u);
    pts.push({ x: Math.cos(t) * s * d * 1.25, y: u * d * 0.9, z: Math.sin(t) * s * d * 1.25, kind: "dust", glow: 0 });
  }
  return pts;
}

export default function EmbeddingCloud({ layers, projects }: { layers: CloudLayer[]; projects: CloudProject[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const small = window.innerWidth < 768;
    const pts = build(layers, projects, small ? 80 : 190);
    const byLayer = new Map<string, Pt[]>();
    for (const p of pts) if (p.layer) byLayer.set(p.layer, [...(byLayer.get(p.layer) ?? []), p]);
    const projectLayers = new Map(projects.map((p) => [p.slug, p.layers]));

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--bs-primary-rgb").trim() || "42, 82, 195";
    const ink = "20, 28, 48";
    const mono = "500 11px 'JetBrains Mono', ui-monospace, monospace";

    let focus: CloudFocus = null;
    let w = 0;
    let h = 0;
    let angle = 0.6;
    let tiltX = 0.18;
    let tiltY = 0;
    let targetX = 0.18;
    let targetY = 0;
    let raf = 0;
    // Where the cloud sits: in the gap left of the console on wide screens; behind the name, top
    // right, once the hero stacks (the console would otherwise cover it).
    let place = { x: 0.45, y: 0.47, r: 0.48 };
    let visible = true;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      place = w >= 920 ? { x: 0.45, y: 0.47, r: 0.48 } : { x: 0.72, y: Math.min(0.24, 260 / Math.max(h, 1)), r: 0.42 };
      const mask = `radial-gradient(ellipse ${w >= 920 ? "30% 38%" : "70% 28%"} at ${place.x * 100}% ${place.y * 100}%, #000 40%, transparent 100%)`;
      canvas.style.maskImage = mask;
      canvas.style.webkitMaskImage = mask;
    };

    const isLit = (p: Pt) => {
      if (!focus) return false;
      if ("layer" in focus) return p.layer === focus.layer || (p.kind === "project" && !!p.slug && (projectLayers.get(p.slug) ?? []).includes(focus.layer));
      return p.slug === focus.slug || (!!p.layer && (projectLayers.get(focus.slug) ?? []).includes(p.layer));
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * place.x;
      const cy = h * place.y;
      const scale = Math.min(w, w >= 920 ? h : 520) * place.r;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
      const ease = reduce ? 1 : 1 - Math.exp(-dt / 140);

      const proj = pts.map((p) => {
        p.glow += ((isLit(p) ? 1 : 0) - p.glow) * ease;
        // rotate around Y (spin), then X (tilt), then a little Y from the pointer
        let x = p.x * cosA - p.z * sinA;
        let z = p.x * sinA + p.z * cosA;
        const y = p.y * cosX - z * sinX;
        z = p.y * sinX + z * cosX;
        const x2 = x * cosY - z * sinY;
        z = x * sinY + z * cosY;
        x = x2;
        const f = 2.8 / (2.8 + z);
        return { p, sx: cx + x * scale * f, sy: cy + y * scale * f, depth: f };
      });
      proj.sort((a, b) => a.depth - b.depth);

      // Threads from each project to its layers: faint always, bright when in focus.
      for (const a of proj) {
        if (a.p.kind !== "project" || !a.p.slug) continue;
        for (const layer of projectLayers.get(a.p.slug) ?? []) {
          const members = byLayer.get(layer);
          if (!members?.length) continue;
          const b = proj.find((q) => q.p === members[0]);
          if (!b) continue;
          const g = Math.max(a.p.glow, b.p.glow);
          ctx.strokeStyle = `rgba(${primary}, ${0.07 + g * 0.22})`;
          ctx.lineWidth = 0.6 + g * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      const dim = focus ? 0.45 : 1;
      for (const { p, sx, sy, depth } of proj) {
        const base = p.kind === "dust" ? 0.2 : p.kind === "skill" ? 0.5 : 0.85;
        const alpha = Math.min(1, (base * dim + p.glow * 0.6) * (0.45 + depth * 0.55));
        const size = (p.kind === "project" ? 3.4 : p.kind === "skill" ? 2.1 : 1.2) * depth * (1 + p.glow * 0.7);
        ctx.fillStyle = `rgba(${p.kind === "dust" ? ink : primary}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
        if (p.kind === "project" && p.glow > 0.05) {
          ctx.strokeStyle = `rgba(${primary}, ${p.glow * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, size + 5 * p.glow, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Names next to what is lit, so the highlight explains itself.
      if (focus) {
        ctx.font = mono;
        ctx.textBaseline = "middle";
        const taken: [number, number, number, number][] = [];
        // Nearest first, so the front label wins a collision.
        for (const { p, sx, sy } of [...proj].reverse()) {
          if (!p.label || p.glow < 0.4) continue;
          if (p.kind === "skill" && "slug" in focus) continue;
          const tw = ctx.measureText(p.label).width;
          // On wide screens the console covers the right of the hero: a label that would run under
          // it is set to the left of its point instead.
          const left = w >= 920 && sx + 8 + tw > w * 0.47;
          const x0 = left ? sx - 8 - tw : sx + 8;
          const box: [number, number, number, number] = [x0 - 2, sy - 8, x0 + tw + 2, sy + 8];
          if (taken.some((t) => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
          taken.push(box);
          ctx.fillStyle = `rgba(${p.kind === "project" ? primary : ink}, ${(p.glow - 0.3) * 0.9})`;
          ctx.textAlign = "left";
          ctx.fillText(p.label, x0, sy);
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      angle += dt * 0.00009;
      tiltX += (targetX - tiltX) * (1 - Math.exp(-dt / 400));
      tiltY += (targetY - tiltY) * (1 - Math.exp(-dt / 400));
      draw(dt);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw(16);

    const ro = new ResizeObserver(() => {
      resize();
      draw(16);
    });
    ro.observe(canvas);
    // Only animate while the hero is on screen and the tab is visible.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const onFocus = (e: Event) => {
      focus = (e as CustomEvent<CloudFocus>).detail;
      if (reduce) draw(16);
    };
    window.addEventListener(CLOUD_FOCUS_EVENT, onFocus);

    const onMove = (e: PointerEvent) => {
      targetY = (e.clientX / window.innerWidth - 0.5) * 0.5;
      targetX = 0.18 + (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    if (fine && !reduce) window.addEventListener("pointermove", onMove, { passive: true });

    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(CLOUD_FOCUS_EVENT, onFocus);
      window.removeEventListener("pointermove", onMove);
    };
  }, [layers, projects]);

  return <canvas ref={canvasRef} className="hero-cloud" aria-hidden="true" />;
}
