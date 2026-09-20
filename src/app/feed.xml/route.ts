import { getProfile } from "@/lib/data/profile";
import { articleService } from "@/server/services/article-service";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const xml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// RSS 2.0 feed of published articles.
export async function GET() {
  const base = siteUrl();
  const profile = await getProfile();
  const site = profile.isPlaceholder ? "Personal OS" : profile.fullName;
  const articles = await articleService.published(50).catch(() => []);

  const items = articles
    .map(
      (a) => `    <item>
      <title>${xml(a.title)}</title>
      <link>${base}/articles/${xml(a.slug)}</link>
      <guid isPermaLink="true">${base}/articles/${xml(a.slug)}</guid>
      ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""}
      ${a.excerpt ? `<description>${xml(a.excerpt)}</description>` : ""}
      ${a.tags.map((t) => `<category>${xml(t)}</category>`).join("")}
    </item>`
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(site)} — Articles</title>
    <link>${base}/articles</link>
    <description>${xml(profile.isPlaceholder ? "Articles" : profile.headline || `Articles by ${site}`)}</description>
    <language>en</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
