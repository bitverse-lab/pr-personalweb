"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiDatabase,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiHeart,
  FiHome,
  FiImage,
  FiInbox,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { globalSearch } from "@/features/search/actions";
import { createArticleDraft } from "@/features/content/article-actions";
import { openJournalDay } from "@/features/content/journal-actions";
import { startWorkout } from "@/features/health/workout-actions";
import { createProjectDraft } from "@/features/projects/actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useToast } from "@/components/shared/ToastProvider";
import type { SearchHit, SearchKind } from "@/server/services/search-service";

export const OPEN_SEARCH_EVENT = "me:open-search";

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  Icon: IconType;
  href?: string;
  run?: () => Promise<void> | void;
}

const KIND_ICON: Record<SearchKind, IconType> = {
  task: FiCheckSquare,
  event: FiCalendar,
  application: FiBriefcase,
  article: FiFileText,
  project: FiFolder,
  journal: FiBook,
  file: FiImage,
};

const PAGES: Item[] = [
  { id: "p-overview", group: "Go to", label: "Overview", Icon: FiHome, href: "/me" },
  { id: "p-inbox", group: "Go to", label: "Inbox (contact messages)", Icon: FiInbox, href: "/me/inbox" },
  { id: "p-tasks", group: "Go to", label: "Tasks", Icon: FiCheckSquare, href: "/me/tasks" },
  { id: "p-calendar", group: "Go to", label: "Calendar", Icon: FiCalendar, href: "/me/calendar" },
  { id: "p-career", group: "Go to", label: "Career pipeline", Icon: FiBriefcase, href: "/me/career" },
  { id: "p-apps", group: "Go to", label: "All applications", Icon: FiBriefcase, href: "/me/career/applications" },
  { id: "p-health", group: "Go to", label: "Health overview", Icon: FiHeart, href: "/me/health" },
  { id: "p-weight", group: "Go to", label: "Weight", Icon: FiHeart, href: "/me/health/weight" },
  { id: "p-nutrition", group: "Go to", label: "Nutrition", Icon: FiHeart, href: "/me/health/nutrition" },
  { id: "p-workouts", group: "Go to", label: "Workouts", Icon: FiActivity, href: "/me/health/workouts" },
  { id: "p-goals", group: "Go to", label: "Health goals", Icon: FiHeart, href: "/me/health/goals" },
  { id: "p-journal", group: "Go to", label: "Journal", Icon: FiBook, href: "/me/journal" },
  { id: "p-articles", group: "Go to", label: "Articles", Icon: FiFileText, href: "/me/articles" },
  { id: "p-projects", group: "Go to", label: "Projects", Icon: FiFolder, href: "/me/projects" },
  { id: "p-testimonials", group: "Go to", label: "Testimonials", Icon: FiMessageSquare, href: "/me/testimonials" },
  { id: "p-media", group: "Go to", label: "Media library", Icon: FiImage, href: "/me/media" },
  { id: "p-profile", group: "Go to", label: "Profile & CV", Icon: FiUser, href: "/me/settings/profile" },
  { id: "p-account", group: "Go to", label: "Account", Icon: FiShield, href: "/me/settings/account" },
  { id: "p-data", group: "Go to", label: "Data & export", Icon: FiDatabase, href: "/me/settings/data" },
  { id: "p-settings", group: "Go to", label: "Settings", Icon: FiSettings, href: "/me/settings" },
];

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const actions: Item[] = useMemo(
    () => [
      { id: "a-capture", group: "Actions", label: "Quick capture", hint: "Task, weight, meal, note…", Icon: FiPlus, href: "/me" },
      {
        id: "a-journal",
        group: "Actions",
        label: "Write today's journal entry",
        Icon: FiEdit3,
        run: async () => {
          const fd = new FormData();
          fd.set("date", new Intl.DateTimeFormat("en-CA").format(new Date()));
          await openJournalDay(fd);
        },
      },
      {
        id: "a-workout",
        group: "Actions",
        label: "Start a workout",
        Icon: FiActivity,
        run: async () => {
          const r = await startWorkout({});
          if (!r.ok) return toast.error(r.error);
          router.push(`/me/health/workouts/${r.data.id}`);
        },
      },
      {
        id: "a-article",
        group: "Actions",
        label: "New article",
        Icon: FiFileText,
        run: async () => {
          const r = await createArticleDraft();
          if (!r.ok) return toast.error(r.error);
          router.push(`/me/articles/${r.data.id}`);
        },
      },
      {
        id: "a-project",
        group: "Actions",
        label: "New project",
        Icon: FiFolder,
        run: async () => {
          const r = await createProjectDraft();
          if (!r.ok) return toast.error(r.error);
          router.push(`/me/projects/${r.data.id}`);
        },
      },
    ],
    [router, toast]
  );

  // debounced server search; stale responses are ignored
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      void globalSearch(q)
        .then((rows) => id === requestId.current && setHits(rows))
        .catch(() => id === requestId.current && setHits([]))
        .finally(() => id === requestId.current && setSearching(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (i: Item) => !q || i.label.toLowerCase().includes(q) || (i.hint?.toLowerCase().includes(q) ?? false);
    const found: Item[] = hits.map((h) => ({ id: `h-${h.kind}-${h.id}`, group: "Results", label: h.title, hint: h.subtitle, Icon: KIND_ICON[h.kind], href: h.href }));
    return [...found, ...actions.filter(matches), ...PAGES.filter(matches)];
  }, [hits, query, actions]);

  useEffect(() => setActive(0), [query, hits.length]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item: Item) => {
    onClose();
    if (item.href) router.push(item.href);
    else if (item.run) startTransition(async () => void (await item.run?.()));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    }
  };

  let lastGroup = "";
  return (
    <div role="presentation" className="me-dialog-backdrop" style={{ alignItems: "flex-start", paddingTop: "12vh" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel p-0" role="dialog" aria-modal="true" aria-label="Search and commands" style={{ maxWidth: 620, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center gap-2 px-3 border-bottom">
          <FiSearch className="text-muted flex-shrink-0" aria-hidden />
          <input
            className="form-control border-0 shadow-none px-0 py-3"
            style={{ background: "transparent" }}
            placeholder="Search tasks, articles, projects, journal… or type a command"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="small text-muted">Esc</kbd>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Results" style={{ maxHeight: "50vh", overflowY: "auto" }} className="py-2">
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id} role="presentation">
                {header && <div className="px-3 pt-2 pb-1 text-muted small fw-semibold text-uppercase" role="presentation">{header}</div>}
                <div
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  tabIndex={-1} // focus stays on the input (aria-activedescendant); options are not tab stops
                  aria-selected={index === active}
                  className={`d-flex align-items-center gap-3 px-3 py-2 ${index === active ? "bg-soft-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onMouseMove={() => index !== active && setActive(index)}
                  onClick={() => choose(item)}
                >
                  <item.Icon className={index === active ? "text-primary" : "text-muted"} aria-hidden />
                  <span className="flex-grow-1 text-truncate">{item.label}</span>
                  {item.hint && <span className="text-muted small text-truncate" style={{ maxWidth: 220 }}>{item.hint}</span>}
                </div>
              </div>
            );
          })}
          {items.length === 0 && !searching && <div className="px-3 py-4 text-center text-muted small">Nothing found for “{query.trim()}”.</div>}
          {searching && <div className="px-3 py-2 text-muted small" role="status">Searching…</div>}
        </div>

        <div className="d-flex justify-content-between px-3 py-2 border-top text-muted small">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open</span>
          <span aria-live="polite">{items.length} result{items.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

// Opens with Ctrl/⌘+K anywhere in /me, or from the sidebar button.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  return open ? <Palette onClose={() => setOpen(false)} /> : null;
}
