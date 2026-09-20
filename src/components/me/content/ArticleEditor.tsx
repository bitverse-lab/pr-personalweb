"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { FiArchive, FiArrowLeft, FiCheck, FiExternalLink, FiGlobe, FiLoader, FiAlertCircle, FiTrash2 } from "react-icons/fi";
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

export function SaveIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === "error") {
    return (
      <span className="text-danger small d-inline-flex align-items-center gap-1" role="status">
        <FiAlertCircle /> Not saved: {error}
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
  if (status === "saved") {
    return (
      <span className="text-success small d-inline-flex align-items-center gap-1" role="status">
        <FiCheck /> Saved
      </span>
    );
  }
  return <span className="text-muted small" role="status">All changes saved</span>;
}

export default function ArticleEditor({ article, tagSuggestions }: { article: ArticleDetail; tagSuggestions: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [slugTouched, setSlugTouched] = useState(!article.slug.startsWith("draft-"));
  const [excerpt, setExcerpt] = useState(article.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(article.coverUrl ?? "");
  const [tags, setTags] = useState(article.tags);
  const [doc, setDoc] = useState<RichDoc>(article.content);
  const [status, setStatus] = useState(article.status);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const payload = useMemo(
    () => ({ id: article.id, title, slug, excerpt, coverUrl, tags, content: doc }),
    [article.id, title, slug, excerpt, coverUrl, tags, doc]
  );
  const { status: saveStatus, error, flush } = useAutosave(payload, async (p) => {
    const result = await saveArticle(p);
    return result.ok ? null : result.error;
  });

  const plain = useMemo(() => docToPlainText(doc), [doc]);
  const words = countWords(plain);

  const onTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(value.trim() ? slugify(value) : slug);
  };

  const changeStatus = (next: "draft" | "published" | "archived") =>
    startTransition(async () => {
      // persist first so the published version is exactly what is on screen
      const saved = await saveArticle(payload);
      if (!saved.ok) return toast.error(saved.error);
      const result = await setArticleStatus({ id: article.id, status: next });
      if (!result.ok) return toast.error(result.error);
      setStatus(result.data.status);
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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link href="/me/articles" className="text-muted small d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> All articles
        </Link>
        <div className="d-flex align-items-center gap-3">
          <SaveIndicator status={saveStatus} error={error} />
          <div className="btn-group btn-group-sm" role="group" aria-label="Editor mode">
            <button type="button" className={`btn ${!preview ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setPreview(false)}>Write</button>
            <button type="button" className={`btn ${preview ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setPreview(true)}>Preview</button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <input
            className="form-control form-control-lg fw-semibold mb-3"
            placeholder="Article title"
            aria-label="Article title"
            maxLength={160}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
          />
          {preview ? (
            <div className="card rounded shadow-sm">
              <div className="card-body">
                <h3 className="mb-3">{title || "Untitled"}</h3>
                {words === 0 ? <p className="text-muted">Nothing to preview yet.</p> : <RichTextRenderer doc={doc} />}
              </div>
            </div>
          ) : (
            <RichEditor initial={article.content} onChange={setDoc} placeholder="Tell your story…" minHeight={420} />
          )}
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
              <div className="d-grid gap-2">
                {status !== "published" ? (
                  <button type="button" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-1" disabled={isPending} onClick={() => changeStatus("published")}>
                    <FiGlobe /> Publish
                  </button>
                ) : (
                  <>
                    <Link href={`/articles/${slug}`} target="_blank" className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1">
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
                <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center justify-content-center gap-1" onClick={() => setConfirmDelete(true)}>
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
                <div className="input-group input-group-sm">
                  <span className="input-group-text">/articles/</span>
                  <input
                    id="article-slug"
                    className="form-control"
                    maxLength={120}
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    onBlur={() => setSlug(slugify(slug))}
                  />
                </div>
                {status === "published" && <div className="form-text">Changing the slug of a published article changes its public link.</div>}
              </div>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="article-excerpt">Excerpt</label>
                <textarea id="article-excerpt" className="form-control" rows={3} maxLength={400} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary shown in article lists and search results" />
                <div className="form-text">{excerpt.length}/400</div>
              </div>
              <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="article-cover">Cover image</label>
                {coverUrl && /^https?:\/\//i.test(coverUrl) ? (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="Cover preview" className="img-fluid rounded" />
                    <button type="button" className="btn btn-sm btn-link text-danger px-0" onClick={() => setCoverUrl("")}>Remove cover</button>
                  </div>
                ) : (
                  <UploadDropzone purpose="cover" accept="image" compact label="Upload a cover image" onUploaded={(m) => m.url && setCoverUrl(m.url)} />
                )}
                <input id="article-cover" className="form-control form-control-sm mt-2" placeholder="…or paste an image URL" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
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
