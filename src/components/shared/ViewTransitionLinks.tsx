"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type Doc = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };

/**
 * Links marked `data-vt` navigate inside a View Transition, so a card's cover and title (named with
 * lib/view-transition) fly into place on the detail page. Next 14 has no built-in support: the
 * click is taken in the capture phase, the route pushed inside the transition, and the transition
 * ends once the new path has rendered. Browsers without the API, reduced motion and modified
 * clicks (new tab, etc.) get the ordinary link.
 */
export default function ViewTransitionLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  // The new route has rendered: let the transition capture it.
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
  }, [pathname]);

  useEffect(() => {
    const doc = document as Doc;
    if (!doc.startViewTransition) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[data-vt]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== location.origin) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const href = a.pathname + a.search + a.hash;
      if (a.pathname === location.pathname) return;
      e.preventDefault();
      doc.startViewTransition!(
        () =>
          new Promise<void>((resolve) => {
            // A slow page must not freeze the screen: give up waiting after a moment.
            const timer = window.setTimeout(resolve, 900);
            arrived.current = () => {
              window.clearTimeout(timer);
              resolve();
            };
            router.push(href);
          })
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
