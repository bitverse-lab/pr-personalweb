const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [String.fromCharCode(0x2028)]: "\\u2028",
  [String.fromCharCode(0x2029)]: "\\u2029",
};

// Structured data for search engines. The JSON is escaped so that no value can ever close the <script> tag.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ "@context": "https://schema.org", ...data }).replace(new RegExp(`[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, "g"), (c) => ESCAPES[c]);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
