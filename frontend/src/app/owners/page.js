import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Megaphone, UserCheck, FileSignature, Wallet, Wrench, ClipboardCheck, ShieldCheck,
  FileText, TrendingUp, CalendarRange, Hammer, Users, Check, ChevronDown, KeyRound, Sofa, Moon, Target,
} from "lucide-react";
import OwnerInquiryForm from "@/components/OwnerInquiryForm";
import ArticleCard from "@/components/ArticleCard";
import { OwnersHeader, OwnersFooter, SectionHeading, IconCard } from "@/components/OwnersChrome";
import { getPortfolioSnapshot } from "@/lib/server-fetch";
import { ARTICLES } from "@/lib/articles";

export const metadata = {
  title: "Property Management for Owners",
  description:
    "Full-service property management in Toronto for long-term, mid-term and short-term rentals. Tenants, rent, maintenance and everything else handled for you.",
};

const PLANS = [
  {
    icon: KeyRound,
    name: "Long-term rental management",
    tagline: "Steady monthly rent, completely hands-off.",
    bullets: [
      "Rent pricing and marketing",
      "Showings and full tenant screening",
      "Ontario Standard Lease and move-in inspection",
      "Rent collection and follow-up",
      "Maintenance, repairs and inspections",
      "Renewals, notices and move-outs",
    ],
    featured: true,
  },
  {
    icon: Sofa,
    name: "Furnished mid-term rentals",
    tagline: "Higher rent from 1 to 12 month stays.",
    bullets: [
      "Furnishing and setup if needed",
      "Professionals, medical staff and relocating families",
      "Utilities, internet and cleaning arranged",
      "Allowed in more buildings than nightly stays",
      "Switch to long-term whenever you like",
    ],
  },
  {
    icon: Moon,
    name: "Short-term rental management",
    tagline: "Nightly stays, where your property qualifies.",
    bullets: [
      "Dynamic nightly pricing",
      "Listings on the major booking platforms",
      "Guest communication from booking to check-out",
      "Hotel-standard cleaning and linens",
      "City registration and building rules",
    ],
  },
];

const SERVICES = [
  { icon: Megaphone, title: "Marketing & leasing", body: "Professional photos, listings that reach the right renters, and showings handled for you." },
  { icon: UserCheck, title: "Tenant & guest screening", body: "Identity, income, credit and references checked, with the same fair process for every applicant." },
  { icon: FileSignature, title: "Leases & paperwork", body: "Ontario Standard Lease, renewals, notices and records prepared correctly and on time." },
  { icon: Wallet, title: "Rent collection", body: "Rent collected every month, with immediate follow-up if a payment is late." },
  { icon: Wrench, title: "Maintenance & repairs", body: "Tenant calls go to us, and repairs go to our in-house Homev Construction team." },
  { icon: ClipboardCheck, title: "Inspections", body: "Documented move-in and move-out inspections, plus regular check-ins with proper notice." },
  { icon: ShieldCheck, title: "Rules & compliance", body: "We follow Ontario's tenancy rules, your building's rules and the City's rental requirements." },
  { icon: FileText, title: "Owner reporting", body: "Clear statements showing rent received, payouts and every expense for your property." },
];

const INCOME_LEVERS = [
  { icon: Target, title: "The right strategy for your unit", body: "We compare long-term, mid-term and short-term income for your property and building, and recommend the one that nets you the most." },
  { icon: TrendingUp, title: "Rent priced on real data", body: "Market rent based on comparable units for leases, and demand-based pricing for furnished and nightly stays." },
  { icon: CalendarRange, title: "Less time empty", body: "We market early, handle renewals ahead of time and turn units over quickly, so vacancy stays short." },
  { icon: Hammer, title: "Protecting your property's value", body: "Good tenants, preventive maintenance and quality repairs keep your property in shape and your costs down." },
];

const REASONS = [
  { icon: Users, title: "Local and hands-on", body: "We're based in Toronto and manage homes here ourselves, so someone is always close to your property." },
  { icon: Hammer, title: "Our own construction team", body: "Homev Construction handles repairs, upgrades and renovations, so problems are fixed quickly and done right." },
  { icon: FileText, title: "Nothing hidden", body: "You see every payment and expense. Questions get a straight answer from a real person." },
  { icon: ShieldCheck, title: "Your property, protected", body: "Careful screening, proper leases and regular inspections keep your property and your income safe." },
];

