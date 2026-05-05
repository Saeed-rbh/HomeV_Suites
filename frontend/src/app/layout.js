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
  title: "HomEV Toronto",
  description: "Glassmorphism rental booking experience for Toronto stays",
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
