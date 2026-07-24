import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

import { APP_NAME } from "@/lib/constants";
import { PRODUCTION_SITE_URL } from "@/lib/url";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

function resolveSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PRODUCTION_SITE_URL;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (/localhost|127\.0\.0\.1/i.test(url.hostname) && process.env.NODE_ENV === "production") {
      return PRODUCTION_SITE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — Organizarea nunții, elegant și simplu`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "EasyWedd este platforma pentru cupluri care își organizează nunta: planner, invitații și website — oferită inițial clienților Raian Visual.",
  applicationName: APP_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — Organizarea nunții, elegant și simplu`,
    description:
      "Planner, invitații digitale și website de nuntă — într-un singur spațiu.",
    images: [
      {
        url: "/brand/raian-mark.png",
        width: 512,
        height: 512,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Organizarea nunții`,
    description:
      "Planner, invitații digitale și website de nuntă — într-un singur spațiu.",
    images: ["/brand/raian-mark.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2A2420",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${sourceSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
