// Shared-element names for page transitions: a card's cover and title carry the same name as the
// detail page's image and heading, so the browser morphs one into the other.
export type VtKind = "cover" | "title" | "acover" | "atitle";

/** `{ viewTransitionName }` for an element; the slug is reduced to a valid CSS identifier. */
export function vt(kind: VtKind, slug: string): React.CSSProperties {
  return { viewTransitionName: `vt-${kind}-${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}` } as React.CSSProperties;
}
