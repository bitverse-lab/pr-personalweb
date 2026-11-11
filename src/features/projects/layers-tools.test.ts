import { describe, expect, it } from "vitest";
import { allLayers, toolsByLayer } from "./layers";

const skills = [
  { name: "PostgreSQL", category: "data" },
  { name: "FastAPI", category: "api" },
  { name: "React", category: "ui" },
  { name: "PyTorch", category: "ml" },
  { name: "Pandas", category: "data" },
  { name: "Figma", category: null },
];

describe("layers for the pipeline", () => {
  it("lists every layer once, in skill order", () => {
    expect(allLayers(skills)).toEqual(["data", "api", "ui", "ml"]);
  });

  it("groups a project's technologies by layer and ignores unknown ones", () => {
    expect(toolsByLayer(["pytorch", "PostgreSQL", "Pandas", "Docker"], skills)).toEqual({ ml: ["pytorch"], data: ["PostgreSQL", "Pandas"] });
  });
});
