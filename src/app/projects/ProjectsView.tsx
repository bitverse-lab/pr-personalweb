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
import { useDict, useLocale, useLocalize } from "@/lib/i18n/context";

/** /projects: every published case study, filterable by the layers the owner built. */
export default function ProjectsView({ projects, skills }: { projects: Project[]; skills: LayerSkill[] }) {
  const locale = useLocale();
  const t = useDict().work;
  const loc = useLocalize();
  const [layer, setLayer] = useState<string | null>(null);
  const layers = layerSet(projects, skills);
  const shown = layer ? projects.filter((p) => layersOf(p.technologies, skills).includes(layer)) : projects;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head" id="hero">
          <div className="container">
            <h1 className="page-head-title">{t.pageTitle}</h1>
            <p className="path-label mt-3 mb-0" data-testid="work-meta">
              ~/work · {t.projects(projects.length)} · {t.layers(layers.length)}
            </p>
            {layers.length > 0 && (
              <div className="layer-filter" role="group" aria-label={t.filterAria}>
                <button type="button" className="layer-chip" aria-pressed={layer === null} onClick={() => setLayer(null)}>{t.allChip}</button>
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
              <EmptyState icon={FiFolder} title={t.empty} description={t.emptyBody} />
            </div>
          </section>
        ) : (
          <SelectedWork projects={shown} skills={skills} title={layer ? t.builtWith(layer) : t.all} locale={locale} />
        )}

        <section className="section pt-0">
          <div className="container">
            <p className="page-cta">
              {t.cta} <Link href={loc("/contact")}>{t.ctaLink}</Link>
            </p>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