const STEPS = [
  { title: "Free consultation", body: "Tell us about your property and your goals." },
  { title: "Income assessment", body: "We review your unit, building rules and the market, and compare what each rental option could earn." },
  { title: "Setup", body: "Repairs or furnishing if needed, photos, marketing and screening the right tenant or guests." },
  { title: "Hands-off income", body: "We run everything day to day while you follow along in your statements." },
];

const FAQS = [
  { q: "Do you manage regular long-term rentals?", a: "Yes. We fully manage long-term leases: finding and screening the tenant, the lease, rent collection, maintenance, inspections, renewals and move-outs. You don't need to deal with the tenant at all." },
  { q: "What kind of properties do you manage?", a: "Condos, houses and townhouses in Toronto, furnished or unfurnished." },
  { q: "How do you choose tenants?", a: "Every applicant is checked the same way: identity, income and employment, credit, and references from current and past landlords. We recommend the strongest applicant and explain why." },
  { q: "What happens if a tenant stops paying rent?", a: "We follow up right away, serve the correct notices and guide you through the Landlord and Tenant Board process, working with a licensed paralegal when a hearing is needed." },
  { q: "Who handles repairs?", a: "We do. Tenants contact us, and work is done by our in-house Homev Construction team or trusted trades." },
  { q: "Can you help before I buy a property?", a: "Yes. We'll estimate rent and costs for each rental strategy, check the building's rules and price any renovation, so you can decide before you make an offer. See our investor services." },
  { q: "Are short-term rentals allowed in my building?", a: "It depends on your condo's rules and the City of Toronto's short-term rental regulations. We review both first. Where nightly stays aren't allowed, furnished stays of 28 nights or more or a long-term lease are strong alternatives." },
];

