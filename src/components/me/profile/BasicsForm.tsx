"use client";

import { useState, useTransition } from "react";
import { FiUser } from "react-icons/fi";
import { saveBasics, setAboutPhoto, setProfilePhoto, type ProfileData } from "@/features/profile/actions";
import TagInput from "@/components/me/content/TagInput";
import UploadDropzone from "@/components/me/media/UploadDropzone";
import { useToast } from "@/components/shared/ToastProvider";

export default function BasicsForm({ data }: { data: ProfileData }) {
  const [f, setF] = useState(data.basics);
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(data.photo?.url ?? null);
  const [aboutPhotoOverrideUrl, setAboutPhotoOverrideUrl] = useState(data.aboutPhoto?.url ?? null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const displayedAboutPhotoUrl = aboutPhotoOverrideUrl ?? heroPhotoUrl;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveBasics(f);
      if (!result.ok) toast.error(result.error);
      else toast.success("Profile saved");
    });
  };

  const changePhoto = (kind: "hero" | "about", mediaId: string | null, url: string | null) =>
    startTransition(async () => {
      const result = await (kind === "hero" ? setProfilePhoto({ mediaId }) : setAboutPhoto({ mediaId }));
      if (!result.ok) return toast.error(result.error);
      if (kind === "hero") setHeroPhotoUrl(url);
      else setAboutPhotoOverrideUrl(url);
      toast.success(mediaId ? `${kind === "hero" ? "Hero" : "About"} photo updated` : `${kind === "hero" ? "Hero" : "About"} photo removed`);
    });

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="d-grid gap-3">
          <div className="card rounded shadow-sm">
            <div className="card-body text-center">
              <h6 className="mb-3 text-start">Hero photo</h6>
              <div className="mb-3">
                {heroPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroPhotoUrl} alt="Portrait for the home hero" className="rounded-circle shadow-sm" style={{ width: 140, height: 140, objectFit: "cover" }} />
                ) : (
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: 140, height: 140 }}>
                    <FiUser size={48} className="text-muted" aria-hidden />
                  </div>
                )}
              </div>
              <UploadDropzone purpose="profile" accept="image" compact label={heroPhotoUrl ? "Replace hero photo" : "Upload hero photo"} onUploaded={(m) => m.url && changePhoto("hero", m.id, m.url)} />
              {heroPhotoUrl && (
                <button type="button" className="btn btn-sm btn-link text-danger mt-2" disabled={isPending} onClick={() => changePhoto("hero", null, null)}>
                  Remove hero photo
                </button>
              )}
              <p className="text-muted small mt-2 mb-0">Shown in the portrait area at the top of your home page.</p>
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body text-center">
              <h6 className="mb-3 text-start">About Me photo</h6>
              <div className="mb-3">
                {displayedAboutPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayedAboutPhotoUrl} alt="Portrait for the About Me section" className="rounded-circle shadow-sm" style={{ width: 140, height: 140, objectFit: "cover" }} />
                ) : (
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: 140, height: 140 }}>
                    <FiUser size={48} className="text-muted" aria-hidden />
                  </div>
                )}
              </div>
              <UploadDropzone
                purpose="profile"
                accept="image"
                compact
                label={aboutPhotoOverrideUrl ? "Replace About Me photo" : "Upload About Me photo"}
                onUploaded={(m) => m.url && changePhoto("about", m.id, m.url)}
              />
              {aboutPhotoOverrideUrl ? (
                <button type="button" className="btn btn-sm btn-link text-danger mt-2" disabled={isPending} onClick={() => changePhoto("about", null, null)}>
                  Use hero photo instead
                </button>
              ) : (
                <p className="text-muted small mt-2 mb-0">
                  {heroPhotoUrl ? "Using the hero photo until you upload a different one." : "Shown in the About Me section and About page."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <form onSubmit={submit} className="card rounded shadow-sm">
          <div className="card-body">
            <h6 className="mb-3">About you</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small mb-1" htmlFor="p-name">Full name</label>
                <input id="p-name" className="form-control" maxLength={80} value={f.displayName} onChange={set("displayName")} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small mb-1" htmlFor="p-headline">Headline</label>
                <input id="p-headline" className="form-control" maxLength={120} placeholder="e.g. Full-stack developer" value={f.headline} onChange={set("headline")} />
              </div>
              <div className="col-12">
                <label className="form-label small mb-1" htmlFor="p-summary">Summary</label>
                <textarea id="p-summary" className="form-control" rows={5} maxLength={2000} placeholder="A short paragraph about you. Shown on About and at the top of your CV." value={f.summary} onChange={set("summary")} />
                <div className="form-text">{f.summary.length}/2000</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small mb-1" htmlFor="p-loc">Location</label>
                <input id="p-loc" className="form-control" maxLength={80} value={f.location} onChange={set("location")} />
              </div>
              <div className="col-md-4">
                <label className="form-label small mb-1" htmlFor="p-email">Public email</label>
                <input id="p-email" type="email" className="form-control" maxLength={120} value={f.publicEmail} onChange={set("publicEmail")} />
              </div>
              <div className="col-md-4">
                <label className="form-label small mb-1" htmlFor="p-web">Website</label>
                <input id="p-web" className="form-control" placeholder="https://" maxLength={500} value={f.website} onChange={set("website")} />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input id="p-available" type="checkbox" className="form-check-input" checked={f.availableForWork} onChange={(e) => setF((c) => ({ ...c, availableForWork: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="p-available">Show “Available for work” on my public site</label>
                </div>
                {f.availableForWork && (
                  <input className="form-control form-control-sm mt-2" maxLength={120} placeholder="Optional note, e.g. Remote roles from October" aria-label="Availability note" value={f.availabilityNote} onChange={(e) => setF((c) => ({ ...c, availabilityNote: e.target.value }))} />
                )}
              </div>
              <div className="col-12">
                <TagInput tags={f.roles} onChange={(roles) => setF((c) => ({ ...c, roles }))} max={6} label="Home page typing words (after your first name)" />
                <div className="form-text">e.g. “Developer”, “Designer” — they cycle in the animation on your home page.</div>
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn btn-primary" disabled={isPending || !f.displayName.trim()}>
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
