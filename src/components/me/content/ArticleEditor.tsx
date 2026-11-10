"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FiArchive, FiArrowLeft, FiCheck, FiCircle, FiExternalLink, FiGlobe, FiLoader, FiAlertCircle, FiRotateCw, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { deleteArticle, restoreArticle, saveArticle, setArticleStatus } from "@/features/content/article-actions";
import { countWords, docToPlainText, readingMinutes, slugify } from "@/features/content/richtext";
import { useAutosave, type SaveStatus } from "@/hooks/useAutosave";
import UploadDropzone from "@/components/me/media/UploadDropzone";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import { useToast } from "@/components/shared/ToastProvider";
import ArticleStatusBadge from "./ArticleStatusBadge";
import RichEditor from "./RichEditor";
import TagInput from "./TagInput";
import type { RichDoc } from "@/db/schema/content";
import type { ArticleDetail } from "@/server/services/article-service";

export function SaveIndicator({ status, error, onRetry, savedAt }: { status: SaveStatus; error: string | null; onRetry?: () => void; savedAt?: Date | null }) {
  if (status === "error") {
    return (
      <span className="text-danger small d-inline-flex align-items-center gap-1" role="status">
        <FiAlertCircle /> Not saved: {error}
        {onRetry && (
          <button type="button" className="btn btn-link btn-sm p-0 ms-1 d-inline-flex align-items-center gap-1" onClick={onRetry}>
            <FiRotateCw /> Retry
          </button>
        )}
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="text-muted small d-inline-flex align-items-center gap-1" role="status">
        <FiLoader /> Saving…
      </span>
    );
  }
  if (status === "dirty") return <span className="text-muted small" role="status">Unsaved changes</span>;
  const at = savedAt ? ` at ${savedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : "";
  if (status === "saved") {
    return (
      <span className="text-success small d-inline-flex align-items-center gap-1" role="status">
        <FiCheck /> Saved{at}
      </span>
    );
  }
  return <span className="text-muted small" role="status">All changes saved</span>;
}

const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

/** The opening of the text, cut at a sentence (or word) boundary: a starting point for the excerpt. */
function openingExcerpt(plain: string, max = 200) {
  const text = plain.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  return sentence > 80 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export default function ArticleEditor({ article, tagSuggestions }: { article: ArticleDetail; tagSuggestions: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [savedSlug, setSavedSlug] = useState(article.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!article.slug.startsWith("draft-"));
  const [excerpt, setExcerpt] = useState(article.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(article.coverUrl ?? "");
  const [tags, setTags] = useState(article.tags);
  const [doc, setDoc] = useState<RichDoc>(article.content);
  const [status, setStatus] = useState(article.status);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A half-typed cover URL must not block saving the article: keep sending the last valid one.
  const cover = coverUrl.trim();
  const coverValid = cover === "" || isHttpUrl(cover);
  const lastValidCover = useRef(article.coverUrl ?? "");
  if (coverValid) lastValidCover.current = cover;

  const payload = useMemo(
    () => ({ id: article.id, title, slug, slugAuto: !slugTouched, excerpt, coverUrl: lastValidCover.current, tags, content: doc }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lastValidCover follows `cover`
    [article.id, title, slug, slugTouched, excerpt, cover, tags, doc]
  );
  const { status: saveStatus, error, flush, savedAt } = useAutosave(payload, async (p) => {
    const result = await saveArticle(p);
    if (!result.ok) return result.error;
    const sent = slugify(p.slug);
    // The server numbered a clashing automatic slug ("my-post-2"); show it, unless the title moved on.
    if (result.data.slug !== sent) setSlug((current) => (slugify(current) === sent ? result.data.slug : current));
    setSavedSlug(result.data.slug);
    setSlugError(result.data.slugError);
    return null;
  });

  const plain = useMemo(() => docToPlainText(doc), [doc]);
  const words = countWords(plain);

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

  const checklist = [
    { label: "A title", done: !!title.trim(), required: true },
    { label: "Some writing", done: words > 0, required: true },
    { label: "An excerpt for lists and search results", done: !!excerpt.trim(), required: false },
    { label: "A cover image", done: !!cover && coverValid, required: false },
  ];
  const ready = checklist.every((c) => c.done || !c.required);

  const changeStatus = (next: "draft" | "published" | "archived") =>
    startTransition(async () => {
      // persist first so the published version is exactly what is on screen
      const problem = await flush();
      if (problem) return toast.error(`Could not save first: ${problem}`);
      const result = await setArticleStatus({ id: article.id, status: next });
      if (!result.ok) return toast.error(result.error);
      setStatus(result.data.status);
      setSavedSlug(result.data.slug);
      setSlugTouched(true);
      toast.success(next === "published" ? "Published — it is now live on your site" : next === "archived" ? "Article archived" : "Moved back to drafts");
    });

  const remove = () =>
    startTransition(async () => {
      await flush();
      const result = await deleteArticle(article.id);
      setConfirmDelete(false);
      if (!result.ok) return toast.error(result.error);
      const snapshot = result.data;
      toast.success("Article deleted", {
        action: { label: "Undo", onClick: () => void restoreArticle(snapshot).then((r) => (r.ok ? toast.success("Article restored") : toast.error(r.error))) },
      });
      router.push("/me/articles");
    });

  return (
    <>
      <h1 className="visually-hidden">Edit article: {title.trim() || "Untitled"}</h1>
      <div className="art-topbar d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link href="/me/articles" className="text-muted small d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> All articles
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
        <div className="col-lg-8">
          {preview ? (
            <article className="card rounded shadow-sm art-preview" aria-label="Preview">
              <div className="card-body p-4 p-md-5">
                <p className="text-muted small mb-2">
                  {status === "published" && article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Not published yet"}
                  {" · "}
                  {readingMinutes(words)} min read
                </p>
                <h1 className="article-title mb-3">{title.trim() || "Untitled"}</h1>
                {excerpt.trim() && <p className="lead text-muted">{excerpt}</p>}
                {cover && coverValid && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="img-fluid rounded my-4 w-100" />
                )}
                <div className="reading-col mx-0">
                  {words === 0 ? <p className="text-muted">Nothing to preview yet.</p> : <RichTextRenderer doc={doc} />}
                </div>
                {tags.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-4">
                    {tags.map((tag) => (
                      <span className="task-tag" key={tag}>#{tag.toLowerCase()}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ) : (
            <input
              className="form-control form-control-lg fw-semibold mb-3 art-title-input"
              placeholder="Article title"
              aria-label="Article title"
              maxLength={160}
              value={title}
              onChange={(e) => onTitle(e.target.value)}
            />
          )}
          {/* Kept mounted while previewing: unmounting it lost the editor's content and undo history. */}
          <div className={preview ? "d-none" : undefined}>
            <RichEditor initial={article.content} onChange={setDoc} placeholder="Tell your story…" minHeight={420} />
          </div>
          <p className="text-muted small mt-2 mb-0">
            {words} words · {readingMinutes(words)} min read
          </p>
        </div>

        <div className="col-lg-4">
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Publishing</h6>
                <ArticleStatusBadge status={status} />
              </div>
              {status !== "published" && (
                <ul className="list-unstyled small mb-3 art-checklist" aria-label="Before publishing">
                  {checklist.map((c) => (
                    <li key={c.label} className={c.done ? "is-done" : undefined}>
                      {c.done ? <FiCheck aria-hidden /> : <FiCircle aria-hidden />}
                      <span>
                        {c.label}
                        {!c.required && <span className="text-muted"> (optional)</span>}
                      </span>
                      <span className="visually-hidden">{c.done ? "done" : "to do"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="d-grid gap-2">
                {status !== "published" ? (
                  <button
                    type="button"
                    className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-1"
                    disabled={isPending || !ready}
                    title={ready ? undefined : "Add a title and some writing first"}
                    onClick={() => changeStatus("published")}
                  >
                    <FiGlobe /> Publish
                  </button>
                ) : (
                  <>
                    <Link href={`/articles/${savedSlug}`} target="_blank" className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1">
                      <FiExternalLink /> View on site
                    </Link>
                    <button type="button" className="btn btn-outline-secondary" disabled={isPending} onClick={() => changeStatus("draft")}>
                      Unpublish (back to draft)
                    </button>
                  </>
                )}
                {status !== "archived" && (
                  <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center gap-1" disabled={isPending} onClick={() => changeStatus("archived")}>
                    <FiArchive /> Archive
                  </button>
                )}
                <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1" disabled={isPending} onClick={() => setConfirmDelete(true)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
              {status === "published" && <p className="text-muted small mt-3 mb-0">Changes you make are published as soon as they save.</p>}
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Details</h6>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="article-slug">URL slug</label>
                <div className="input-group input-group-sm has-validation">
                  <span className="input-group-text">/articles/</span>
                  <input
                    id="article-slug"
                    className={`form-control${slugError ? " is-invalid" : ""}`}
                    maxLength={120}
                    value={slug}
                    aria-describedby="article-slug-help"
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    onBlur={() => setSlug(slugify(slug))}
                  />
                  {slugError && <div className="invalid-feedback">{slugError}. The article keeps /articles/{savedSlug} until you pick another.</div>}
                </div>
                <div id="article-slug-help" className="form-text">
                  {slugTouched ? (
                    <>
                      {status === "published" ? "Changing it changes the public link. " : ""}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 align-baseline"
                        disabled={!title.trim()}
                        onClick={() => {
                          setSlugTouched(false);
                          setSlug(slugify(title));
                        }}
                      >
                        Follow the title
                      </button>
                    </>
                  ) : (
                    "Follows the title until you edit it."
                  )}
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-baseline">
                  <label className="form-label small mb-1" htmlFor="article-excerpt">Excerpt</label>
                  {!excerpt.trim() && words > 0 && (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setExcerpt(openingExcerpt(plain))}>
                      Use the opening
                    </button>
                  )}
                </div>
                <textarea id="article-excerpt" className="form-control" rows={3} maxLength={400} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary shown in article lists and search results" />
                <div className={`form-text${excerpt.length > 300 ? " text-warning" : ""}`}>{excerpt.length}/400</div>
              </div>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="article-cover">Cover image</label>
                {cover && coverValid ? (
                  <div className="mb-2 art-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="Cover preview" className="img-fluid rounded" />
                    <button type="button" className="btn btn-sm btn-link text-danger px-0" onClick={() => setCoverUrl("")}>Remove cover</button>
                  </div>
                ) : (
                  <UploadDropzone purpose="cover" accept="image" compact label="Upload a cover image" onUploaded={(m) => m.url && setCoverUrl(m.url)} />
                )}
                <input
                  id="article-cover"
                  className={`form-control form-control-sm mt-2${coverValid ? "" : " is-invalid"}`}
                  placeholder="…or paste an image URL"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
                {!coverValid && <div className="invalid-feedback">Use a full link starting with https://. The rest of the article still saves.</div>}
              </div>
              <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} />
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete article?"
          message={status === "published" ? "It will be removed from your public site. You can undo right after." : "You can undo right after."}
          isPending={isPending}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
