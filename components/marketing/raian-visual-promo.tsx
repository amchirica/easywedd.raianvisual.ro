"use client";

import { trackRaianVisualPromoClickAction } from "@/lib/actions/raian-promo";
import { RAIAN_LINKS, type RaianPromoContent } from "@/lib/marketing/raian-visual";
import { cn } from "@/lib/utils";

export type RaianVisualPromoVariant = "compact" | "card" | "full-section";

type PromoLink = {
  label: string;
  href: string;
  primary?: boolean;
};

type RaianVisualPromoProps = {
  variant: RaianVisualPromoVariant;
  source: RaianPromoContent | string;
  title?: string;
  description?: string;
  className?: string;
  workspaceId?: string | null;
  weddingDate?: string | null;
  links?: PromoLink[];
  eyebrow?: string;
};

function defaultCopy(variant: RaianVisualPromoVariant, source: string) {
  if (variant === "full-section") {
    return {
      eyebrow: "Raian Fine Arts",
      title: "Fotografie și videografie pentru ziua voastră",
      description:
        "EasyWedd vă ajută să organizați nunta. Raian Fine Arts vă ajută să păstrați emoția ei pentru totdeauna, prin fotografie și film de nuntă realizate într-un stil natural, elegant și cinematografic.",
    };
  }
  if (source === "onboarding") {
    return {
      eyebrow: undefined as string | undefined,
      title: "Următorul pas: amintirile voastre",
      description:
        "Dacă nu ați ales încă fotograful sau videograful, puteți descoperi portofoliul Raian Fine Arts și verifica disponibilitatea pentru data evenimentului.",
    };
  }
  return {
    eyebrow: undefined as string | undefined,
    title: "Încă nu ai ales echipa foto-video?",
    description:
      "Descoperă portofoliul Raian Fine Arts și verifică disponibilitatea pentru data nunții tale.",
  };
}

function defaultLinks(
  variant: RaianVisualPromoVariant,
  source: RaianPromoContent | string,
): PromoLink[] {
  const content = (
    ["landing", "dashboard", "vendors", "onboarding", "footer", "planner", "wedding"].includes(
      source,
    )
      ? source
      : "dashboard"
  ) as RaianPromoContent;

  if (variant === "full-section") {
    return [
      {
        label: "Vezi portofoliul foto",
        href: RAIAN_LINKS.gallery("landing"),
        primary: true,
      },
      {
        label: "Vezi filmele de nuntă",
        href: RAIAN_LINKS.videos("landing"),
      },
      {
        label: "Solicită disponibilitatea",
        href: RAIAN_LINKS.contact("landing"),
      },
    ];
  }

  if (source === "onboarding") {
    return [
      {
        label: "Descoperă Raian Fine Arts",
        href: RAIAN_LINKS.home("onboarding"),
        primary: true,
      },
    ];
  }

  if (source === "vendors") {
    return [
      {
        label: "Vezi portofoliul",
        href: RAIAN_LINKS.gallery("vendors"),
        primary: true,
      },
      {
        label: "Verifică disponibilitatea",
        href: RAIAN_LINKS.contact("vendors"),
      },
    ];
  }

  return [
    {
      label: "Vezi serviciile foto-video",
      href: RAIAN_LINKS.home(content === "landing" ? "landing" : content),
      primary: true,
    },
  ];
}

