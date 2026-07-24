import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import {
  FREE_PLAN_FEATURES,
  FEATURE_LABELS_RO,
  PREMIUM_PLAN_FEATURES,
} from "@/lib/entitlements/policy";
import { cn } from "@/lib/utils";

const HOW_STEPS = [
  {
    title: "Creează spațiul nunții",
    body: "Adaugi detaliile cuplului și începi cu planul Gratuit — fără card.",
  },
  {
    title: "Planifică și personalizează",
    body: "Invitați, buget, invitații digitale și website draft, într-un singur loc.",
  },
  {
    title: "Publică când ești gata",
    body: "Treci la un plan plătit pentru publicare, PDF, seating și șabloane premium.",
  },
];

const TEMPLATES = [
  { name: "Editorial Complet", tone: "15 secțiuni avansate" },
  { name: "Minimal Line", tone: "Curat și modern" },
  { name: "Botanical Soft", tone: "Verde și romantic" },
  { name: "Tradițional Românesc", tone: "Cald și autentic" },
];

const FAQS = [
  {
    q: "Ce include planul Gratuit?",
    a: "Planner, invitați (limită), buget, o invitație digitală și website în draft — fără publicare și fără funcții premium.",
  },
  {
    q: "Pot publica website-ul pe planul gratuit?",
    a: "Nu. Publicarea, domeniul personalizat și șabloanele premium necesită un plan plătit sau un grant de la administrator.",
  },
  {
    q: "Cum primesc acces ca client Raian Visual?",
    a: "Administratorul poate aproba contul și acorda acces manual, inclusiv temporar, fără plată Stripe.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f7f4ef_0%,#fffdf9_42%,#f3eee6_100%)]">
      {/* Hero */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(125deg,#2a2420_0%,#3d342c_40%,#6b5740_72%,#c4a574_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_12%_18%,rgba(255,253,249,0.22),transparent_34%),radial-gradient(circle_at_88%_70%,rgba(196,165,116,0.4),transparent_42%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22%23fffdf9%22%3E%3Cpath d=%22M0 39h1v1H0zm20-20h1v1h-1z%22/%3E%3C/g%3E%3C/svg%3E')]" />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-6 pb-16 pt-28 md:justify-center md:pb-24">
          <div className="max-w-2xl animate-[fadeUp_0.85s_ease_both]">
            <p className="font-heading text-5xl tracking-tight text-primary-foreground sm:text-6xl md:text-7xl">
              {APP_NAME}
            </p>
            <h1 className="mt-5 max-w-xl text-balance text-2xl font-medium leading-snug text-primary-foreground/95 sm:text-3xl">
              Nunta ta, organizată elegant — de la listă la invitație și website.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
              Platformă pentru cupluri și clienții Raian Visual: planner, invitații
              digitale și site de nuntă, cu plan Gratuit clar și upgrade când ai nevoie.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-champagne text-foreground hover:bg-champagne/90",
                )}
              >
                Începe gratuit
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
                )}
              >
                Vezi planurile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value + previews */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
            De ce EasyWedd
          </p>
          <h2 className="mt-3 font-heading text-4xl text-foreground sm:text-5xl">
            Un singur spațiu pentru tot ce ține de nuntă
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Nu mai jongla între tabele, PDF-uri și site-uri separate. EasyWedd leagă
            planificarea de invitații și de website-ul public.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PreviewCard
            eyebrow="Invitații"
            title="Studio de invitații"
            body="Secțiuni avansate, teme controlate și preview identic cu pagina publică."
            href="/register"
          />
          <PreviewCard
            eyebrow="Website"
            title="Website de nuntă"
            body="Aceleași componente vizuale ca la invitații — draft pe Gratuit, publicare pe plan plătit."
            href="/register"
          />
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border/60 bg-[#fffdf9] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading text-4xl">Instrumente de planificare</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Pe planul Gratuit ai bazele. Funcțiile premium se deblochează clar, cu
            mesaj în UI și verificare pe server.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_PLAN_FEATURES.map((key) => (
              <FeatureBlock
                key={key}
                title={FEATURE_LABELS_RO[key]}
                badge="Gratuit"
                body="Inclus în planul de bază."
              />
            ))}
            {PREMIUM_PLAN_FEATURES.slice(0, 3).map((key) => (
              <FeatureBlock
                key={key}
                title={FEATURE_LABELS_RO[key]}
                badge="Premium"
                body="Disponibil pe planuri plătite sau grant admin."
              />
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-heading text-4xl">Exemple de șabloane</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          De la minimal la editorial complet — același motor de secțiuni pentru
          invitații și website.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <div
              key={t.name}
              className="group relative overflow-hidden rounded-sm border border-border bg-card p-5 transition duration-500 hover:-translate-y-1"
              style={{
                background: `linear-gradient(160deg, ${
                  ["#f7f4ef", "#f3f6f1", "#fffdf9", "#f8f1e7"][i]
                }, #fff)`,
              }}
            >
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t.tone}
              </p>
              <p className="mt-3 font-heading text-2xl">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#2a2420] py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading text-4xl">Cum funcționează</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map((step, index) => (
              <li key={step.title} className="animate-[fadeUp_0.7s_ease_both]">
                <p className="text-xs tracking-[0.3em] text-champagne uppercase">
                  0{index + 1}
                </p>
                <h3 className="mt-3 font-heading text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-4xl">Prețuri pe scurt</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Gratuit pentru început. Upgrade când publici sau ai nevoie de
              seating, PDF și analytics.
            </p>
          </div>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "outline" }))}>
            Detalii planuri
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <PriceCard
            name="Gratuit"
            price="0 lei"
            points={["Planner & buget", "Invitați (limită)", "1 invitație + website draft"]}
          />
          <PriceCard
            name="Starter"
            price="Abonament"
            points={["Limite mai mari", "Seating & furnizori", "Mai multe invitații"]}
            highlight
          />
          <PriceCard
            name="Premium"
            price="Pass / Pro"
            points={["Publicare website", "PDF & analytics", "Șabloane premium"]}
          />
        </div>
      </section>

      {/* Testimonials placeholders */}
      <section className="border-y border-border/60 bg-[#fffdf9] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading text-4xl">Ce spun cuplurile</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Am avut lista, invitațiile și site-ul în același loc — fără haos.",
              "Preview-ul arată exact ca pagina publică. Ajustările au fost rapide.",
              "Planul gratuit ne-a ajuns la început; am upgradat doar pentru publicare.",
            ].map((quote) => (
              <blockquote
                key={quote}
                className="border-l-2 border-champagne pl-4 text-sm leading-relaxed text-muted-foreground"
              >
                „{quote}”
                <footer className="mt-3 text-xs tracking-wide uppercase text-foreground/70">
                  Client EasyWedd · placeholder
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-heading text-4xl">Întrebări frecvente</h2>
        <dl className="mt-10 max-w-3xl space-y-6">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#3d342c,#6b5740_55%,#c4a574)]" />
        <div className="relative mx-auto max-w-3xl text-center text-primary-foreground">
          <h2 className="font-heading text-4xl sm:text-5xl">
            Pregătit să organizezi nunta cu EasyWedd?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Creează un cont în câteva minute. Poți începe pe Gratuit și upgrade
            când ești gata să publici.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
              Demo funcționalități
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function PreviewCard({
  eyebrow,
  title,
  body,
  href,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[280px] overflow-hidden rounded-sm border border-border bg-[#2a2420] p-6 text-primary-foreground transition duration-500 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(196,165,116,0.35),transparent_55%)] opacity-80 transition group-hover:opacity-100" />
      <div className="relative">
        <p className="text-xs tracking-[0.28em] text-champagne uppercase">
          {eyebrow}
        </p>
        <h3 className="mt-4 font-heading text-3xl">{title}</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
          {body}
        </p>
        <p className="mt-8 text-sm text-champagne underline-offset-4 group-hover:underline">
          Începe acum
        </p>
      </div>
    </Link>
  );
}

function FeatureBlock({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
        {badge}
      </p>
      <h3 className="mt-2 font-heading text-2xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function PriceCard({
  name,
  price,
  points,
  highlight,
}: {
  name: string;
  price: string;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card p-6",
        highlight && "border-champagne shadow-sm",
      )}
    >
      <p className="font-heading text-2xl">{name}</p>
      <p className="mt-2 text-sm text-muted-foreground">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p}>· {p}</li>
        ))}
      </ul>
    </div>
  );
}
