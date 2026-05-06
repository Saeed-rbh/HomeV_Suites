import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://homev.ca"),
  title: {
    template: "%s | HomEV",
    default: "HomEV | Premium Vacation Rentals in Toronto",
  },
  description:
    "Discover curated premium vacation rentals and luxury short-term stays in Toronto. Easy online booking, transparent pricing, and a seamless experience.",
  keywords: [
    "Toronto vacation rentals",
    "luxury stays Toronto",
    "premium Airbnb alternative",
    "short term rentals Toronto",
    "furnished rentals Toronto",
    "HomEV",
    "HomEV Suites",
  ],
  authors: [{ name: "HomEV", url: "https://homev.ca" }],
  category: "travel",
  alternates: {
    canonical: "https://homev.ca",
  },
  openGraph: {
    title: "HomEV | Premium Vacation Rentals in Toronto",
    description:
      "Discover curated premium vacation rentals and luxury short-term stays in Toronto.",
    url: "https://homev.ca",
    siteName: "HomEV",
    images: [
      {
        url: "/hero-villa.png",
        width: 1200,
        height: 630,
        alt: "HomEV — Premium Vacation Properties in Toronto",
      },
    ],
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HomEV | Premium Vacation Rentals in Toronto",
    description:
      "Discover curated premium vacation rentals and luxury short-term stays in Toronto.",
    images: ["/hero-villa.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} md:h-full antialiased`}
    >
      <body className="md:h-full w-full bg-white md:overflow-hidden m-0 box-border">
        <div className="app-shell flex md:h-full flex-col relative md:rounded-[40px] overflow-x-hidden md:overflow-hidden md:border-[11px] border-white">
          <Suspense fallback={null}>
            <NavBar />
          </Suspense>
          <main className="flex-1 md:overflow-y-auto md:min-h-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
