"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiArchive, FiArrowLeft, FiExternalLink, FiGlobe, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { deleteProject, restoreProject, saveProject, setProjectFeatured, setProjectStatus } from "@/features/projects/actions";
import { slugify } from "@/features/content/richtext";
import { useAutosave } from "@/hooks/useAutosave";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
  const [summary, setSummary] = useState(project.summary ?? "");
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const payload = useMemo(
    () => ({
      id: project.id,
      title,
      slug,
      summary,
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
      links: links.filter((l) => l.label.trim() && l.url.trim()),
    }),
    [project.id, title, slug, summary, category, client, role, location, start, end, technologies, doc, coverMediaId, gallery, links]
  );
  const { status: saveStatus, error, flush } = useAutosave(payload, async (p) => {
    const result = await saveProject(p);
    return result.ok ? null : result.error;
  });

  const onTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(value.trim() ? slugify(value) : slug);
  };

  const changeStatus = (next: "draft" | "published" | "archived") =>
    startTransition(async () => {
      const saved = await saveProject(payload);
      if (!saved.ok) return toast.error(saved.error);
      const result = await setProjectStatus({ id: project.id, status: next });
      if (!result.ok) return toast.error(result.error);
      setStatus(result.data.status);
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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link href="/me/projects" className="text-muted small d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> All projects
        </Link>
        <SaveIndicator status={saveStatus} error={error} />
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
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

        <div className="col-lg-4">
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
                    <Link href={`/projects/${slug}`} target="_blank" className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1">
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
                <div className="input-group input-group-sm">
                  <span className="input-group-text">/projects/</span>
                  <input id="p-slug" className="form-control" maxLength={120} value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} onBlur={() => setSlug(slugify(slug))} />
                </div>
                {status === "published" && <div className="form-text">Changing the slug of a published project changes its public link.</div>}
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
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Delete project?" message={status === "published" ? "It will be removed from your public site. You can undo right after." : "You can undo right after."} isPending={isPending} onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
}
