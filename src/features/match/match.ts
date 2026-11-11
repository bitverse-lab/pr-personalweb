// "Match my JD": a job description split into requirements, each answered with the owner's
// strongest evidence. Pure functions only (unit-tested); the page runs them in the browser, so the
// pasted text never leaves it.
import type { Snapshot } from "@/features/sandbox/snapshot";

export interface Evidence {
  id: string;
  kind: "project" | "achievement" | "article" | "testimonial" | "skill";
  label: string;
  text: string; // what is matched against (and embedded)
  href: string;
  skills: string[]; // lower-cased tools this evidence involves
  layer?: string; // for kind "skill": the owner's grouping (data, api, ml, …)
}

export interface Match {
  evidence: Evidence;
  score: number; // 0..1
  via: "skill" | "layer" | "meaning";
}

export interface RequirementResult {
  requirement: string;
  matches: Match[];
}

// Lines a job ad always has that are not requirements.
const BOILERPLATE = /\b(salary|benefit|perks?|insurance|bpjs|holiday|paid leave|equal opportunit|we offer|what we offer|about us|about the company|apply|send your cv|how to apply|deadline|office located|work from|hybrid|on-?site|full[- ]time|part[- ]time|contract)\b/i;
const JOB_TITLE = /\b(engineer|developer|scientist|analyst|architect|lead|manager|intern|programmer|specialist)s?\s*$/i;
const HEADING = /^(requirements?|qualifications?|responsibilit(y|ies)|what you('ll| will) do|who you are|nice to have|bonus|kualifikasi|persyaratan|tanggung jawab|job desc(ription)?)\s*:?$/i;

/** Requirement-sized pieces of a job description: bullets and lines, long ones split into sentences. */
export function splitRequirements(jd: string, max = 30): string[] {
  const pieces = jd
    .split(/\r?\n|•|·|▪|◦/)
    .map((l) => l.replace(/^\s*(?:[-*–+]|\d+[.)])\s*/, "").trim())
    .flatMap((l) => (l.length > 220 ? l.split(/(?<=[.;])\s+(?=[A-Z])/) : [l]))
    .map((l) => l.replace(/\s+/g, " ").replace(/[.;:,]$/, "").trim())
    .filter((l) => l.length >= 10 && l.split(" ").length >= 2 && !HEADING.test(l) && !BOILERPLATE.test(l));
  // A short first line naming the role ("Backend / Data Engineer") is a title, not a requirement.
  if (pieces.length > 1 && pieces[0].split(" ").length <= 5 && JOB_TITLE.test(pieces[0])) pieces.shift();
  return Array.from(new Set(pieces)).slice(0, max);
}

// Common ways a job ad names a tool the owner lists differently.
const ALIASES: Record<string, string[]> = {
  postgresql: ["postgres", "psql"],
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "node.js": ["node", "nodejs"],
  "next.js": ["nextjs"],
  react: ["reactjs", "react.js"],
  "machine learning": ["ml"],
  docker: ["containers", "containerization"],
  "github actions": ["ci/cd", "ci cd", "continuous integration"],
  "rest api design": ["rest", "restful", "rest api"],
  pytorch: ["torch"],
  "scikit-learn": ["sklearn", "scikit"],
};

// Words an ad uses for a whole area of work, mapped to the owner's layers (skill categories).
const LAYER_TERMS: Record<string, string[]> = {
  ml: ["machine learning", "deep learning", "ml", "nlp", "ai", "models", "model", "data science"],
  data: ["sql", "database", "databases", "data pipelines", "etl", "analytics", "data modeling"],
  api: ["backend", "back-end", "apis", "api", "microservices", "server-side"],
  ui: ["frontend", "front-end", "ui", "web interfaces", "user interface"],
  // Not "deploy": it is a verb every role uses ("deploy ML models" is about ML, not ops).
  ops: ["devops", "infrastructure", "ci/cd", "pipelines", "cloud"],
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The tool names a requirement mentions, as the owner spells them (lower-cased). */
export function skillsIn(text: string, skills: string[]): string[] {
  const hay = ` ${text.toLowerCase()} `;
  return skills.filter((s) => {
    const names = [s, ...(ALIASES[s] ?? [])];
    return names.some((n) => new RegExp(`(^|[^a-z0-9+#])${escape(n)}($|[^a-z0-9+#])`).test(hay));
  });
}

/** Every piece of evidence the public snapshot holds, with the tools each involves. */
export function buildCorpus(snapshot: Snapshot): Evidence[] {
  const t = Object.fromEntries(snapshot.tables.map((x) => [x.name, x.rows]));
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const skills = (t.skill ?? []).map((r) => str(r[0]).toLowerCase());
  const toolsOf = new Map<string, string[]>();
  for (const [slug, skill] of t.project_skill ?? []) toolsOf.set(str(slug), [...(toolsOf.get(str(slug)) ?? []), str(skill).toLowerCase()]);
  const roles = new Map((t.experience ?? []).map((r) => [str(r[0]), { role: str(r[1]), company: str(r[2]) }]));
  const out: Evidence[] = [];
  for (const [slug, title, , summary, outcome] of t.project ?? []) {
    const tools = toolsOf.get(str(slug)) ?? [];
    out.push({ id: `project:${slug}`, kind: "project", label: str(title), text: `${str(title)}. ${str(summary)} ${str(outcome)}. Built with ${tools.join(", ")}.`, href: `/projects/${str(slug)}`, skills: tools });
  }
  for (const [expId, what] of t.achievement ?? []) {
    const r = roles.get(str(expId));
    out.push({ id: `achievement:${out.length}`, kind: "achievement", label: r ? `${r.role} @ ${r.company}` : "Experience", text: str(what), href: "/cv", skills: skillsIn(str(what), skills) });
  }
  for (const [slug, title, , , tags] of t.article ?? []) {
    const tagText = str(tags).replace(/[{}"]/g, "").replace(/,/g, ", ");
    out.push({ id: `article:${slug}`, kind: "article", label: str(title), text: `${str(title)}. ${tagText}`, href: `/articles/${str(slug)}`, skills: skillsIn(`${str(title)} ${tagText}`, skills) });
  }
  for (const [author, role, company, quote] of t.testimonial ?? []) {
    out.push({ id: `testimonial:${str(author)}`, kind: "testimonial", label: `${str(author)}${role ? `, ${str(role)}` : ""}${company ? ` · ${str(company)}` : ""}`, text: str(quote), href: "/#testimonials", skills: [] });
  }
  for (const [name, layer] of t.skill ?? []) {
    out.push({ id: `skill:${str(name)}`, kind: "skill", label: str(name), text: `${str(name)} (${str(layer)})`, href: "/cv", skills: [str(name).toLowerCase()], layer: str(layer) || undefined });
  }
  return out;
}

/** The owner's layers a requirement talks about in general terms ("machine learning" → ml). */
export function layersIn(text: string, layers: string[]): string[] {
  const hay = ` ${text.toLowerCase()} `;
  return layers.filter((l) => (LAYER_TERMS[l] ?? []).some((n) => new RegExp(`(^|[^a-z0-9+#/])${escape(n)}($|[^a-z0-9+#/])`).test(hay)));
}

/**
 * Matches by named tools (evidence that involves a tool the requirement asks for), then by area:
 * a requirement about "machine learning" is answered by work using the owner's ml-layer tools.
 */
export function skillMatches(requirement: string, corpus: Evidence[], skills: string[]): Match[] {
  const wanted = skillsIn(requirement, skills);
  const named = corpus
    .filter((e) => e.skills.some((s) => wanted.includes(s)))
    .map((e): Match => ({ evidence: e, score: Math.min(1, 0.7 + 0.15 * e.skills.filter((s) => wanted.includes(s)).length), via: "skill" }));
  const layerOf = new Map(corpus.filter((e) => e.kind === "skill" && e.layer).map((e) => [e.label.toLowerCase(), e.layer!]));
  const areas = layersIn(requirement, Array.from(new Set(layerOf.values())));
  const area = areas.length
    ? corpus
        .filter((e) => (e.kind === "project" || e.kind === "achievement" || e.kind === "article") && e.skills.some((s) => areas.includes(layerOf.get(s) ?? "")))
        // Work covering more of the areas asked about ranks higher.
        .map((e): Match => ({ evidence: e, score: 0.6 + 0.06 * areas.filter((a) => e.skills.some((s) => layerOf.get(s) === a)).length, via: "layer" }))
    : [];
  return [...named, ...area];
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Tuned on MiniLM-L6 with real job ads: below this, "similar" pairs were mostly coincidence.
export const MEANING_THRESHOLD = 0.4;

/**
 * Best evidence per requirement: named-tool matches, plus (when vectors are given) matches by
 * meaning above the threshold. A piece of evidence counts once, at its best score; projects and
 * achievements outrank a bare skill entry at equal score. Empty `matches` = an honest gap.
 */
export function matchRequirements(
  requirements: string[],
  corpus: Evidence[],
  skills: string[],
  vectors?: { requirements: ArrayLike<number>[]; corpus: ArrayLike<number>[] },
  perRequirement = 3,
): RequirementResult[] {
  const weight: Record<Evidence["kind"], number> = { project: 0.03, achievement: 0.02, article: 0.01, testimonial: 0.01, skill: -0.05 };
  return requirements.map((requirement, i) => {
    const best = new Map<string, Match>();
    const add = (m: Match) => {
      const prev = best.get(m.evidence.id);
      if (!prev || m.score > prev.score) best.set(m.evidence.id, m);
    };
    skillMatches(requirement, corpus, skills).forEach(add);
    if (vectors) {
      corpus.forEach((evidence, j) => {
        const score = cosine(vectors.requirements[i], vectors.corpus[j]);
        if (score >= MEANING_THRESHOLD) add({ evidence, score, via: "meaning" });
      });
    }
    const matches = Array.from(best.values())
      .sort((a, b) => b.score + weight[b.evidence.kind] - (a.score + weight[a.evidence.kind]))
      .slice(0, perRequirement);
    return { requirement, matches };
  });
}
