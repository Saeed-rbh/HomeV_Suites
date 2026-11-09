import Link from "next/link";

const BOOKING_URL = "https://book.homevsuites.com";

// Header, footer and section pieces shared by the owner, investor and article pages
export function OwnersHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF6EC]/85 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center shrink-0">
          <img src="/homev-suites-logo.png" alt="HomEV Suites" className="h-9 md:h-10 w-auto object-contain mix-blend-multiply" />
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/owners#plans" className="hover:text-[#411F0F] transition">Management plans</a>
          <a href="/owners#services" className="hover:text-[#411F0F] transition">Services</a>
          <Link href="/owners/investors" className="hover:text-[#411F0F] transition">Investors</Link>
          <Link href="/owners/articles" className="hover:text-[#411F0F] transition">Articles</Link>
          <a href="/owners#faq" className="hover:text-[#411F0F] transition">FAQ</a>
          <Link href={BOOKING_URL} className="hover:text-[#411F0F] transition">Book a stay</Link>
        </nav>
        <a href="/owners#get-started" className="rounded-full bg-[#411F0F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#472312] transition whitespace-nowrap">
          Get started
        </a>
      </div>
    </header>
  );
}

export function OwnersFooter() {
  return (
    <footer className="border-t border-slate-200 py-8">
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} HomEV Suites · Toronto</p>
        <div className="flex items-center gap-6">
          <Link href="/owners" className="hover:text-[#411F0F] transition">Property management</Link>
          <Link href="/owners/investors" className="hover:text-[#411F0F] transition">Investors</Link>
          <Link href="/owners/articles" className="hover:text-[#411F0F] transition">Articles</Link>
          <Link href={BOOKING_URL} className="hover:text-[#411F0F] transition">Book a stay</Link>
          <Link href="/contact" className="hover:text-[#411F0F] transition">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export function SectionHeading({ eyebrow, title, body }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-[2rem] md:text-[2.6rem] font-medium leading-[1.1] tracking-tight text-[#411F0F]">{title}</h2>
      {body && <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">{body}</p>}
    </div>
  );
}

export function IconCard({ icon: Icon, title, body }) {
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
