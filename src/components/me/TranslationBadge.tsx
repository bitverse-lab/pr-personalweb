import { coverage } from "@/features/content/translations";

// How much of an item has an Indonesian version, beside its status in the /me lists.
export default function TranslationBadge({ translations, fields }: { translations: { id?: Record<string, unknown> } | null | undefined; fields: string[] }) {
  const { done, total } = coverage(translations, fields);
  const label = done === 0 ? "ID missing" : done === total ? "ID ✓" : `ID ${done}/${total}`;
  return (
    <span className={`badge ${done === total ? "bg-soft-success text-success" : "bg-light text-muted"}`} title={`Indonesian version: ${done} of ${total} fields written`}>
      {label}
    </span>
  );
}
