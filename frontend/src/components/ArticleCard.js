import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatArticleDate } from "@/lib/articles";

export default function ArticleCard({ article }) {
  return (
    <Link
      href={`/owners/articles/${article.slug}`}
      className="group flex flex-col rounded-[28px] bg-white p-7 border border-slate-100 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8A6A4E]">{article.category}</p>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-[#411F0F]">{article.title}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{article.excerpt}</p>
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-slate-500">{formatArticleDate(article.date)} · {article.readMinutes} min read</span>
        <ArrowRight className="h-4 w-4 text-[#411F0F] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
