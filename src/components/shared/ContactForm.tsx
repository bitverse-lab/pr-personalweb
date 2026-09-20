"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { FiCheckCircle, FiSend } from "react-icons/fi";
import { sendContactMessage } from "@/features/contact/actions";

const MAX = 4000;

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
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
      const result = await sendContactMessage({ ...f, startedAt: startedAt.current });
      if (!result.ok) return setError(result.error);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="text-center py-4" role="status">
        <FiCheckCircle className="text-success mb-3" size={40} aria-hidden />
        <h5 className="mb-2">Thank you, your message is on its way</h5>
        <p className="text-muted mb-4">I will get back to you as soon as I can.</p>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { setSent(false); setF({ name: "", email: "", subject: "", message: "", website: "" }); startedAt.current = Date.now(); }}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate={false}>
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-name">
              Your name <span className="text-danger" aria-hidden>*</span>
            </label>
            <input id="cf-name" name="name" type="text" className="form-control" autoComplete="name" maxLength={100} required value={f.name} onChange={set("name")} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-email">
              Your email <span className="text-danger" aria-hidden>*</span>
            </label>
            <input id="cf-email" name="email" type="email" className="form-control" autoComplete="email" maxLength={160} required value={f.email} onChange={set("email")} />
          </div>
        </div>
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-subject">Subject</label>
            <input id="cf-subject" name="subject" className="form-control" maxLength={150} value={f.subject} onChange={set("subject")} />
          </div>
        </div>
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="cf-message">
              Message <span className="text-danger" aria-hidden>*</span>
            </label>
            <textarea id="cf-message" name="message" rows={5} className="form-control" maxLength={MAX} required value={f.message} onChange={set("message")} />
            <div className="form-text text-end">{f.message.length}/{MAX}</div>
          </div>
        </div>
        {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="cf-website">Leave this field empty</label>
          <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={isPending}>
        <FiSend aria-hidden /> {isPending ? "Sending…" : "Send message"}
      </button>
      <p className="text-muted small mt-3 mb-0">
        I store your message only to reply to you. See the <Link href="/privacy">privacy notice</Link>.
      </p>
    </form>
  );
}
