"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiArchive, FiArrowLeft, FiExternalLink, FiGlobe, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { deleteProject, restoreProject, saveProject, setProjectFeatured, setProjectStatus } from "@/features/projects/actions";
import { docToPlainText, slugify } from "@/features/content/richtext";
import { projectPeriod } from "@/features/projects/format";
import { useAutosave } from "@/hooks/useAutosave";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import { useToast } from "@/components/shared/ToastProvider";
import ArticleStatusBadge from "@/components/me/content/ArticleStatusBadge";
import { SaveIndicator } from "@/components/me/content/ArticleEditor";
import RichEditor from "@/components/me/content/RichEditor";
import TagInput from "@/components/me/content/TagInput";
import GalleryEditor, { type GalleryEntry } from "./GalleryEditor";
import type { RichDoc } from "@/db/schema/content";
import type { ProjectDetail } from "@/server/services/project-service";

const monthValue = (d: string | null) => (d ? d.slice(0, 7) : "");
const monthToDate = (m: string) => (m ? `${m}-01` : "");

interface LinkRow {
  label: string;
  url: string;
}

export default function ProjectEditor({ project, categorySuggestions, techSuggestions }: { project: ProjectDetail; categorySuggestions: string[]; techSuggestions: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(!project.slug.startsWith("draft-"));
  const [savedSlug, setSavedSlug] = useState(project.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [summary, setSummary] = useState(project.summary ?? "");
  const [outcome, setOutcome] = useState(project.outcome ?? "");
  const [category, setCategory] = useState(project.category ?? "");
  const [client, setClient] = useState(project.client ?? "");
  const [role, setRole] = useState(project.role ?? "");
  const [location, setLocation] = useState(project.location ?? "");
  const [start, setStart] = useState(monthValue(project.startDate));
  const [end, setEnd] = useState(monthValue(project.endDate));
  const [technologies, setTechnologies] = useState(project.technologies);
  const [doc, setDoc] = useState<RichDoc>(project.content);
  const [gallery, setGallery] = useState<GalleryEntry[]>(project.gallery.map((g) => ({ mediaId: g.mediaId, url: g.url, caption: g.caption ?? "" })));
  const [coverMediaId, setCoverMediaId] = useState<string | null>(project.coverMediaId);
  const [links, setLinks] = useState<LinkRow[]>(project.links);
  const [status, setStatus] = useState(project.status);
  const [featured, setFeatured] = useState(project.featured);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const period = useMemo(() => projectPeriod(monthToDate(start) || null, monthToDate(end) || null), [start, end]);
  const hasStory = useMemo(() => docToPlainText(doc).trim().length > 0, [doc]);

  const payload = useMemo(
    () => ({
      id: project.id,
      title,
      slug,
      slugAuto: !slugTouched,
      summary,
      outcome,
      category,
      client,
      role,
      location,
      startDate: monthToDate(start),
      endDate: monthToDate(end),
      technologies,
      content: doc,
      coverMediaId: coverMediaId && gallery.some((g) => g.mediaId === coverMediaId) ? coverMediaId : null,
      gallery: gallery.map((g) => ({ mediaId: g.mediaId, caption: g.caption })),
      // half-filled rows are kept on screen but not sent until both fields are filled
      links: links
        .filter((l) => l.label.trim() && l.url.trim())
        // "github.com/me/x" is what people type; without a scheme the whole project used to stop saving.
        .map((l) => ({ label: l.label, url: /^https?:\/\//i.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}` })),
    }),
    [project.id, title, slug, slugTouched, summary, outcome, category, client, role, location, start, end, technologies, doc, coverMediaId, gallery, links]
  );
  const { status: saveStatus, error, flush, savedAt } = useAutosave(payload, async (p) => {
    const result = await saveProject(p);
    if (!result.ok) return result.error;
    const sent = slugify(p.slug);
    // The server numbered a clashing automatic slug; show it, unless the title moved on meanwhile.
    if (result.data.slug !== sent) setSlug((current) => (slugify(current) === sent ? result.data.slug : current));
    setSavedSlug(result.data.slug);
    setSlugError(result.data.slugError);
    return null;
  });

  // Ctrl/Cmd+S saves now instead of opening the browser's "Save page" dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  const onTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(value.trim() ? slugify(value) : slug);
  };

  const changeStatus = (next: "draft" | "published" | "archived") =>
    startTransition(async () => {
      // persist first (waiting for any autosave in flight) so the published version is what is on screen
      const problem = await flush();
      if (problem) return toast.error(`Could not save first: ${problem}`);
      const result = await setProjectStatus({ id: project.id, status: next });
      if (!result.ok) return toast.error(result.error);
      setStatus(result.data.status);
      setSavedSlug(result.data.slug);
      setSlugTouched(true);
      toast.success(next === "published" ? "Published — it is now live on your site" : next === "archived" ? "Project archived" : "Moved back to drafts");
    });

  const toggleFeatured = () =>
    startTransition(async () => {
      const result = await setProjectFeatured({ id: project.id, featured: !featured });
      if (!result.ok) return toast.error(result.error);
      setFeatured(result.data.featured);
      toast.success(result.data.featured ? "Featured on your home page" : "Removed from featured");
    });

  const remove = () =>
    startTransition(async () => {
      await flush();
      const result = await deleteProject(project.id);
      setConfirmDelete(false);
      if (!result.ok) return toast.error(result.error);
      const snapshot = result.data;
      toast.success("Project deleted", { action: { label: "Undo", onClick: () => void restoreProject(snapshot).then((r) => (r.ok ? toast.success("Project restored") : toast.error(r.error))) } });
      router.push("/me/projects");
    });

  const field = (id: string, label: string, value: string, set: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="col-md-6">
      <label className="form-label small mb-1" htmlFor={id}>{label}</label>
      <input id={id} className="form-control form-control-sm" value={value} onChange={(e) => set(e.target.value)} {...props} />
    </div>
  );

  return (
    <>
      <h1 className="visually-hidden">Edit project: {title.trim() || "Untitled project"}</h1>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link href="/me/projects" className="text-muted small d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> All projects
        </Link>
        <div className="d-flex align-items-center gap-3">
          <span title="Ctrl+S saves right away">
            <SaveIndicator status={saveStatus} error={error} savedAt={savedAt} onRetry={() => void flush()} />
          </span>
          <div className="btn-group btn-group-sm" role="group" aria-label="Editor mode">
            <button type="button" className={`btn ${!preview ? "btn-primary" : "btn-outline-primary"}`} aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
            <button type="button" className={`btn ${preview ? "btn-primary" : "btn-outline-primary"}`} aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className={preview ? "col-12" : "col-lg-8"}>
          {preview ? (
            <article className="card rounded shadow-sm">
              <div className="card-body">
                <header className="text-center mb-4">
                  <h2 className="h3 mb-3">{title || "Untitled project"}</h2>
                  {summary.trim() && <p className="text-muted mx-auto mb-2" style={{ maxWidth: 640 }}>{summary}</p>}
                  {period && <p className="text-muted small mb-0">{period}</p>}
                </header>
                <div className="row">
                  <div className="col-lg-8 col-md-7">
                    {gallery.length > 0 ? (
                      gallery.map((image, index) => (
                        <figure className={index > 0 ? "mt-4 mb-0" : "mb-0"} key={image.mediaId}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.url} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="img-fluid rounded shadow" alt={image.caption || `${title || "Project"} — image ${index + 1}`} />
                          {image.caption && <figcaption className="text-muted small mt-2">{image.caption}</figcaption>}
                        </figure>
                      ))
                    ) : (
                      <p className="text-muted small">No project images added yet.</p>
                    )}
                    {hasStory ? (
                      <section className="mt-4 pt-2">
                        <h3 className="h5 mb-3">About this project</h3>
                        <RichTextRenderer doc={doc} />
                      </section>
                    ) : (
                      <p className="text-muted">No case study content yet.</p>
                    )}
                  </div>
                  <aside className="col-lg-4 col-md-5 mt-4 mt-md-0">
                    <div className="widget">
                      <h3 className="h6 widget-title font-weight-bold pt-2 pb-2 bg-light rounded text-center">Project Details</h3>
                      <dl className="row mb-0 mt-4">
                        {[
                          ...(client.trim() ? [{ label: "Client", value: client.trim() }] : []),
                          ...(role.trim() ? [{ label: "Role", value: role.trim() }] : []),
                          ...(category.trim() ? [{ label: "Category", value: category.trim() }] : []),
                          ...(period ? [{ label: "Date", value: period }] : []),
                          ...(location.trim() ? [{ label: "Location", value: location.trim() }] : []),
                          ...(technologies.length ? [{ label: "Technologies", value: technologies.join(", ") }] : []),
                        ].map((row) => (
                          <Fragment key={row.label}>
                            <dt className="col-md-4 fw-medium col-5">{row.label} :</dt>
                            <dd className="col-md-8 col-7 text-muted">{row.value}</dd>
                          </Fragment>
                        ))}
                        {links.filter((link) => link.label.trim() && link.url.trim()).map((link, index) => {
                          const href = /^https?:\/\//i.test(link.url.trim()) ? link.url.trim() : null;
                          return (
                            <Fragment key={`${link.label}-${index}`}>
                              <dt className="col-md-4 fw-medium col-5">{link.label.trim()} :</dt>
                              <dd className="col-md-8 col-7 text-muted">
                                {href ? <a href={href} target="_blank" rel="noopener noreferrer">{href.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : link.url.trim()}
                              </dd>
                            </Fragment>
                          );
                        })}
                      </dl>
                    </div>
                    {technologies.length > 0 && (
                      <div className="widget mt-4 pt-2 text-center">
                        <h3 className="h6 widget-title font-weight-bold pt-2 pb-2 bg-light rounded">Built with</h3>
                        <div className="tagcloud text-center mt-4">
                          {technologies.map((technology) => <span className="badge bg-soft-primary text-primary m-1" key={technology}>{technology}</span>)}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </article>
          ) : null}
          {/* Kept mounted while previewing: unmounting it lost the case study and its undo history. */}
          <div className={preview ? "d-none" : undefined}>
              <input className="form-control form-control-lg fw-semibold mb-3" placeholder="Project title" aria-label="Project title" maxLength={120} value={title} onChange={(e) => onTitle(e.target.value)} />

              <div className="card rounded shadow-sm mb-3">
                <div className="card-body">
                  <label className="form-label small mb-1" htmlFor="p-summary">Short summary</label>
                  <textarea id="p-summary" className="form-control" rows={2} maxLength={300} placeholder="One or two sentences shown on cards and in your CV" value={summary} onChange={(e) => setSummary(e.target.value)} />
                  <div className="form-text">{summary.length}/300</div>
                </div>
              </div>

              <div className="card rounded shadow-sm mb-3">
                <div className="card-body">
                  <h6 className="mb-2">Case study</h6>
                  <p className="text-muted small">Explain the problem, your approach, the architecture and the results. Headings, lists, code blocks and images all work.</p>
                  <RichEditor initial={project.content} onChange={setDoc} placeholder="What was the problem, and how did you solve it?" minHeight={320} />
                </div>
              </div>

              <div className="card rounded shadow-sm">
                <div className="card-body">
                  <h6 className="mb-3">Images</h6>
                  <GalleryEditor items={gallery} coverMediaId={coverMediaId} onChange={setGallery} onCoverChange={setCoverMediaId} />
                </div>
              </div>
          </div>
        </div>

        {!preview && <div className="col-lg-4">
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Publishing</h6>
                <ArticleStatusBadge status={status} />
              </div>
              <div className="d-grid gap-2">
                {status !== "published" ? (
                  <button type="button" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-1" disabled={isPending} onClick={() => changeStatus("published")}>
                    <FiGlobe /> Publish
                  </button>
                ) : (
                  <>
                    <Link href={`/projects/${savedSlug}`} target="_blank" className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1">
                      <FiExternalLink /> View on site
                    </Link>
                    <button type="button" className="btn btn-outline-secondary" disabled={isPending} onClick={() => changeStatus("draft")}>Unpublish (back to draft)</button>
                  </>
                )}
                <button type="button" className={`btn btn-sm ${featured ? "btn-warning" : "btn-outline-secondary"}`} aria-pressed={featured} disabled={isPending} onClick={toggleFeatured}>
                  {featured ? "★ Featured on home page" : "☆ Feature on home page"}
                </button>
                {status !== "archived" && (
                  <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center gap-1" disabled={isPending} onClick={() => changeStatus("archived")}>
                    <FiArchive /> Archive
                  </button>
                )}
                <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1" onClick={() => setConfirmDelete(true)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
              {status === "published" && <p className="text-muted small mt-3 mb-0">Changes are published as soon as they save.</p>}
            </div>
          </div>

          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-3">Details</h6>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="p-slug">URL slug</label>
                <div className="input-group input-group-sm has-validation">
                  <span className="input-group-text">/projects/</span>
                  <input id="p-slug" className={`form-control${slugError ? " is-invalid" : ""}`} maxLength={120} value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} onBlur={() => setSlug(slugify(slug))} />
                  {slugError && <div className="invalid-feedback">{slugError}. The project keeps /projects/{savedSlug} until you pick another.</div>}
                </div>
                {status === "published" && <div className="form-text">Changing the slug of a published project changes its public link.</div>}
              </div>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="p-outcome">Outcome</label>
                <input id="p-outcome" className="form-control form-control-sm" maxLength={140} placeholder="e.g. 7% median error · 40 cooperatives" value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-describedby="p-outcome-help" />
                <div id="p-outcome-help" className="form-text">One line of measurable result. Shown on project cards and on your home page.</div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label small mb-1" htmlFor="p-category">Category</label>
                  <input id="p-category" list="p-category-list" className="form-control form-control-sm" maxLength={40} placeholder="e.g. Web app" value={category} onChange={(e) => setCategory(e.target.value)} />
                  <datalist id="p-category-list">{categorySuggestions.map((c) => (<option key={c} value={c} />))}</datalist>
                </div>
                {field("p-client", "Client / company", client, setClient, { maxLength: 100 })}
                {field("p-role", "Your role", role, setRole, { maxLength: 100 })}
                {field("p-location", "Location", location, setLocation, { maxLength: 80 })}
                <div className="col-md-6" />
                <div className="col-6">
                  <label className="form-label small mb-1" htmlFor="p-start">Start</label>
                  <input id="p-start" type="month" className="form-control form-control-sm" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1" htmlFor="p-end">End</label>
                  <input id="p-end" type="month" className="form-control form-control-sm" value={end} min={start || undefined} disabled={!start} onChange={(e) => setEnd(e.target.value)} />
                  <div className="form-text">{start && !end ? "Ongoing" : " "}</div>
                </div>
              </div>
              <TagInput tags={technologies} onChange={setTechnologies} suggestions={techSuggestions} max={15} label="Technologies" />
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Links</h6>
                <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" disabled={links.length >= 8} onClick={() => setLinks([...links, { label: "", url: "" }])}>
                  <FiPlus /> Add
                </button>
              </div>
              {links.length === 0 && <p className="text-muted small mb-0">Live demo, source code, case study, video… (http/https only)</p>}
              {links.map((l, i) => (
                <div className="d-flex gap-1 mb-2" key={i}>
                  <input className="form-control form-control-sm" style={{ width: 90 }} placeholder="Label" aria-label={`Link ${i + 1} label`} maxLength={40} value={l.label} onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="form-control form-control-sm" placeholder="https://" aria-label={`Link ${i + 1} URL`} maxLength={500} value={l.url} onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
                  <button type="button" className="btn btn-sm border-0 text-danger" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks(links.filter((_, k) => k !== i))}><FiX /></button>
                </div>
              ))}
            </div>
          </div>
        </div>}
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Delete project?" message={status === "published" ? "It will be removed from your public site. You can undo right after." : "You can undo right after."} isPending={isPending} onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
}
