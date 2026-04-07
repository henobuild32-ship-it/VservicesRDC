import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VServiceRDC",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Script id="pwa-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
            window.addEventListener('beforeinstallprompt', (e) => {
              e.preventDefault();
              window.deferredPWAInstall = e;
            });
          `}
        </Script>
      </body>
    </html>
  );
}
