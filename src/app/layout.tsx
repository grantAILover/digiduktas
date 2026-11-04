import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LtValidation from "@/components/LtValidation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const SITE_URL = "https://digiduktas.lt";
const TITLE = "digiduktas — DI pluginai, kurie atlieka rankų darbą už jus";
const DESCRIPTION =
  "DI pluginai pasikartojantiems darbams: sąskaitų tvarkymas, banko išrašų sutikrinimas ir daugiau. Įsidiekite patys arba leiskite mums viską įdiegti ir pritaikyti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · digiduktas",
  },
  description: DESCRIPTION,
  keywords: [
    "DI pluginai",
    "dirbtinio intelekto pluginai",
    "Claude pluginai",
    "sąskaitų apdorojimas",
    "banko išrašų sutikrinimas",
    "darbo automatizavimas",
    "digiduktas",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "lt_LT",
    url: SITE_URL,
    siteName: "digiduktas",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "digiduktas",
  url: SITE_URL,
  description: DESCRIPTION,
  inLanguage: "lt",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <LtValidation />
        <Analytics />
      </body>
    </html>
  );
}
