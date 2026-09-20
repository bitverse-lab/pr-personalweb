import { notFound } from "next/navigation";
import ArticleEditor from "@/components/me/content/ArticleEditor";
import { getMyArticle, getMyTagNames } from "@/features/content/article-actions";

export default async function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, tagNames] = await Promise.all([getMyArticle(id), getMyTagNames()]);
  if (!article) notFound();
  return (
    <div className="container-fluid py-4 px-4">
      <ArticleEditor key={article.id} article={article} tagSuggestions={tagNames} />
    </div>
  );
}
