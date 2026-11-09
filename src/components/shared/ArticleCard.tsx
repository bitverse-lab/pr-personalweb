import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import { AiOutlineCalendar, AiOutlineClockCircle } from "react-icons/ai";
import { MdArrowForward } from "react-icons/md";
import type { Article } from "@/lib/data/articles";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="card blog blog-primary shadow rounded overflow-hidden border-0">
      <div className="card-img image position-relative overflow-hidden">
        <div className="position-relative overflow-hidden">
          <CoverBlock src={article.image} title={article.title} ratio="16/9" compact />
          <div className="card-overlay"></div>
        </div>

        <div className="blog-tag">
          <Link href={`/articles/${article.slug}`} className="badge bg-light text-dark">
            {article.tag}
          </Link>
        </div>

        <div className="read-more">
          <Link href={`/articles/${article.slug}`} className="text-white title-dark-50">
            Read More <MdArrowForward className="align-middle ms-1" />
          </Link>
        </div>
      </div>

      <div className="card-body content p-0">
        <div className="p-4">
          <Link href={`/articles/${article.slug}`} className="h5 title text-dark d-block mb-0">
            {article.title}
          </Link>
          {article.excerpt && <p className="text-muted mt-2 mb-0">{article.excerpt}</p>}
        </div>

        <div className="post-meta d-flex justify-content-between p-4 border-top">
          <span className="text-muted">
            <AiOutlineCalendar className="me-1 align-middle" /> {article.date}
          </span>
          <span className="text-muted">
            <AiOutlineClockCircle className="me-1 align-middle" /> {article.readMinutes} min read
          </span>
        </div>
      </div>
    </div>
  );
}
