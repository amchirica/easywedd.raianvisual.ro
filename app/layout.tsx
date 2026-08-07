import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { APP_NAME } from "@/lib/constants";
import { OG_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getRequestTheme } from "@/lib/theme/get-theme";
import { PRODUCTION_SITE_URL } from "@/lib/url";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

function resolveSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PRODUCTION_SITE_URL;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (
      /localhost|127\.0\.0\.1/i.test(url.hostname) &&
      process.env.NODE_ENV === "production"
    ) {
      return PRODUCTION_SITE_URL;
    }
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

const siteUrl = resolveSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.meta.titleDefault,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.description,
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
      locale: OG_LOCALE[locale],
      url: siteUrl,
      siteName: APP_NAME,
      title: dict.meta.titleDefault,
      description: dict.meta.ogDescription,
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
      title: dict.meta.twitterTitle,
      description: dict.meta.ogDescription,
      images: ["/brand/raian-mark.png"],
    },
    robots: { index: true, follow: true },
    alternates: {
      languages: {
        ro: siteUrl,
        en: siteUrl,
        "x-default": siteUrl,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E0D" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const theme = await getRequestTheme();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${sourceSans.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider defaultTheme={theme}>
          <I18nProvider locale={locale} dict={dict}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
