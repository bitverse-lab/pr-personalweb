import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import { allLayers, layersOf, toolsByLayer, type LayerSkill } from "@/features/projects/layers";
import type { Project } from "@/features/projects/format";
import { vt } from "@/lib/view-transition";
import { dict } from "@/lib/i18n/dict";
import { localize, type Locale } from "@/lib/i18n/locale";

/**
 * The owner's full stack as one pipeline (data → api → ui → ml → ops), with the layers this
 * project touched lit. The featured card also names the tools used at each layer. On hover a pulse
 * runs along the lit path. Every value comes from the project's technologies and the skill list.
 */
function Pipeline({ layers, used, tools, label }: { layers: string[]; used: string[]; tools?: Record<string, string[]>; label: string }) {
  if (layers.length < 2 || used.length === 0) return null;
  return (
    <div className={`pipe ${tools ? "pipe--lg" : ""}`} aria-label={label} role="img">
      <div className="pipe-track" aria-hidden="true">
        <span className="pipe-flow" />
      </div>
      <ol className="pipe-nodes" aria-hidden="true">
        {layers.map((l) => {
          const on = used.includes(l);
          return (
            <li key={l} className={`pipe-node ${on ? "is-on" : ""} ${l === "ml" || l === "model" ? "pipe-node--ml" : ""}`}>
              <span className="pipe-dot" />
              <span className="pipe-name">{l}</span>
              {tools && on && tools[l] && <span className="pipe-tools">{tools[l].join(" · ")}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * One featured case study large, the rest smaller — never a uniform grid. Each card carries its
 * derived layers (data-layers) so the hero console can light the projects that use a layer.
 */
export default function SelectedWork({ projects, skills, title, query, children, locale = "en" }: { projects: Project[]; skills: LayerSkill[]; title?: string; query?: { sql: string; ms: number }; children?: React.ReactNode; locale?: Locale }) {
  if (projects.length === 0) return null;
  const t = dict(locale).work;
  const stack = allLayers(skills);
  return (
    <section className="section selected-work" id="work" aria-labelledby="work-title">
      <div className="container">
        <header className="selected-work-head">
          <h2 id="work-title" className="selected-work-title">
            {title ?? t.selected} <span className="selected-work-filter path-label" data-filter-label aria-live="polite" />
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
            const featured = i === 0;
            return (
              <article key={p.id} id={`case-${p.slug}`} data-case data-featured={p.featured ? "" : undefined} data-layers={layers.join(" ")} className={`case ${featured ? "case--featured" : ""}`}>
                <CoverBlock src={p.image} title={p.name} ratio={featured ? "16/9" : "16/9"} compact={!featured} vtStyle={vt("cover", p.slug)} />
                <div className="case-body">
                  <Pipeline layers={stack} used={layers} tools={featured ? toolsByLayer(p.technologies, skills) : undefined} label={t.layersAria(layers.join(", "))} />
                  <h3 className="case-title" tabIndex={-1} style={vt("title", p.slug)}>
                    <Link href={localize(locale, `/projects/${p.slug}`)} className="stretched-link" data-vt>{p.name}</Link>
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
