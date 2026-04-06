import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VServiceRDC - Trouvez les meilleurs prestataires en RDC",
  description:
    "VServiceRDC est la première plateforme de mise en relation entre clients et prestataires de services en République Démocratique du Congo. Trouvez les meilleurs prestataires et entreprises près de chez vous.",
  keywords: [
    "VServiceRDC",
    "RDC",
    "Congo",
    "Kinshasa",
    "prestataires",
    "services",
    "entreprises",
    "BTP",
    "technologie",
    "artisanat",
  ],
  authors: [{ name: "HenoBuild" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "VServiceRDC - Trouvez les meilleurs prestataires en RDC",
    description:
      "La première plateforme de mise en relation entre clients et prestataires de services en RDC.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
