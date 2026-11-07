import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Camera, TrendingUp, Globe, MessageCircle, Sparkles, Wrench, ShieldCheck,
  FileText, CalendarRange, Paintbrush, Star, Users, Hammer, Check, ChevronDown,
} from "lucide-react";
import OwnerInquiryForm from "@/components/OwnerInquiryForm";
import { getPortfolioSnapshot } from "@/lib/server-fetch";

export const metadata = {
  title: "Property Management for Owners",
  description:
    "Full-service short and mid-term rental management in Toronto. Pricing, listings, guests, cleaning and maintenance handled for you.",
};

const SERVICES = [
  { icon: Camera, title: "Listing setup & photography", body: "Professional photos, a listing written to convert, and everything set up across booking platforms." },
  { icon: TrendingUp, title: "Dynamic pricing", body: "Nightly rates adjusted for season, events, day of week and demand, so you never leave money on the table." },
  { icon: MessageCircle, title: "Guest communication", body: "We answer every inquiry, screen guests and look after them from booking to check-out." },
  { icon: Sparkles, title: "Cleaning & linens", body: "Hotel-standard turnovers, fresh linens and restocked essentials after every stay." },
  { icon: Wrench, title: "Maintenance & repairs", body: "Issues handled fast by our in-house Homev Construction team, not a stranger from a list." },
  { icon: ShieldCheck, title: "Rules & compliance", body: "We work within your building's rules and the City of Toronto's short-term rental requirements." },
  { icon: FileText, title: "Owner reporting", body: "Clear statements showing every booking, payout and expense for your unit." },
  { icon: Paintbrush, title: "Furnishing & design", body: "Need to furnish or refresh? We design and set up suites guests want to book." },
];

const REVENUE_LEVERS = [
  { icon: TrendingUp, title: "Smarter pricing, every night", body: "Rates move with demand: higher on concert, conference and holiday dates, sharper in quiet weeks to keep the calendar full." },
  { icon: Globe, title: "More channels, more bookings", body: "Your unit is listed on the major booking platforms and on homevsuites.com, where direct bookings skip the platform fees." },
  { icon: CalendarRange, title: "The right mix of stays", body: "We combine short stays with furnished stays of 28+ nights for corporate, medical and relocation guests to fill slow months." },
  { icon: Star, title: "Reviews that raise your rate", body: "Spotless suites and responsive hosting earn top reviews, and top reviews earn better placement and higher prices." },
];

const REASONS = [
  { icon: Users, title: "Local and hands-on", body: "We're based in Toronto and manage suites in Yorkville ourselves, so someone is always close to your property." },
  { icon: Hammer, title: "Our own construction team", body: "Homev Construction handles repairs, upgrades and renovations, so problems are fixed quickly and done right." },
  { icon: FileText, title: "Nothing hidden", body: "You see every booking, payout and expense. Questions get a straight answer from a real person." },
  { icon: ShieldCheck, title: "Your home, protected", body: "Guest screening, clear house rules and regular inspections keep your property in great shape." },
];

const STEPS = [
  { title: "Free consultation", body: "Tell us about your property and your goals." },
  { title: "Revenue assessment", body: "We review your unit, building rules and the market, and show you what it could earn." },
  { title: "Setup", body: "Furnishing if needed, photos, listings and registration, all handled for you." },
  { title: "Go live & earn", body: "We run everything day to day while you follow along in your statements." },
];

const FAQS = [
  { q: "What kind of properties do you manage?", a: "Condos, houses and townhouses in Toronto, furnished or unfurnished. If it isn't furnished yet, we can take care of that too." },
  { q: "Are short-term rentals allowed in my building?", a: "It depends on your condo's rules and the City of Toronto's short-term rental regulations. We review both before going live. Where short stays aren't allowed, furnished stays of 28 nights or more are often a strong alternative." },
  { q: "Can I still use my property?", a: "Yes. Let us know the dates you need and we'll keep them blocked off for you." },
  { q: "Who takes care of cleaning and repairs?", a: "We do. Cleaning is handled after every stay, and repairs go to our in-house Homev Construction team." },
];

function SectionHeading({ eyebrow, title, body }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-[2rem] md:text-[2.6rem] font-medium leading-[1.1] tracking-tight text-[#411F0F]">{title}</h2>
      {body && <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{body}</p>}
    </div>
  );
}

function IconCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[28px] bg-white p-7 border border-slate-100 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF6EC]">
        <Icon className="h-5 w-5 text-[#411F0F]" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[#411F0F]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

export default async function OwnersPage() {
  const { photos, count, rating } = await getPortfolioSnapshot();
  const heroPhoto = photos[1] || photos[0] || "/hero-villa.png";
  const insetPhoto = photos[2] || photos[0] || "/hero-villa.png";

  return (
    <div className="bg-[#FBF6EC] min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FBF6EC]/85 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-4 md:px-8">
          <Link href="/" className="flex items-center shrink-0">
            <img src="/homev-suites-logo.png" alt="HomEV Suites" className="h-9 md:h-10 w-auto object-contain mix-blend-multiply" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-[#411F0F] transition">Services</a>
            <a href="#revenue" className="hover:text-[#411F0F] transition">Revenue</a>
            <a href="#why-us" className="hover:text-[#411F0F] transition">Why us</a>
            <a href="#faq" className="hover:text-[#411F0F] transition">FAQ</a>
            <Link href="https://book.homevsuites.com" className="hover:text-[#411F0F] transition">Book a stay</Link>
          </nav>
          <a href="#get-started" className="rounded-full bg-[#411F0F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#472312] transition whitespace-nowrap">
            Get started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">Property management · Toronto</p>
          <h1 className="mt-4 text-[2.6rem] md:text-[3.6rem] font-medium leading-[1.04] tracking-tight text-[#411F0F]">
            Your property, managed like a five-star suite.
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
            We run everything from pricing and listings to guests, cleaning and repairs, so your unit earns more and you don't lift a finger.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#get-started" className="inline-flex items-center gap-2 rounded-full bg-[#411F0F] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#472312] transition">
              Get a free revenue assessment <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="https://book.homevsuites.com" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-[#411F0F] hover:bg-slate-50 transition">
              See the suites we manage
            </Link>
          </div>
          {(count > 0 || rating) && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {rating && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Average guest rating</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-2xl font-semibold text-[#411F0F]">
                    <Star className="h-5 w-5 fill-[#8A6A4E] text-[#8A6A4E]" /> {rating.toFixed(2)}
                  </dd>
                </div>
              )}
              {count > 0 && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Suites live now</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#411F0F]">{count}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(65,31,15,0.5)]">
            <Image src={heroPhoto} alt="A suite managed by HomEV" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-44 aspect-square rounded-[24px] overflow-hidden border-[6px] border-[#FBF6EC] shadow-xl">
            <Image src={insetPhoto} alt="" fill sizes="176px" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionHeading eyebrow="What we do" title="Full-service management, end to end" body="One team takes care of every part of hosting, so you don't have to." />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(s => <IconCard key={s.title} {...s} />)}
          </div>
        </div>
      </section>

      {/* Revenue */}
      <section id="revenue" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12">
          <div className="lg:sticky lg:top-28 self-start">
            <SectionHeading eyebrow="Earn more" title="How we grow your revenue" body="Higher nightly rates and fewer empty nights. These are the levers we pull for every property." />
            <a href="#get-started" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#411F0F] hover:gap-3 transition-all">
              See what your unit could earn <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {REVENUE_LEVERS.map(l => <IconCard key={l.title} {...l} />)}
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
          <SectionHeading eyebrow="How it works" title="From first call to first booking" />
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

      {/* Get started */}
      <section id="get-started" className="scroll-mt-20 bg-[#F5ECDD]/60 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12">
          <div>
            <SectionHeading eyebrow="Get started" title="Get your free revenue assessment" body="Tell us about your property. We'll look at your unit, your building and the market, then come back with what it could earn and how we'd run it." />
            <ul className="mt-8 space-y-3">
              {["No cost, no obligation", "A clear plan for your property", "Answers from a real person on our team"].map(item => (
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
      <section id="faq" className="scroll-mt-20 py-16 md:py-24">
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

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} HomEV Suites · Toronto</p>
          <div className="flex items-center gap-6">
            <Link href="https://book.homevsuites.com" className="hover:text-[#411F0F] transition">Book a stay</Link>
            <Link href="/contact" className="hover:text-[#411F0F] transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
