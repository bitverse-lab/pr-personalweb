import type { RichDoc } from "@/db/schema/content";

// Pure helpers shared by the editor (client) and the actions (server).

export const EMPTY_DOC: RichDoc = { type: "doc", content: [] };

interface RichNode {
  type?: unknown;
  text?: unknown;
  attrs?: Record<string, unknown>;
  marks?: { type?: unknown; attrs?: Record<string, unknown> }[];
  content?: unknown;
}

const NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "image",
]);
const MARK_TYPES = new Set(["bold", "italic", "strike", "code", "link"]);
const MAX_DEPTH = 12;
const MAX_NODES = 20000;
export const MAX_DOC_BYTES = 400_000;

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const LINK_RE = /^(https?:\/\/|mailto:)/i;
const IMAGE_RE = /^https?:\/\//i;

/** Returns a human-readable problem, or null when the document is safe to store and render. */
export function validateDoc(doc: unknown): string | null {
  if (!doc || typeof doc !== "object" || (doc as RichNode).type !== "doc") return "Invalid content";
  try {
    if (JSON.stringify(doc).length > MAX_DOC_BYTES) return "This document is too large";
  } catch {
    return "Invalid content";
  }
  let count = 0;

  const walk = (node: RichNode, depth: number): string | null => {
    if (++count > MAX_NODES) return "This document is too large";
    // Defence in depth against prototype-pollution payloads (e.g. an own "__proto__" attribute) in stored documents.
    for (const key of Object.keys(node)) if (FORBIDDEN_KEYS.has(key)) return "Invalid content";
    if (node.attrs && typeof node.attrs === "object") for (const key of Object.keys(node.attrs)) if (FORBIDDEN_KEYS.has(key)) return "Invalid content";
    for (const mark of node.marks ?? []) {
      if (mark && typeof mark === "object") {
        for (const key of Object.keys(mark)) if (FORBIDDEN_KEYS.has(key)) return "Invalid content";
        if (mark.attrs && typeof mark.attrs === "object") for (const key of Object.keys(mark.attrs)) if (FORBIDDEN_KEYS.has(key)) return "Invalid content";
      }
    }
    if (depth > MAX_DEPTH) return "Content is nested too deeply";
    if (typeof node.type !== "string" || !NODE_TYPES.has(node.type)) return `Unsupported content (${String(node.type)})`;
    if (node.type === "text" && typeof node.text !== "string") return "Invalid content";
    if (node.type === "image") {
      const src = node.attrs?.src;
      if (typeof src !== "string" || !IMAGE_RE.test(src) || src.length > 2000) return "Images must use an http(s) URL";
    }
    for (const mark of node.marks ?? []) {
      if (typeof mark.type !== "string" || !MARK_TYPES.has(mark.type)) return "Unsupported formatting";
      if (mark.type === "link") {
        const href = mark.attrs?.href;
        if (typeof href !== "string" || !LINK_RE.test(href) || href.length > 2000) return "Links must start with http://, https:// or mailto:";
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) return "Invalid content";
      for (const child of node.content) {
        if (!child || typeof child !== "object") return "Invalid content";
        const problem = walk(child as RichNode, depth + 1);
        if (problem) return problem;
      }
    }
    return null;
  };

  return walk(doc as RichNode, 0);
}

export function docToPlainText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (node: RichNode) => {
    if (node.type === "text" && typeof node.text === "string") parts.push(node.text);
    if (node.type === "hardBreak") parts.push("\n");
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child as RichNode);
      if (["paragraph", "heading", "listItem", "blockquote", "codeBlock"].includes(String(node.type))) parts.push("\n");
    }
  };
  if (doc && typeof doc === "object") walk(doc as RichNode);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function countWords(plainText: string): number {
  const t = plainText.trim();
  return t ? t.split(/\s+/).length : 0;
}

export const readingMinutes = (words: number) => Math.max(1, Math.ceil(words / 200));

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "untitled"
  );
}

export interface HeadingInfo {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Headings (h2/h3) in document order with unique, URL-safe ids: used for anchors and the table of contents. */
export function extractHeadings(doc: unknown): HeadingInfo[] {
  const out: HeadingInfo[] = [];
  const used = new Map<string, number>();
  const textOf = (node: RichNode): string =>
    node.type === "text" && typeof node.text === "string" ? node.text : Array.isArray(node.content) ? node.content.map((c) => textOf(c as RichNode)).join("") : "";
  const walk = (node: RichNode) => {
    if (node.type === "heading") {
      const text = textOf(node).trim();
      if (text) {
        const base = slugify(text);
        const n = (used.get(base) ?? 0) + 1;
        used.set(base, n);
        out.push({ id: n === 1 ? base : `${base}-${n}`, text, level: Number(node.attrs?.level) === 3 ? 3 : 2 });
      }
      return;
    }
    if (Array.isArray(node.content)) for (const child of node.content) walk(child as RichNode);
  };
  if (doc && typeof doc === "object") walk(doc as RichNode);
  return out;
}
