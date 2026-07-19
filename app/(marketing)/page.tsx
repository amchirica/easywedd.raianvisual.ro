import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(125deg,#2a2420_0%,#3d342c_38%,#6b5740_68%,#c4a574_100%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_15%_20%,rgba(255,253,249,0.2),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(196,165,116,0.35),transparent_40%),linear-gradient(to_bottom,transparent,rgba(42,36,32,0.45))]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22%23fffdf9%22 fill-opacity=%220.9%22%3E%3Cpath d=%22M0 39h1v1H0zm20-20h1v1h-1z%22/%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:justify-center md:pb-28">
        <div className="max-w-2xl animate-[fadeUp_0.9s_ease_both]">
          <p className="font-heading text-5xl tracking-tight text-primary-foreground sm:text-6xl md:text-7xl">
            {APP_NAME}
          </p>
          <h1 className="mt-5 max-w-xl text-balance text-2xl font-medium leading-snug text-primary-foreground/95 sm:text-3xl">
            Organizează nunta într-un singur loc, cu eleganță.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
            Planner, invitații și website de nuntă — construit pentru cupluri și
            pentru clienții Raian Visual.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-champagne text-foreground hover:bg-champagne/90",
              )}
            >
              Creează cont
            </Link>
            <Link
              href="/features"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
              )}
            >
              Descoperă platforma
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
