import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import { layersOf, type LayerSkill } from "@/features/projects/layers";
import type { Project } from "@/features/projects/format";
import { vt } from "@/lib/view-transition";

/**
 * One featured case study large, the rest smaller — never a uniform grid. Each card carries its
 * derived layers (data-layers) so the hero console can light the projects that use a layer.
 */
export default function SelectedWork({ projects, skills, title = "Selected work", query, children }: { projects: Project[]; skills: LayerSkill[]; title?: string; query?: { sql: string; ms: number }; children?: React.ReactNode }) {
  if (projects.length === 0) return null;
  return (
    <section className="section selected-work" id="work" aria-labelledby="work-title">
      <div className="container">
        <header className="selected-work-head">
          <h2 id="work-title" className="selected-work-title">
            {title} <span className="selected-work-filter path-label" data-filter-label aria-live="polite" />
          </h2>
          {/* The read that produced this section: real SQL shape, real row count, real time. */}
          {query && (
            <p className="section-query">
              <code className="section-query-sql">{query.sql}</code>
              <span className="section-query-result">
                → {projects.length} row{projects.length === 1 ? "" : "s"} · {query.ms} ms
              </span>
            </p>
          )}
          {children}
        </header>
        <div className="cases">
          {projects.map((p, i) => {
            const layers = layersOf(p.technologies, skills);
            return (
              <article key={p.id} id={`case-${p.slug}`} data-case data-featured={p.featured ? "" : undefined} data-layers={layers.join(" ")} className={`case ${i === 0 ? "case--featured" : ""}`}>
                <CoverBlock src={p.image} title={p.name} ratio={i === 0 ? "16/10" : "16/9"} compact={i !== 0} vtStyle={vt("cover", p.slug)} />
                <div className="case-body">
                  {layers.length > 0 && (
                    <div className="case-layers" aria-label="Layers I built">
                      {layers.map((l) => (
                        <span key={l} className={`layer-chip ${l === "ml" || l === "model" ? "layer-chip--ml" : ""}`}>{l}</span>
                      ))}
                    </div>
                  )}
                  <h3 className="case-title" tabIndex={-1} style={vt("title", p.slug)}>
                    <Link href={`/projects/${p.slug}`} className="stretched-link" data-vt>{p.name}</Link>
                  </h3>
                  {p.summary && <p className="case-summary">{p.summary}</p>}
                  {p.outcome && <p className="case-outcome">{p.outcome}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