export default async function OwnersPage() {
  const { photos, rating } = await getPortfolioSnapshot();
  const heroPhoto = photos[1] || photos[0] || "/hero-villa.png";
  const insetPhoto = photos[2] || photos[0] || "/hero-villa.png";

  return (
    <div className="bg-[#FBF6EC] min-h-full">
      <OwnersHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">Property management · Toronto</p>
          <h1 className="mt-4 text-[2.6rem] md:text-[3.6rem] font-medium leading-[1.04] tracking-tight text-[#411F0F]">
            Your property, fully managed.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
            Long-term tenants or short-stay guests: we find them, collect the rent, handle repairs and look after your property, so you get the income without the work.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#get-started" className="inline-flex items-center gap-2 rounded-full bg-[#411F0F] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#472312] transition">
              Get a free income assessment <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#plans" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-[#411F0F] hover:bg-slate-50 transition">
              See management plans
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#411F0F]">
            {["Long-term leases", "Furnished mid-term", "Short-term stays"].map(item => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#8A6A4E]" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(65,31,15,0.5)]">
            <Image src={heroPhoto} alt="A home managed by HomEV" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-44 aspect-square rounded-[24px] overflow-hidden border-[6px] border-[#FBF6EC] shadow-xl">
            <Image src={insetPhoto} alt="" fill sizes="176px" className="object-cover" />
          </div>
          {rating && (
            <div className="absolute -top-4 -right-2 sm:right-6 rounded-2xl bg-white px-4 py-3 shadow-lg border border-slate-100">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Guest rating</p>
              <p className="text-xl font-semibold text-[#411F0F]">★ {rating.toFixed(2)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="Management plans" title="Choose how your property earns" body="Whether you want one reliable tenant or a furnished suite for travellers, we manage it from start to finish." />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {PLANS.map(({ icon: Icon, name, tagline, bullets, featured }) => (
              <div key={name} className={`relative flex flex-col rounded-[28px] p-8 border ${featured ? "bg-[#411F0F] text-white border-[#411F0F] shadow-[0_24px_60px_-28px_rgba(65,31,15,0.7)]" : "bg-white border-slate-100 shadow-sm"}`}>
                {featured && <span className="absolute top-6 right-6 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide">Most popular</span>}
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${featured ? "bg-white/10 border border-white/20" : "bg-[#FBF6EC]"}`}>
                  <Icon className={`h-5 w-5 ${featured ? "text-white" : "text-[#411F0F]"}`} />
                </div>
                <h3 className={`mt-5 text-xl font-semibold ${featured ? "" : "text-[#411F0F]"}`}>{name}</h3>
                <p className={`mt-2 text-[15px] ${featured ? "text-white/75" : "text-slate-600"}`}>{tagline}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {bullets.map(item => (
                    <li key={item} className={`flex gap-3 text-[15px] ${featured ? "text-white/90" : "text-slate-700"}`}>
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-white" : "text-[#8A6A4E]"}`} /> {item}
                    </li>
                  ))}
                </ul>
                <a href="#get-started" className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${featured ? "bg-[#FBF6EC] text-[#411F0F] hover:bg-white" : "bg-[#411F0F] text-white hover:bg-[#472312]"}`}>
                  Get a free assessment <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[15px] text-slate-600">
            Not sure which fits? We'll compare all three for your property in your free assessment.
          </p>
        </div>
      </section>

      {/* Investors */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pt-16 md:pt-24">
        <Link href="/owners/investors" className="group flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[32px] bg-white border border-slate-100 shadow-sm p-8 md:p-10 transition hover:shadow-md">
          <div className="max-w-2xl">
            <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">Buying a rental?</p>
            <h2 className="mt-3 text-2xl md:text-[2rem] font-medium leading-tight text-[#411F0F]">Run the numbers with us before you buy</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">Pre-purchase rental analysis, renovation estimates from Homev Construction, and BRRRR support from rehab to lease-up.</p>
          </div>
          <span className="inline-flex items-center gap-2 self-start md:self-center rounded-full bg-[#411F0F] px-6 py-3 text-sm font-semibold text-white whitespace-nowrap group-hover:gap-3 transition-all">
            Investor services <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="What we do" title="Everything handled, end to end" body="One team takes care of every part of renting your property, so you don't have to." />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(s => <IconCard key={s.title} {...s} />)}
          </div>
        </div>
      </section>

      {/* Income */}
      <section id="revenue" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12">
          <div className="lg:sticky lg:top-28 self-start">
            <SectionHeading eyebrow="Earn more" title="How we grow your income" body="Higher rent, less vacancy and lower costs over time. These are the levers we pull for every property." />
            <a href="#get-started" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all">
              See what your property could earn <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {INCOME_LEVERS.map(l => <IconCard key={l.title} {...l} />)}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why-us" className="scroll-mt-20 bg-[#411F0F] py-16 md:py-24 text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <p className="text-white/60 text-[11px] font-bold tracking-[0.3em] uppercase">Why HomEV</p>
          <h2 className="mt-3 max-w-2xl text-[2rem] md:text-[2.6rem] font-medium leading-[1.1] tracking-tight">Why owners work with us</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {REASONS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 border border-white/15">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="How it works" title="From first call to first rent payment" />
          <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-[28px] border border-slate-200 p-7">
                <span className="text-sm font-bold text-[#8A6A4E]">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-[#411F0F]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <SectionHeading eyebrow="Owner resources" title="Articles for property owners" />
            <Link href="/owners/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all shrink-0">
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTICLES.filter(article => article.category !== "Investing").slice(0, 3).map(article => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>

      {/* Get started */}
      <section id="get-started" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12">
          <div>
            <SectionHeading eyebrow="Get started" title="Get your free income assessment" body="Tell us about your property. We'll look at your unit, your building and the market, then show you what it could earn and how we'd manage it." />
            <ul className="mt-8 space-y-3">
              {["No cost, no obligation", "Long-term, mid-term and short-term compared", "Answers from a real person on our team"].map(item => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-[#411F0F]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#411F0F]"><Check className="h-3.5 w-3.5 text-white" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
            <OwnerInquiryForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="FAQ" title="Questions owners ask" />
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold text-[#411F0F]">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#8A6A4E] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <OwnersFooter />
    </div>
  );
}
