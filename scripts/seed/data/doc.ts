import type { RichDoc } from "../../../src/db/schema/content";
import { countWords, docToPlainText } from "../../../src/features/content/richtext";

export type Block = ["h2" | "h3" | "p" | "quote" | "code", string] | ["ul", string[]];

const text = (t: string) => [{ type: "text", text: t }];
const para = (t: string) => ({ type: "paragraph", content: text(t) });

/** Tiptap JSON from a compact block list, using only node types `validateDoc` accepts. */
export function doc(blocks: Block[]): RichDoc {
  return {
    type: "doc",
    content: blocks.map(([kind, value]) => {
      switch (kind) {
        case "h2":
        case "h3":
          return { type: "heading", attrs: { level: kind === "h2" ? 2 : 3 }, content: text(value) };
        case "quote":
          return { type: "blockquote", content: [para(value)] };
        case "code":
          return { type: "codeBlock", content: text(value) };
        case "ul":
          return { type: "bulletList", content: value.map((item) => ({ type: "listItem", content: [para(item)] })) };
        default:
          return para(value);
      }
    }),
  };
}

/** The derived columns the services fill on every save. */
export function derived(content: RichDoc) {
  const plainText = docToPlainText(content);
  return { content, plainText, wordCount: countWords(plainText) };
}
