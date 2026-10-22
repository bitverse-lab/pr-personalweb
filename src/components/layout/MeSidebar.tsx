"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OPEN_SEARCH_EVENT } from "@/components/me/CommandPalette";
import type { IconType } from "react-icons";
import {
  FiHome,
  FiCalendar,
  FiCheckSquare,
  FiBriefcase,
  FiHeart,
  FiBook,
  FiFileText,
  FiFolder,
  FiImage,
  FiMessageSquare,
  FiInbox,
  FiSettings,
  FiUser,
  FiShield,
  FiDatabase,
  FiMenu,
  FiSearch,
  FiX,
  FiLogOut,
} from "react-icons/fi";

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface NavGroup {
  title: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [
      { label: "Overview", href: "/me", icon: FiHome },
      { label: "Inbox", href: "/me/inbox", icon: FiInbox },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "Calendar", href: "/me/calendar", icon: FiCalendar },
      { label: "Tasks", href: "/me/tasks", icon: FiCheckSquare },
      { label: "Career", href: "/me/career", icon: FiBriefcase },
    ],
  },
  {
    title: "Life",
    items: [
      { label: "Health", href: "/me/health", icon: FiHeart },
      { label: "Journal", href: "/me/journal", icon: FiBook },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Projects", href: "/me/projects", icon: FiFolder },
      { label: "Articles", href: "/me/articles", icon: FiFileText },
      { label: "Testimonials", href: "/me/testimonials", icon: FiMessageSquare },
      { label: "Media", href: "/me/media", icon: FiImage },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Settings", href: "/me/settings", icon: FiSettings },
      { label: "Profile", href: "/me/settings/profile", icon: FiUser },
      { label: "Account", href: "/me/settings/account", icon: FiShield },
      { label: "Data", href: "/me/settings/data", icon: FiDatabase },
    ],
  },
];

interface MeSidebarProps {
  user: { name?: string | null; email?: string | null };
  unreadMessages?: number;
  signOutAction: () => Promise<void>;
}

function isActive(pathname: string, href: string): boolean {
  return href === "/me" ? pathname === "/me" : pathname.startsWith(href);
}

function SearchButton({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center gap-2 mb-3 text-start"
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
      }}
      aria-label="Search and commands (Ctrl+K)"
    >
      <FiSearch aria-hidden /> <span className="flex-grow-1">Search…</span> <kbd className="small">Ctrl K</kbd>
    </button>
  );
}

function NavLinks({ pathname, onNavigate, unread = 0 }: { pathname: string; onNavigate?: () => void; unread?: number }) {
  // Highlight the clicked item immediately instead of waiting for the new page to arrive.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);
  const current = pending ?? pathname;
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.title ?? "root"} className="mb-3">
          {group.title && <div className="me-nav-group-title px-3 mb-1">{group.title}</div>}
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setPending(item.href);
                onNavigate?.();
              }}
              aria-current={isActive(current, item.href) ? "page" : undefined}
              className={`me-nav-link ${isActive(current, item.href) ? "active" : ""}`}
            >
              <item.icon /> {item.label}
              {item.href === "/me/inbox" && unread > 0 && (
                <span className="badge bg-primary ms-auto" aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}>{unread}</span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

function UserFooter({ user, signOutAction }: MeSidebarProps) {
  return (
    <div className="mt-auto pt-3 border-top">
      <div className="mb-2">
        <div className="fw-medium small text-truncate">{user.name}</div>
        <div className="text-muted small text-truncate">{user.email}</div>
      </div>
      <form action={signOutAction}>
        <button type="submit" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
          <FiLogOut /> Sign out
        </button>
      </form>
    </div>
  );
}

export default function MeSidebar({ user, signOutAction, unreadMessages = 0 }: MeSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // The mobile menu behaves like a dialog: Escape closes it and focus moves into it while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKey);
    document.querySelector<HTMLElement>(".me-drawer a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <aside className="me-sidebar d-none d-lg-flex flex-column">
        <div className="me-sidebar-brand">Personal OS</div>
        <SearchButton />
        <nav aria-label="Main navigation" className="flex-grow-1 overflow-auto">
          <NavLinks pathname={pathname} unread={unreadMessages} />
        </nav>
        <UserFooter user={user} signOutAction={signOutAction} />
      </aside>

      <header className="me-topbar d-lg-none d-flex align-items-center justify-content-between px-3">
        <span className="me-sidebar-brand mb-0">Personal OS</span>
        <span className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-primary" aria-label="Search and commands" onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}>
            <FiSearch />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </span>
      </header>

      {isOpen && (
        <>
          <div role="presentation" className="me-drawer-backdrop d-lg-none" onClick={() => setIsOpen(false)} />
          <aside className="me-drawer d-lg-none d-flex flex-column" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="me-sidebar-brand">Personal OS</div>
            <nav aria-label="Main navigation" className="flex-grow-1 overflow-auto">
              <NavLinks pathname={pathname} onNavigate={() => setIsOpen(false)} unread={unreadMessages} />
            </nav>
            <UserFooter user={user} signOutAction={signOutAction} />
          </aside>
        </>
      )}
    </>
  );
}
