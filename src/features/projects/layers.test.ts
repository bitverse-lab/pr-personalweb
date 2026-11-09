import { expect, test } from "vitest";
import { currentRole, layerSet, layersOf } from "./layers";

const skills = [
  { name: "postgresql", category: "Data" },
  { name: "FastAPI", category: "API" },
  { name: "PyTorch", category: "ML" },
  { name: "Docker", category: null },
  { name: "Pandas", category: "Data" },
];

test("a project's layers are the categories of the owner's skills it uses, in skill order", () => {
  expect(layersOf(["PyTorch", "PostgreSQL", "FastAPI"], skills)).toEqual(["data", "api", "ml"]);
});

test("technologies the owner has no skill for, and skills without a category, add no layer", () => {
  expect(layersOf(["Rust", "Docker"], skills)).toEqual([]);
  expect(layersOf([], skills)).toEqual([]);
});

test("two skills in one category give that layer once", () => {
  expect(layersOf(["Pandas", "PostgreSQL"], skills)).toEqual(["data"]);
});

test("layerSet is the union over projects, in skill order", () => {
  expect(layerSet([{ technologies: ["PyTorch"] }, { technologies: ["FastAPI", "Pandas"] }, { technologies: ["Rust"] }], skills)).toEqual(["api", "ml", "data"]);
});

test("the current role is the experience with no end date", () => {
  const exp = [
    { role: "Lecturer Assistant", company: "Telkom University", current: false },
    { role: "Full Stack Engineer", company: "Nusantara Data Labs", current: true },
  ];
  expect(currentRole(exp)).toEqual({ role: "Full Stack Engineer", company: "Nusantara Data Labs" });
  expect(currentRole([exp[0]])).toBeNull();
});
