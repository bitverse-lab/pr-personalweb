import { readFileSync } from "node:fs";
import path from "node:path";

/** `lines` lines of a repository file, starting at the first line containing `marker`; null if absent. */
export function excerpt(file: string, marker: string, lines: number): { code: string; line: number } | null {
  let text: string;
  try {
    text = readFileSync(path.join(process.cwd(), file), "utf8");
  } catch {
    return null;
  }
  const all = text.split(/\r?\n/);
  const at = all.findIndex((l) => l.includes(marker));
  if (at < 0) return null;
  const chunk = all.slice(at, at + lines);
  // Drop the shared indentation so a method reads at the left margin.
  const indent = Math.min(...chunk.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return { code: chunk.map((l) => l.slice(indent)).join("\n"), line: at + 1 };
}
