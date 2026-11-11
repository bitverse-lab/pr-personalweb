"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import DialogShell from "@/components/shared/DialogShell";
import { useSite } from "@/lib/site-context";

export const OPEN_TERMINAL_EVENT = "terminal:open";

export interface TerminalIndex {
  projects: { slug: string; name: string; keywords: string[] }[];
  articles: { slug: string; title: string; keywords: string[] }[];
}

const PAGES = [
  { cmd: "cd ~", href: "/", note: "home" },
  { cmd: "cd about", href: "/about", note: "who I am" },
  { cmd: "cd cv", href: "/cv", note: "experience, education, skills" },
  { cmd: "cd work", href: "/projects", note: "all projects" },
  { cmd: "cd writing", href: "/articles", note: "all articles" },
  { cmd: "cd contact", href: "/contact", note: "send a message" },
  { cmd: "cd proof", href: "/proof", note: "tests, bundle sizes, backups" },
  { cmd: "match --jd", href: "/match", note: "paste a job description, see the evidence" },
];

const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * The public site as a terminal: Ctrl/Cmd+K (or "/") opens a prompt that jumps to any page,
 * project or article, downloads the CV or copies the email. Keyboard-first; the navbar button opens
 * it too. Not on /me, which has its own command palette on the same shortcut.
 */
export default function PublicTerminal({ index }: { index: TerminalIndex }) {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSite();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const hidden = pathname.startsWith("/me") || pathname.startsWith("/login");

  useEffect(() => {
    if (hidden) return;
    const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_TERMINAL_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_TERMINAL_EVENT, onOpen);
    };
  }, [hidden]);

  if (hidden || !open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setOpen(false), 700);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <DialogShell title="~/visitor — terminal" onClose={() => setOpen(false)} maxWidth={640} className="term-panel">
      <Command label="Site terminal" className="term" loop>
        <div className="term-prompt">
          <span aria-hidden="true">$</span>
          <Command.Input data-autofocus placeholder="type a page, project or article… (try: ml, cv, contact)" className="term-input" />
        </div>
        <Command.List className="term-list">
          <Command.Empty className="term-empty">command not found. Try “work” or “cv”.</Command.Empty>
          <Command.Group heading="navigate">
            {PAGES.map((p) => (
              <Command.Item key={p.href} value={`${p.cmd} ${p.note}`} onSelect={() => go(p.href)} className="term-item">
                <span className="term-cmd">{p.cmd}</span>
                <span className="term-note">{p.note}</span>
              </Command.Item>
            ))}
          </Command.Group>
          {index.projects.length > 0 && (
            <Command.Group heading="projects">
              {index.projects.map((p) => (
                <Command.Item key={p.slug} value={`open ${p.name}`} keywords={p.keywords} onSelect={() => go(`/projects/${p.slug}`)} className="term-item">
                  <span className="term-cmd">open {kebab(p.name)}</span>
                  <span className="term-note">{p.keywords.slice(0, 3).join(" · ")}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {index.articles.length > 0 && (
            <Command.Group heading="writing">
              {index.articles.map((a) => (
                <Command.Item key={a.slug} value={`cat ${a.title}`} keywords={a.keywords} onSelect={() => go(`/articles/${a.slug}`)} className="term-item">
                  <span className="term-cmd">cat {a.slug}.md</span>
                  <span className="term-note">{a.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          <Command.Group heading="actions">
            {!site.isPlaceholder && (
              <Command.Item value="download cv pdf" onSelect={() => { setOpen(false); window.location.href = "/cv/download"; }} className="term-item">
                <span className="term-cmd">curl -O cv.pdf</span>
                <span className="term-note">download my CV</span>
              </Command.Item>
            )}
            {site.email && (
              <Command.Item value="copy email address" onSelect={copyEmail} className="term-item">
                <span className="term-cmd">echo $EMAIL | pbcopy</span>
                <span className="term-note">{copied ? "copied ✓" : site.email}</span>
              </Command.Item>
            )}
          </Command.Group>
        </Command.List>
        <p className="term-foot" aria-hidden="true">↑↓ move · ↵ run · esc close</p>
      </Command>
    </DialogShell>
  );
}
