import type { HeadingInfo } from "@/features/content/richtext";

// "On this page": shown for longer articles. Plain anchor links, so it works without JavaScript.
export default function ArticleToc({ headings }: { headings: HeadingInfo[] }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="Table of contents" className="rounded bg-light p-3 mb-4">
      <p className="h6 mb-2">On this page</p>
      <ol className="list-unstyled mb-0 small">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ms-3" : ""}>
            <a href={`#${h.id}`} className="text-muted text-decoration-none d-block py-1">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
