import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100svh] flex-col bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_10%_10%,rgba(196,165,116,0.25),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(42,36,32,0.08),transparent_35%)]" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8">
          <BrandLogo href="/" size={32} priority wordmarkClassName="text-3xl" />
        </div>
        <div className="border border-border bg-card/90 p-6 shadow-[0_20px_60px_-40px_rgba(42,36,32,0.45)] backdrop-blur sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Înapoi la site
          </Link>
        </p>
      </div>
    </div>
  );
}
