import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, Building2 } from "lucide-react";
import { getPortfolioSnapshot } from "@/lib/server-fetch";

export default async function LandingPage({ searchParams }) {
  // Older search links put booking params on "/", so send those straight to the listings
  const params = new URLSearchParams(await searchParams);
  if (params.has("checkIn") || params.has("checkOut") || params.has("guests")) {
    redirect(`/stays?${params.toString()}`);
  }

  const { photos } = await getPortfolioSnapshot();
  const guestPhoto = photos[0] || "/hero-villa.png";
  const ownerPhoto = photos[1] || photos[0] || "/hero-villa.png";

  const paths = [
    {
      href: "https://book.homevsuites.com",
      photo: guestPhoto,
      icon: KeyRound,
      eyebrow: "For guests",
      title: "I'm looking to book a stay",
      body: "Browse our furnished suites in Yorkville, check live availability and book direct.",
      cta: "Browse our suites",
    },
    {
      href: "/owners",
      photo: ownerPhoto,
      icon: Building2,
      eyebrow: "For property owners",
      title: "I want my property managed",
      body: "Full-service management for long-term tenants, furnished stays and short-term rentals.",
      cta: "Explore management services",
    },
  ];

  return (
    <div className="min-h-full bg-[#FBF6EC] flex flex-col">
      <header className="flex items-center justify-between px-6 pt-6 md:px-12 md:pt-8">
        <Link href="/" className="flex items-center">
          <img src="/homev-suites-logo.png" alt="HomEV Suites" className="h-10 md:h-11 w-auto object-contain mix-blend-multiply" />
        </Link>
        <Link href="/contact" className="text-sm font-medium text-[#8A6A4E] hover:text-[#411F0F] transition">
          Contact us
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 md:py-12">
        <div className="max-w-6xl w-full mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-[#8A6A4E] text-[11px] font-bold tracking-[0.3em] uppercase">Yorkville · Toronto</p>
            <h1 className="mt-4 text-[2.4rem] md:text-[3.6rem] font-medium leading-[1.05] tracking-tight text-[#411F0F]">
              Welcome to HomEV Suites
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-600">How can we help you today?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {paths.map(({ href, photo, icon: Icon, eyebrow, title, body, cta }) => (
              <Link
                key={href}
                href={href}
                className="group relative block overflow-hidden rounded-[32px] min-h-[340px] md:min-h-[460px] shadow-[0_20px_60px_-25px_rgba(65,31,15,0.45)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8A6A4E]"
              >
                <Image
                  src={photo}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#411F0F]/95 via-[#411F0F]/45 to-[#411F0F]/5" />

                <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-7 md:p-9">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur border border-white/25">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[11px] font-bold tracking-[0.3em] uppercase">{eyebrow}</p>
                    <h2 className="mt-3 text-[1.9rem] md:text-[2.4rem] font-medium leading-[1.1] tracking-tight text-white">{title}</h2>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80">{body}</p>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FBF6EC] px-6 py-3 text-sm font-semibold text-[#411F0F] transition group-hover:gap-3">
                      {cta} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
