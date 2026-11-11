import { ArticleDetailPage, articleMetadata } from "../../_views/article";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return articleMetadata("en", (await params).slug);
}

// Deliberately not wrapped in publicRead (CLAUDE.md): null means "no such article" -> 404; an outage must error.
export default async function Article({ params }: Props) {
  return <ArticleDetailPage locale="en" slug={(await params).slug} />;
}
