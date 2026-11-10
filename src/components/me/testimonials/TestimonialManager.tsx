"use client";

import { useState, useTransition } from "react";
import { FiArrowDown, FiArrowUp, FiEdit2, FiEye, FiEyeOff, FiMessageSquare, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  createTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  restoreTestimonial,
  setTestimonialPublished,
  updateTestimonial,
  type TestimonialDto,
} from "@/features/testimonials/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import DialogShell from "@/components/shared/DialogShell";
import AnimatedList from "@/components/shared/AnimatedList";

function TestimonialDialog({ item, onClose }: { item?: TestimonialDto; onClose: () => void }) {
  const [f, setF] = useState({
    quote: item?.quote ?? "",
    authorName: item?.authorName ?? "",
    authorRole: item?.authorRole ?? "",
    company: item?.company ?? "",
    sourceUrl: item?.sourceUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = item ? await updateTestimonial({ id: item.id, data: f }) : await createTestimonial(f);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Testimonial updated" : "Testimonial added (not published yet)");
      onClose();
    });
  };

  return (
    <DialogShell title={item ? "Edit testimonial" : "Add testimonial"} onClose={onClose} maxWidth={520}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-2">
          <label className="form-label small mb-1" htmlFor="t-quote">What they said</label>
          <textarea id="t-quote" className="form-control" rows={4} maxLength={700} value={f.quote} onChange={set("quote")} required />
          <div className="form-text">{f.quote.length}/700 — only quote what they actually said, with their permission.</div>
        </div>
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small mb-1" htmlFor="t-name">Name</label>
            <input id="t-name" className="form-control" maxLength={80} value={f.authorName} onChange={set("authorName")} required />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-1" htmlFor="t-role">Role (opt.)</label>
            <input id="t-role" className="form-control" maxLength={80} value={f.authorRole} onChange={set("authorRole")} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-1" htmlFor="t-company">Company (opt.)</label>
            <input id="t-company" className="form-control" maxLength={80} value={f.company} onChange={set("company")} />
          </div>
          <div className="col-md-6">
            <label className="form-label small mb-1" htmlFor="t-source">Source link (opt.)</label>
            <input id="t-source" className="form-control" maxLength={500} placeholder="https://linkedin.com/…" value={f.sourceUrl} onChange={set("sourceUrl")} />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !f.quote.trim() || !f.authorName.trim()}>Save</button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function TestimonialManager({ items }: { items: TestimonialDto[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<TestimonialDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<TestimonialDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const key = JSON.stringify(items);
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setList(items);
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    startTransition(async () => {
      const r = await reorderTestimonials({ ids: next.map((t) => t.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const togglePublished = (t: TestimonialDto) =>
    startTransition(async () => {
      const r = await setTestimonialPublished({ id: t.id, published: !t.published });
      if (!r.ok) return toast.error(r.error);
      toast.success(r.data.published ? "Now shown on your home page" : "Hidden from your home page");
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const t = deleting;
    startTransition(async () => {
      const r = await deleteTestimonial(t.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      const s = r.data;
      toast.success("Testimonial deleted", {
        action: { label: "Undo", onClick: () => void restoreTestimonial({ quote: s.quote, authorName: s.authorName, authorRole: s.authorRole ?? "", company: s.company ?? "", sourceUrl: s.sourceUrl ?? "", published: s.published }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) },
      });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Testimonials <span className="text-muted small">({list.filter((t) => t.published).length} published)</span></h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}>
            <FiPlus /> Add
          </button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiMessageSquare} title="No testimonials yet" description="Add kind words from colleagues or clients. They only appear on your public home page once you publish them." />
        ) : (
          <AnimatedList as="ul" className="list-unstyled mb-0">
            {list.map((t, i) => (
              <li key={t.id} className="d-flex align-items-start gap-2 py-3 border-top">
                <div className="flex-grow-1 min-w-0">
                  <p className="mb-1" style={{ overflowWrap: "anywhere" }}>“{t.quote}”</p>
                  <div className="text-muted small">
                    — {t.authorName}
                    {(t.authorRole || t.company) && `, ${[t.authorRole, t.company].filter(Boolean).join(" at ")}`}
                  </div>
                  <span className={`badge mt-1 ${t.published ? "bg-soft-success text-success" : "bg-soft-secondary text-secondary"}`}>{t.published ? "Published" : "Draft"}</span>
                </div>
                <div className="text-nowrap">
                  <button type="button" className="btn btn-sm border-0 p-1" aria-label={t.published ? "Hide from home page" : "Show on home page"} title={t.published ? "Hide" : "Publish"} disabled={isPending} onClick={() => togglePublished(t)}>
                    {t.published ? <FiEye /> : <FiEyeOff />}
                  </button>
                  <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move up" disabled={i === 0 || isPending} onClick={() => move(i, -1)}><FiArrowUp /></button>
                  <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move down" disabled={i === list.length - 1 || isPending} onClick={() => move(i, 1)}><FiArrowDown /></button>
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit testimonial from ${t.authorName}`} onClick={() => setEditing(t)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete testimonial from ${t.authorName}`} onClick={() => setDeleting(t)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </AnimatedList>
        )}
      </div>
      {editing && <TestimonialDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete testimonial?" message={`The testimonial from ${deleting.authorName} will be deleted. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
