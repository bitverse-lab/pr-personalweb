import type { ReactNode } from "react";
import type { RichDoc } from "@/db/schema/content";
import { extractHeadings } from "@/features/content/richtext";

// Renders stored Tiptap JSON as React elements (never as raw HTML). Only whitelisted nodes and marks
// are handled, and link/image URLs are re-checked here as a second line of defence after write-time validation.

interface Node {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: Node[];
}

const LINK_RE = /^(https?:\/\/|mailto:)/i;
const IMAGE_RE = /^https?:\/\//i;

function renderText(node: Node, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "code") out = <code>{out}</code>;
    else if (mark.type === "link") {
      const href = mark.attrs?.href;
      if (typeof href === "string" && LINK_RE.test(href)) {
        out = (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow">
            {out}
          </a>
        );
      }
    }
  }
  return <span key={key}>{out}</span>;
}

// Headings receive the ids from extractHeadings, in document order, so table-of-contents links land on them.
interface Ctx {
  ids: string[];
  next: number;
}

function renderChildren(nodes: Node[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes ?? []).map((child, i) => renderNode(child, i, ctx));
}

function renderNode(node: Node, key: number, ctx: Ctx): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "paragraph":
      return <p key={key}>{renderChildren(node.content, ctx)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level);
      const children = renderChildren(node.content, ctx);
      const hasText = (node.content ?? []).some((c) => (c.text ?? "").trim());
      const id = hasText ? ctx.ids[ctx.next++] : undefined;
      if (level === 3) return <h3 key={key} id={id}>{children}</h3>;
      return <h2 key={key} id={id}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content, ctx)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node.content, ctx)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node.content, ctx)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content, ctx)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{(node.content ?? []).map((c) => c.text ?? "").join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = node.attrs?.src;
      if (typeof src !== "string" || !IMAGE_RE.test(src)) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} loading="lazy" />;
    }
    default:
      return null;
  }
}

export default function RichTextRenderer({ doc, className = "" }: { doc: RichDoc; className?: string }) {
  const ctx: Ctx = { ids: extractHeadings(doc).map((h) => h.id), next: 0 };
  return <div className={`rich-render ${className}`.trim()}>{renderChildren((doc as Node).content, ctx)}</div>;
}
