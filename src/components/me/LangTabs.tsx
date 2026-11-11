"use client";

export type EditLang = "en" | "id";

/**
 * Switches a /me form between its English fields and their Indonesian versions. The Indonesian side
 * shows how many fields are written; anything left empty shows the English on the /id pages.
 */
export default function LangTabs({ value, onChange, done, total }: { value: EditLang; onChange: (l: EditLang) => void; done: number; total: number }) {
  return (
    <div className="mb-3">
      <div className="btn-group btn-group-sm" role="group" aria-label="Language of the fields below">
        <button type="button" className={`btn ${value === "en" ? "btn-primary" : "btn-outline-primary"}`} aria-pressed={value === "en"} onClick={() => onChange("en")}>
          English
        </button>
        <button type="button" className={`btn ${value === "id" ? "btn-primary" : "btn-outline-primary"}`} aria-pressed={value === "id"} onClick={() => onChange("id")}>
          Bahasa Indonesia <span className="ms-1 opacity-75">{done}/{total}</span>
        </button>
      </div>
      {value === "id" && <p className="form-text mb-0 mt-2">Shown on the Indonesian pages (/id). A field left empty shows the English there.</p>}
    </div>
  );
}

/** Text of an Indonesian field, as the inputs hold it. */
export const trValue = (v: string | null | undefined) => v ?? "";
