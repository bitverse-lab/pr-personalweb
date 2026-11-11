import { ArticlesPage, articlesMetadata } from "../_views/articles";

export const metadata = articlesMetadata("en");

export default function Articles({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  return <ArticlesPage searchParams={searchParams} locale="en" />;
}