export function RaianVisualPromo({
  variant,
  source,
  title,
  description,
  className,
  workspaceId,
  weddingDate,
  links,
  eyebrow,
}: RaianVisualPromoProps) {
  const copy = defaultCopy(variant, source);
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;
  const resolvedEyebrow = eyebrow ?? copy.eyebrow;
  const resolvedLinks = links ?? defaultLinks(variant, source);

  function onClick(destination: string) {
    void trackRaianVisualPromoClickAction({
      source: String(source),
      destination,
      workspaceId,
      weddingDate,
    });
  }

  if (variant === "compact") {
    return (
      <aside
        className={cn(
          "rounded-sm border border-border/80 bg-card/70 px-4 py-3",
          className,
        )}
      >
        <p className="text-sm font-medium text-foreground">{resolvedTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {resolvedDescription}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {resolvedLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(link.href)}
              className="text-xs font-medium text-foreground underline underline-offset-4 hover:text-champagne"
            >
              {link.label}
            </a>
          ))}
        </div>
      </aside>
    );
  }

  if (variant === "card") {
    return (
      <aside
        className={cn(
          "border border-border bg-card p-5 sm:p-6",
          className,
        )}
      >
        {resolvedEyebrow ? (
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            {resolvedEyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-heading text-2xl tracking-tight",
            resolvedEyebrow ? "mt-2" : "",
          )}
        >
          {resolvedTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {resolvedDescription}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {resolvedLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(link.href)}
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
                link.primary
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border bg-background hover:bg-muted",
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </aside>
    );
  }

  // full-section — landing (inherits marketing-theme tokens)
  return (
    <section
      className={cn(
        "relative overflow-hidden border-t border-border px-6 py-20",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(ellipse_50%_40%_at_15%_20%,rgba(198,167,106,0.12),transparent),radial-gradient(ellipse_40%_35%_at_85%_80%,rgba(198,167,106,0.06),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl">
        {resolvedEyebrow ? (
          <span className="inline-flex rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1 text-[0.7rem] font-medium tracking-wide text-champagne-soft">
            {resolvedEyebrow}
          </span>
        ) : null}
        <h2 className="mt-4 max-w-2xl font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {resolvedTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {resolvedDescription}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {resolvedLinks.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(link.href)}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
                link.primary
                  ? "bg-champagne text-primary-foreground hover:bg-champagne/90"
                  : "border border-border bg-background/40 text-foreground hover:bg-muted",
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RaianVisualFooterPromo() {
  const href = RAIAN_LINKS.home("footer");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      onClick={() => {
        void trackRaianVisualPromoClickAction({
          source: "footer",
          destination: href,
        });
      }}
    >
      Ai nevoie de fotografie sau videografie pentru nuntă? Descoperă Raian
      Visual.
    </a>
  );
}

export function RaianVisualRecommendedVendor({
  className,
  workspaceId,
  weddingDate,
}: {
  className?: string;
  workspaceId?: string | null;
  weddingDate?: string | null;
}) {
  const home = RAIAN_LINKS.home("vendors");
  const gallery = RAIAN_LINKS.gallery("vendors");
  const contact = RAIAN_LINKS.contact("vendors");

  function onClick(destination: string) {
    void trackRaianVisualPromoClickAction({
      source: "vendors",
      destination,
      workspaceId,
      weddingDate,
    });
  }

  return (
    <aside
      className={cn(
        "border border-champagne/35 bg-[linear-gradient(160deg,#fffdf9,#f7f4ef)] p-5 sm:p-6",
        className,
      )}
    >
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
        Furnizor recomandat
      </p>
      <h2 className="mt-2 font-heading text-2xl tracking-tight">Raian Fine Arts</h2>
      <p className="mt-1 text-sm font-medium text-foreground/80">
        Fotografie &amp; videografie de nuntă
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Fotografie premiată și film de nuntă realizat într-un stil documentar,
        elegant și cinematografic.
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Website</dt>
          <dd>
            <a
              href={home}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(home)}
              className="underline underline-offset-4 hover:text-foreground"
            >
              raianvisual.ro
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Telefon</dt>
          <dd>
            <a
              href="tel:+40740607882"
              className="underline underline-offset-4 hover:text-foreground"
            >
              0740 607 882
            </a>
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={gallery}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onClick(gallery)}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Vezi portofoliul
        </a>
        <a
          href={contact}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onClick(contact)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Verifică disponibilitatea
        </a>
      </div>
    </aside>
  );
}
