import { OwnersHeader, OwnersFooter } from "@/components/OwnersChrome";
import ArticleCard from "@/components/ArticleCard";
import { ARTICLES } from "@/lib/articles";

export const metadata = {
  title: "Articles for Property Owners",
  description:
    "Guides for Toronto property owners on long-term, mid-term and short-term rentals, tenant screening, and getting the most from your property.",
};

export default function ArticlesPage() {
  return (
    <div className="bg-[#FBF6EC] min-h-full">
      <OwnersHeader />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24">
        <div className="max-w-2xl">
          <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">Owner resources</p>
          <h1 className="mt-4 text-[2.4rem] md:text-[3.2rem] font-medium leading-[1.05] tracking-tight text-[#411F0F]">
            Articles for property owners
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
            Practical guides on renting out your Toronto property, from finding the right tenant to choosing between long-term, mid-term and short-term rentals.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTICLES.map(article => <ArticleCard key={article.slug} article={article} />)}
        </div>
      </section>

      <OwnersFooter />
    </div>
  );
}
