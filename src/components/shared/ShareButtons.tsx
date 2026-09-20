"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiLink, FiLinkedin, FiMail, FiMessageCircle, FiShare2, FiTwitter } from "react-icons/fi";

// Share links use each network's public share URL; nothing is loaded from third parties.
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const targets = [
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: FiLinkedin },
    { label: "Share on X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, Icon: FiTwitter },
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, Icon: FiMessageCircle },
    { label: "Share by email", href: `mailto:?subject=${t}&body=${u}`, Icon: FiMail },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can be blocked; the share links above still work
    }
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Share this page">
      <span className="text-muted small me-1">Share:</span>
      {canNativeShare && (
        <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => void navigator.share({ title, url }).catch(() => undefined)}>
          <FiShare2 aria-hidden /> Share
        </button>
      )}
      {targets.map(({ label, href, Icon }) => (
        <a key={label} href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="btn btn-sm btn-outline-primary btn-icon" aria-label={label} title={label}>
          <Icon aria-hidden />
        </a>
      ))}
      <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onClick={copy}>
        {copied ? <FiCheck aria-hidden /> : <FiLink aria-hidden />} {copied ? "Copied" : "Copy link"}
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}
