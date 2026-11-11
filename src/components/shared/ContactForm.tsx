"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { FiCheckCircle, FiSend } from "react-icons/fi";
import { sendContactMessage } from "@/features/contact/actions";
import { useDict } from "@/lib/i18n/context";

const MAX = 4000;

const sqlString = (v: string, max: number) => {
  const flat = v.replace(/\s+/g, " ").trim();
  return `'${(flat.length > max ? `${flat.slice(0, max - 1)}…` : flat).replace(/'/g, "''")}'`;
};

/**
 * The message as the statement that will store it, typed as the visitor types. Decorative (the
 * form fields carry the content), so hidden from assistive tech.
 */
function InsertPreview({ f }: { f: { name: string; email: string; subject: string; message: string } }) {
  const val = (v: string, max: number) => <span className={v.trim() ? "cf-sql-str" : "cf-sql-empty"}>{sqlString(v, max)}</span>;
  return (
    <pre className="cf-sql" aria-hidden="true">
      <span className="cf-sql-kw">INSERT INTO</span> message (name, email, subject, body){"\n"}
      <span className="cf-sql-kw">VALUES</span> ({val(f.name, 24)}, {val(f.email, 28)},{"\n"}
      {"        "}
      {f.subject.trim() ? val(f.subject, 32) : <span className="cf-sql-kw">NULL</span>}, {val(f.message, 40)});
    </pre>
  );
}

export default function ContactForm() {
  const t = useDict().form;
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | false>(false);
  const [isPending, startTransition] = useTransition();
  const startedAt = useRef<number>(0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const t0 = performance.now();
        const result = await sendContactMessage({ ...f, startedAt: startedAt.current });
        if (!result.ok) return setError(result.error);
        // The real round trip, shown the way psql reports a successful insert.
        setSent(Math.max(1, Math.round(performance.now() - t0)));
      } catch {
        // Offline, or the server could not be reached: say so instead of letting the click look ignored.
        setError(t.offline);
      }
    });
  };

  if (sent !== false) {
    return (
      <div className="text-center py-4" role="status">
        <FiCheckCircle className="text-success mb-3" size={40} aria-hidden />
        <p className="cf-sql-ok mb-2" aria-hidden="true">INSERT 0 1 · {sent} ms</p>
        <h5 className="mb-2">{t.sentTitle}</h5>
        <p className="text-muted mb-4">{t.sentBody}</p>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { setSent(false); setF({ name: "", email: "", subject: "", message: "", website: "" }); startedAt.current = Date.now(); }}>
          {t.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate={false}>
      <InsertPreview f={f} />
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-name">
              {t.name} <span className="text-danger" aria-hidden>*</span>
            </label>
            <input id="cf-name" name="name" type="text" className="form-control" autoComplete="name" maxLength={100} required value={f.name} onChange={set("name")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-email">
              {t.email} <span className="text-danger" aria-hidden>*</span>
            </label>
            <input id="cf-email" name="email" type="email" className="form-control" autoComplete="email" maxLength={160} required value={f.email} onChange={set("email")} />
          </div>
        </div>
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-subject">{t.subject}</label>
            <input id="cf-subject" name="subject" className="form-control" maxLength={150} value={f.subject} onChange={set("subject")} />
          </div>
        </div>
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-message">
              {t.message} <span className="text-danger" aria-hidden>*</span>
            </label>
            <textarea id="cf-message" name="message" rows={5} className="form-control" maxLength={MAX} required value={f.message} onChange={set("message")} />
            <div className="form-text text-end">{f.message.length}/{MAX}</div>
          </div>
        </div>
        {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="cf-website">{t.honeypot}</label>
          <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={isPending}>
        <FiSend aria-hidden /> {isPending ? t.sending : t.send}
      </button>
      <p className="text-muted small mt-3 mb-0">
        {t.privacyBefore} <Link className="text-decoration-underline" href="/privacy">{t.privacyLink}</Link>.
      </p>
    </form>
  );
}
