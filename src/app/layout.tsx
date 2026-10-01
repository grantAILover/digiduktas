import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const SITE_URL = "https://digiduktas.lt";
const DESCRIPTION =
  "Lietuviška vieta pirkti ir parduoti skaitmeninius produktus: šablonus, presetus, e-knygas, kursus ir daugiau. Netrukus startuojame.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "digiduktas — skaitmeninių produktų turgus Lietuvai",
    template: "%s · digiduktas",
  },
  description: DESCRIPTION,
  keywords: [
    "skaitmeniniai produktai",
    "digital products Lietuva",
    "parduoti šablonus",
    "presetai",
    "e-knygos",
    "Notion šablonai",
    "lietuviškas marketplace",
    "digiduktas",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "lt_LT",
    url: SITE_URL,
    siteName: "digiduktas",
    title: "digiduktas — skaitmeninių produktų turgus Lietuvai",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "digiduktas — skaitmeninių produktų turgus Lietuvai",
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
        <Analytics />
      </body>
    </html>
  );
}
