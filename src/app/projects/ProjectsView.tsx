"use client";

import { useState } from "react";
import Link from "next/link";
import { FiFolder } from "react-icons/fi";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import EmptyState from "@/components/shared/EmptyState";
import SelectedWork from "@/components/home/SelectedWork";
import { layerSet, layersOf, type LayerSkill } from "@/features/projects/layers";
import type { Project } from "@/features/projects/format";

/** /projects: every published case study, filterable by the layers the owner built. */
export default function ProjectsView({ projects, skills }: { projects: Project[]; skills: LayerSkill[] }) {
  const [layer, setLayer] = useState<string | null>(null);
  const layers = layerSet(projects, skills);
  const shown = layer ? projects.filter((p) => layersOf(p.technologies, skills).includes(layer)) : projects;
  const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head" id="hero">
          <div className="container">
            <h1 className="page-head-title">Things I shipped, by the layers I built.</h1>
            <p className="path-label mt-3 mb-0" data-testid="work-meta">
              ~/work · {count(projects.length, "project")} · {count(layers.length, "layer")}
            </p>
            {layers.length > 0 && (
              <div className="layer-filter" role="group" aria-label="Filter by layer">
                <button type="button" className="layer-chip" aria-pressed={layer === null} onClick={() => setLayer(null)}>all</button>
                {layers.map((l) => (
                  <button key={l} type="button" className={`layer-chip ${l === "ml" || l === "model" ? "layer-chip--ml" : ""}`} aria-pressed={layer === l} onClick={() => setLayer(layer === l ? null : l)}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {projects.length === 0 ? (
          <section className="section">
            <div className="container">
              <EmptyState icon={FiFolder} title="No projects published yet" description="Check back soon — new work will show up here." />
            </div>
          </section>
        ) : (
          <SelectedWork projects={shown} skills={skills} title={layer ? `Built with ${layer}` : "All work"} />
        )}

        <section className="section pt-0">
          <div className="container">
            <p className="page-cta">
              Something here close to what you need? <Link href="/contact">Tell me about it →</Link>
            </p>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
