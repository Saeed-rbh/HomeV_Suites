import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OwnersHeader, OwnersFooter } from "@/components/OwnersChrome";
import ArticleCard from "@/components/ArticleCard";
import { ARTICLES, getArticle, formatArticleDate } from "@/lib/articles";

export function generateStaticParams() {
  return ARTICLES.map(article => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/owners/articles/${article.slug}` },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const isInvesting = article.category === "Investing";
  // Prefer related articles from the same category, then fill with the rest
  const others = ARTICLES.filter(a => a.slug !== article.slug);
  const more = [...others.filter(a => a.category === article.category), ...others.filter(a => a.category !== article.category)].slice(0, 3);

  return (
    <div className="bg-[#FBF6EC] min-h-full">
      <OwnersHeader />

      <article className="max-w-3xl mx-auto px-6 pt-10 pb-16 md:px-8 md:pt-14">
        <Link href="/owners/articles" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#411F0F] transition">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <p className="mt-8 text-[11px] font-bold tracking-[0.3em] uppercase text-[#8A6A4E]">{article.category}</p>
        <h1 className="mt-3 text-[2.1rem] md:text-[2.8rem] font-medium leading-[1.1] tracking-tight text-[#411F0F]">{article.title}</h1>
        <p className="mt-4 text-sm text-slate-500">HomEV Suites team · {formatArticleDate(article.date)} · {article.readMinutes} min read</p>

        <div className="mt-10 space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              {section.heading && <h2 className="text-xl md:text-2xl font-semibold text-[#411F0F]">{section.heading}</h2>}
              {section.paragraphs?.map((text, j) => (
                <p key={j} className={`${section.heading || j > 0 ? "mt-4" : ""} text-[17px] leading-[1.75] text-slate-700`}>{text}</p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map(item => (
                    <li key={item} className="flex gap-3 text-[17px] leading-[1.6] text-slate-700">
                      <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8A6A4E]" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {article.disclaimer && (
          <p className="mt-12 rounded-2xl border border-slate-200 bg-white/60 px-5 py-4 text-sm leading-relaxed text-slate-500">
            This article is general information only. It isn't financial, legal, tax or real estate advice. Speak with a licensed professional about your own situation.
          </p>
        )}

        <div className="mt-14 rounded-[28px] bg-[#411F0F] p-8 md:p-10 text-white">
          <h2 className="text-2xl font-medium leading-tight">{isInvesting ? "Looking at a property to buy?" : "Thinking about handing over your property?"}</h2>
          <p className="mt-3 text-white/75 leading-relaxed">
            {isInvesting
              ? "Send it to us before you make an offer. We'll estimate rent, costs and renovation, and tell you which strategy fits."
              : "Get a free assessment. We'll compare long-term, mid-term and short-term options for your unit and show you what each could earn."}
          </p>
          <a href={isInvesting ? "/owners/investors#get-started" : "/owners#get-started"} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FBF6EC] px-6 py-3 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all">
            {isInvesting ? "Request a pre-purchase analysis" : "Get my free assessment"} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-[#F5ECDD]/60 py-16">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="text-2xl font-medium text-[#411F0F]">More for owners</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {more.map(a => <ArticleCard key={a.slug} article={a} />)}
            </div>
          </div>
        </section>
      )}

      <OwnersFooter />
    </div>
  );
}
