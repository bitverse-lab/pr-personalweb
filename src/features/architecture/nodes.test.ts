import { describe, expect, it } from "vitest";
import { ARCH_NODES } from "./nodes";
import { excerpt } from "./excerpt";

describe("architecture nodes", () => {
  it.each(ARCH_NODES)("$id quotes code that still exists", (node) => {
    const found = excerpt(node.source.file, node.source.marker, node.source.lines);
    expect(found, `${node.source.marker} in ${node.source.file}`).not.toBeNull();
    expect(found!.code).toContain(node.source.marker);
    expect(found!.code.split("\n")).toHaveLength(node.source.lines);
  });

  it("returns null for a missing marker or file", () => {
    expect(excerpt("src/db/index.ts", "no such line anywhere", 3)).toBeNull();
    expect(excerpt("src/nope.ts", "x", 1)).toBeNull();
  });
});
