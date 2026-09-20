import { describe, expect, it } from "vitest";
import { countWords, docToPlainText, extractHeadings, readingMinutes, slugify, validateDoc } from "./richtext";

const p = (text: string, marks?: unknown[]) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });
const doc = (...content: unknown[]) => ({ type: "doc", content });

describe("validateDoc", () => {
  it("accepts ordinary rich text", () => {
    expect(validateDoc(doc(p("hello"), { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] }))).toBeNull();
    expect(validateDoc(doc())).toBeNull();
  });

  it("rejects things that are not documents", () => {
    for (const bad of [null, undefined, "text", 42, { type: "paragraph" }, {}]) expect(validateDoc(bad)).not.toBeNull();
  });

  it("accepts http(s) and mailto links, rejects script-capable schemes", () => {
    const link = (href: string) => doc(p("x", [{ type: "link", attrs: { href } }]));
    expect(validateDoc(link("https://example.com"))).toBeNull();
    expect(validateDoc(link("mailto:a@b.co"))).toBeNull();
    expect(validateDoc(link("javascript:alert(1)"))).not.toBeNull();
    expect(validateDoc(link("JaVaScRiPt:alert(1)"))).not.toBeNull();
    expect(validateDoc(link("data:text/html;base64,AAAA"))).not.toBeNull();
    expect(validateDoc(link("//evil.example"))).not.toBeNull();
  });

  it("only accepts http(s) images", () => {
    expect(validateDoc(doc({ type: "image", attrs: { src: "https://cdn.example.com/a.png" } }))).toBeNull();
    expect(validateDoc(doc({ type: "image", attrs: { src: "data:image/png;base64,AAA" } }))).not.toBeNull();
    expect(validateDoc(doc({ type: "image", attrs: { src: "javascript:1" } }))).not.toBeNull();
    expect(validateDoc(doc({ type: "image", attrs: {} }))).not.toBeNull();
  });

  it("rejects unknown nodes and marks", () => {
    expect(validateDoc(doc({ type: "script", content: [] }))).toMatch(/Unsupported/);
    expect(validateDoc(doc(p("x", [{ type: "underlineHack" }])))).toMatch(/Unsupported/);
  });

  it("rejects prototype-pollution keys anywhere in the document", () => {
    const own = (o: object) => JSON.parse(`{"__proto__": ${JSON.stringify(o)}}`);
    expect(validateDoc(doc({ type: "paragraph", attrs: own({ onerror: "x" }), content: [] }))).not.toBeNull();
    expect(validateDoc(doc({ type: "image", attrs: { src: "https://a.co/x.png", constructor: "x" } }))).not.toBeNull();
    expect(validateDoc(doc(p("x", [{ type: "link", attrs: { href: "https://a.co", ...own({ a: 1 }) } }])))).not.toBeNull();
    expect(validateDoc(JSON.parse('{"type":"doc","content":[{"type":"paragraph","__proto__":{"x":1}}]}'))).not.toBeNull();
    expect(validateDoc(doc(p("perfectly normal")))).toBeNull();
  });

  it("rejects absurdly nested or huge documents", () => {
    let nested: unknown = p("deep");
    for (let i = 0; i < 20; i++) nested = { type: "blockquote", content: [nested] };
    expect(validateDoc(doc(nested))).toMatch(/nested/i);
    expect(validateDoc(doc(p("x".repeat(500_000))))).toMatch(/too large/i);
  });
});

describe("text helpers", () => {
  it("extracts plain text with paragraph breaks", () => {
    const d = doc(p("one two"), { type: "bulletList", content: [{ type: "listItem", content: [p("three")] }] });
    expect(docToPlainText(d)).toBe("one two\nthree");
    expect(docToPlainText(null)).toBe("");
  });

  it("counts words and reading time", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  one   two\nthree ")).toBe(3);
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(200)).toBe(1);
    expect(readingMinutes(201)).toBe(2);
  });

  it("makes clean URL slugs", () => {
    expect(slugify("My First Post!")).toBe("my-first-post");
    expect(slugify("  Café — Déjà Vu  ")).toBe("cafe-deja-vu");
    expect(slugify("../../etc/passwd")).toBe("etc-passwd");
    expect(slugify("???")).toBe("untitled");
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("extractHeadings", () => {
  const h = (level: number, text: string) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text }] });

  it("lists h2/h3 in order with url-safe ids", () => {
    const out = extractHeadings(doc(h(2, "Getting Started"), p("x"), h(3, "Install & Run"), h(2, "Résumé")));
    expect(out).toEqual([
      { id: "getting-started", text: "Getting Started", level: 2 },
      { id: "install-run", text: "Install & Run", level: 3 },
      { id: "resume", text: "Résumé", level: 2 },
    ]);
  });

  it("keeps ids unique when headings repeat", () => {
    const ids = extractHeadings(doc(h(2, "Notes"), h(2, "Notes"), h(3, "Notes"))).map((x) => x.id);
    expect(ids).toEqual(["notes", "notes-2", "notes-3"]);
  });

  it("finds headings nested in quotes and lists, skips empty ones, and copes with junk", () => {
    const nested = doc({ type: "blockquote", content: [h(2, "Inside")] }, h(2, "   "));
    expect(extractHeadings(nested).map((x) => x.text)).toEqual(["Inside"]);
    expect(extractHeadings(null)).toEqual([]);
    expect(extractHeadings("nope")).toEqual([]);
  });
});
