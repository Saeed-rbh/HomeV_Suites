import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Calculator, Wallet, Building2, Hammer, Scale, TrendingUp, Check,
  KeyRound, Sofa, Moon, Home, Handshake,
} from "lucide-react";
import OwnerInquiryForm from "@/components/OwnerInquiryForm";
import ArticleCard from "@/components/ArticleCard";
import { OwnersHeader, OwnersFooter, SectionHeading, IconCard } from "@/components/OwnersChrome";
import { getPortfolioSnapshot } from "@/lib/server-fetch";
import { getArticlesByCategory } from "@/lib/articles";

export const metadata = {
  title: "Services for Real Estate Investors",
  description:
    "Buying a rental property in Toronto? Get a pre-purchase rental analysis, renovation estimate and a management plan, plus BRRRR support from renovation to lease-up.",
};

const ANALYSIS = [
  { icon: Calculator, title: "Rental income by strategy", body: "Realistic rent for a long-term lease, a furnished mid-term rental and, where eligible, short-term stays." },
  { icon: Wallet, title: "Costs and cash flow", body: "Condo fees, property tax, insurance, maintenance, management and vacancy, so you see what's really left." },
  { icon: Building2, title: "Building and rules check", body: "What the condo's documents mean for renting, including any short-term rental restrictions." },
  { icon: Hammer, title: "Renovation estimate", body: "Homev Construction scopes and prices the work needed to make it rent-ready or add value." },
  { icon: Scale, title: "Rent control and tenancy", body: "Whether the unit is exempt from the rent increase guideline, and what an existing tenant means for you." },
  { icon: TrendingUp, title: "Value after renovation", body: "How the planned work could affect rent and value, to inform a refinance plan with your lender." },
];

const BRRRR = [
  { letter: "B", step: "Buy", body: "You buy through your realtor, with our rental analysis and renovation estimate in hand.", ours: false },
  { letter: "R", step: "Rehab", body: "Homev Construction renovates, on a clear scope and budget.", ours: true },
  { letter: "R", step: "Rent", body: "We price, market and lease to a well-screened tenant.", ours: true },
  { letter: "R", step: "Refinance", body: "Your lender or mortgage broker refinances. We supply the rent and renovation records.", ours: false },
  { letter: "R", step: "Repeat", body: "We manage the property while you move on to the next one.", ours: true },
];

const STRATEGIES = [
  { icon: KeyRound, title: "Buy and hold", body: "A long-term lease to a strong tenant. Steady income, low effort, and value built over time." },
  { icon: Sofa, title: "Furnished mid-term", body: "Higher rent from stays of 1 to 12 months, in the right location and building." },
  { icon: Moon, title: "Short-term", body: "Only where the property qualifies. In Toronto that generally means your principal residence." },
  { icon: Home, title: "Add a unit", body: "Basement, garden or laneway suites on eligible lots, designed and built by Homev Construction." },
];

export default async function InvestorsPage() {
  const { photos } = await getPortfolioSnapshot();
  const heroPhoto = photos[3] || photos[0] || "/hero-villa.png";
  const articles = getArticlesByCategory("Investing");

  return (
    <div className="bg-[#FBF6EC] min-h-full">
      <OwnersHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">For investors · Toronto</p>
          <h1 className="mt-4 text-[2.6rem] md:text-[3.4rem] font-medium leading-[1.05] tracking-tight text-[#411F0F]">
            Buying a rental property? Run the numbers with us first.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
            Before you make an offer, we'll show you what the property could rent for, what it would cost to renovate and run, and which strategy fits. Once you buy, we can renovate it and manage it for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#get-started" className="inline-flex items-center gap-2 rounded-full bg-[#411F0F] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#472312] transition">
              Request a pre-purchase analysis <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#articles" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-[#411F0F] hover:bg-slate-50 transition">
              Read investor guides
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-[4/5] rounded-[32px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(65,31,15,0.5)]">
          <Image src={heroPhoto} alt="A renovated rental suite" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
      </section>

      {/* Analysis */}
      <section id="analysis" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="Pre-purchase analysis" title="What we look at before you buy" body="Send us the listing. We'll come back with the numbers and the risks, so you can make your offer with confidence or walk away." />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ANALYSIS.map(item => <IconCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      {/* BRRRR */}
      <section id="brrrr" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="BRRRR" title="Buy, rehab, rent, refinance, repeat, with the hard parts handled" body="The renovation and the rental are where most BRRRR plans go wrong. We handle both under one roof." />
          <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {BRRRR.map(({ letter, step, body, ours }) => (
              <li key={step} className={`flex flex-col rounded-[28px] p-6 border ${ours ? "bg-[#411F0F] border-[#411F0F] text-white" : "bg-white border-slate-200"}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold ${ours ? "bg-white/10 border border-white/20" : "bg-[#FBF6EC] text-[#411F0F]"}`}>{letter}</span>
                <h3 className={`mt-5 text-lg font-semibold ${ours ? "" : "text-[#411F0F]"}`}>{step}</h3>
                <p className={`mt-2 flex-1 text-[15px] leading-relaxed ${ours ? "text-white/75" : "text-slate-600"}`}>{body}</p>
                <p className={`mt-5 text-[11px] font-bold tracking-[0.2em] uppercase ${ours ? "text-white/60" : "text-[#8A6A4E]"}`}>{ours ? "We handle this" : "We support this"}</p>
              </li>
            ))}
          </ol>
          <Link href="/owners/articles/brrrr-strategy-toronto" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all">
            Read: BRRRR in Toronto, and where it gets hard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Strategies */}
      <section className="bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="Strategies" title="Other ways we help you invest" body="Pick the strategy first, then the property. We'll tell you honestly which ones fit your budget and goals." />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STRATEGIES.map(item => <IconCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      {/* Where we fit */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-[32px] bg-white border border-slate-100 shadow-sm p-8 md:p-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF6EC]">
              <Handshake className="h-5 w-5 text-[#411F0F]" />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-[#411F0F]">Where we fit in your team</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                We're your rental, renovation and management partner. We don't act as your real estate agent, lender or lawyer. We work alongside your realtor, mortgage professional and real estate lawyer, and if you need one, we're happy to introduce you to people we trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <SectionHeading eyebrow="Investor guides" title="Learn before you buy" />
            <Link href="/owners/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all shrink-0">
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(article => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>

      {/* Get started */}
      <section id="get-started" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12">
          <div>
            <SectionHeading eyebrow="Get started" title="Request a pre-purchase analysis" body="Tell us what you're looking at, or what you're looking for. We'll follow up to talk through your goals and the numbers." />
            <ul className="mt-8 space-y-3">
              {["Rent and cost estimates for each strategy", "Renovation scope and price from Homev Construction", "A management plan for after you buy"].map(item => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-[#411F0F]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#411F0F]"><Check className="h-3.5 w-3.5 text-white" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
            <OwnerInquiryForm variant="investor" />
          </div>
        </div>
        <p className="max-w-6xl mx-auto px-6 md:px-8 mt-12 text-sm text-slate-500">
          Our analysis is general information to help with your decision. It isn't financial, legal, tax or real estate advice.
        </p>
      </section>

      <OwnersFooter />
    </div>
  );
}
