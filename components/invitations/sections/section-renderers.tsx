"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import {
  normalizeSectionPresentation,
  paddingYClass,
  shadowClass,
  type SectionPresentation,
} from "@/lib/builder/presentation";
import type {
  CanonicalSectionKey,
  InvitationContentConfigV2,
  SectionContentMap,
  SectionRenderContext,
} from "@/lib/invitations/sections/types";
import { getSectionContent, isSectionEnabled } from "@/lib/invitations/sections/normalize";
import { isCanonicalSectionKey, mapLegacySectionKey } from "@/lib/invitations/sections/types";

type Theme = SectionRenderContext["theme"] & {
  density?: string;
  radius?: string;
};

const PresentationCtx = createContext<{
  style: SectionPresentation;
  theme: Theme;
} | null>(null);

export function PresentationProvider({
  style,
  theme,
  children,
}: {
  style: SectionPresentation;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <PresentationCtx.Provider value={{ style, theme }}>
      {children}
    </PresentationCtx.Provider>
  );
}

function usePresentation() {
  const ctx = useContext(PresentationCtx);
  return {
    style: ctx?.style ?? normalizeSectionPresentation(undefined),
    theme: ctx?.theme,
  };
}

function resolveAccent(style: SectionPresentation, theme: Theme) {
  return style.accent || theme.accent;
}

function Heading({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  const { style } = usePresentation();
  const align = style.align;
  return (
    <h2
      className={`text-2xl ${align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center"}`}
      style={{
        fontFamily: `"${theme.headingFont}", serif`,
        color: style.foreground || undefined,
      }}
    >
      {children}
    </h2>
  );
}

function AccentRule({ theme }: { theme: Theme }) {
  const { style } = usePresentation();
  if (!style.showAccentRule) return null;
  const align = style.align;
  return (
    <div
      className={`mt-3 h-px w-16 ${
        align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto"
      }`}
      style={{ background: resolveAccent(style, theme) }}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { style: presentation, theme } = usePresentation();
  const py = paddingYClass(presentation.paddingY);
  const shadow = shadowClass(presentation.shadow);
  const bg = presentation.background || undefined;
  const backgroundImage =
    presentation.gradientFrom && presentation.gradientTo
      ? `linear-gradient(160deg, ${presentation.gradientFrom}, ${presentation.gradientTo})`
      : undefined;

  return (
    <section
      className={`px-5 sm:px-8 ${py} w-full ${
        presentation.cardStyle ? "mx-3 my-1 rounded-lg bg-black/5 p-4 sm:p-5" : ""
      } ${presentation.border ? "border border-black/10" : ""} ${shadow} ${
        presentation.animation === "fade-up"
          ? "animate-[fadeUp_0.6s_ease_both]"
          : presentation.animation === "fade"
            ? "animate-[fadeUp_0.5s_ease_both]"
            : ""
      }`}
      style={{
        background: bg,
        backgroundImage,
        color: presentation.foreground || undefined,
      }}
      data-variant={presentation.variant}
    >
      {presentation.decorative && theme ? (
        <div
          className="mb-2 h-1 w-8 opacity-40"
          style={{ background: resolveAccent(presentation, theme) }}
        />
      ) : null}
      <div className="mx-auto w-full max-w-2xl">{children}</div>
      {presentation.divider === "line" && theme ? (
        <div
          className="mx-auto mt-4 h-px w-full max-w-2xl opacity-30"
          style={{ background: resolveAccent(presentation, theme) }}
        />
      ) : null}
      {presentation.divider === "dots" ? (
        <p className="mt-4 text-center tracking-[0.4em] opacity-40">···</p>
      ) : null}
    </section>
  );
}

function SectionHeader({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  return (
    <div className="mb-5 text-center">
      <Heading theme={theme}>{children}</Heading>
      <AccentRule theme={theme} />
    </div>
  );
}

/** Two elegant columns — stacks on very small screens */
function SplitRow({
  left,
  right,
  accent,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-0">
      <div className="text-center sm:pr-6 sm:text-right">{left}</div>
      <div
        className="mx-auto hidden h-full min-h-[3rem] w-px sm:block"
        style={{ background: `${accent}55` }}
        aria-hidden
      />
      <div className="text-center sm:pl-6 sm:text-left">{right}</div>
    </div>
  );
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.28em] uppercase opacity-55">{children}</p>
  );
}

function HeroSection({
  data,
  theme,
  guestName,
}: {
  data: SectionContentMap["hero"];
  theme: Theme;
  guestName?: string;
}) {
  const { style } = usePresentation();
  const variant = style.heroVariant ?? "centered";
  const overlayOpacity =
    style.overlay === "strong" ? 0.55 : style.overlay === "soft" ? 0.3 : 0.4;
  const minH =
    style.variant === "fullscreen"
      ? "min-h-[70vh]"
      : "min-h-[220px]";

  return (
    <Shell>
      <div
        className={`relative overflow-hidden ${minH} ${
          variant === "split" ? "grid sm:grid-cols-2" : ""
        }`}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              variant === "minimal" ? "opacity-20" : ""
            }`}
            style={{ opacity: variant === "minimal" ? 0.2 : overlayOpacity }}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(160deg, ${resolveAccent(style, theme)}55, transparent 60%)`,
            }}
          />
        )}
        <div
          className={`relative flex ${minH} flex-col justify-center px-6 py-16 ${
            variant === "split" || style.align === "left"
              ? "items-start text-left"
              : variant === "minimal"
                ? "items-center text-center"
                : "items-center text-center"
          }`}
        >
          {data.eyebrow ? (
            <p
              className="text-xs tracking-[0.35em] uppercase"
              style={{ color: resolveAccent(style, theme) }}
            >
              {data.eyebrow}
            </p>
          ) : null}
          <h1
            className="mt-4 text-4xl leading-tight sm:text-5xl"
            style={{ fontFamily: `"${theme.headingFont}", serif` }}
          >
            {data.title || "Invitație"}
          </h1>
          {data.subtitle ? (
            <p className="mt-3 text-sm opacity-80">{data.subtitle}</p>
          ) : null}
          {guestName ? (
            <p className="mt-4 text-sm opacity-80">Dragă {guestName},</p>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function AnnouncementSection({
  data,
  theme,
}: {
  data: SectionContentMap["announcement"];
  theme: Theme;
}) {
  return (
    <Shell>
      <div className="text-center">
        {data.eyebrow ? (
          <p
            className="mb-2 text-[10px] tracking-[0.3em] uppercase"
            style={{ color: theme.accent }}
          >
            {data.eyebrow}
          </p>
        ) : null}
        <SectionHeader theme={theme}>{data.title}</SectionHeader>
        {data.description ? (
          <p className="mx-auto max-w-md text-sm leading-relaxed opacity-85">
            {data.description}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}

function CoupleSection({
  data,
  theme,
}: {
  data: SectionContentMap["couple"];
  theme: Theme;
}) {
  const accent = theme.accent;
  const name1 = data.name1 || "Partener 1";
  const name2 = data.name2 || "Partener 2";

  return (
    <Shell>
      <SplitRow
        accent={accent}
        left={
          <div>
            <p
              className="text-3xl leading-tight"
              style={{ fontFamily: `"${theme.headingFont}", serif` }}
            >
              {name1}
            </p>
            {data.parentsText ? (
              <p className="mt-3 text-xs leading-relaxed opacity-70">
                {data.parentsText}
              </p>
            ) : null}
          </div>
        }
        right={
          <div>
            <p
              className="text-3xl leading-tight"
              style={{ fontFamily: `"${theme.headingFont}", serif` }}
            >
              {name2}
            </p>
            {data.godparentsText ? (
              <p className="mt-3 text-xs leading-relaxed opacity-70">
                {data.godparentsText}
              </p>
            ) : null}
          </div>
        }
      />
      {data.introText ? (
        <p className="mx-auto mt-6 max-w-md text-center text-sm leading-relaxed opacity-85">
          {data.introText}
        </p>
      ) : null}
    </Shell>
  );
}

function StorySection({
  data,
  theme,
}: {
  data: SectionContentMap["story"];
  theme: Theme;
}) {
  const { style } = usePresentation();
  const accent = resolveAccent(style, theme);

  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Povestea noastră"}</SectionHeader>
      {data.introduction ? (
        <p className="mx-auto mb-5 max-w-md text-center text-sm opacity-85">
          {data.introduction}
        </p>
      ) : null}
      <ul className="relative space-y-6">
        <div
          className="absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 sm:block"
          style={{ background: `${accent}44` }}
          aria-hidden
        />
        {data.items.map((item, index) => {
          const onLeft = index % 2 === 0;
          return (
            <li
              key={item.id}
              className={`grid grid-cols-1 sm:grid-cols-2 sm:gap-10 ${
                onLeft ? "" : "sm:[&>*:first-child]:order-2"
              }`}
            >
              <div
                className={`text-center sm:text-right ${onLeft ? "" : "sm:text-left"}`}
              >
                <StoryMoment item={item} theme={theme} />
              </div>
              <div className="hidden sm:block" aria-hidden />
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function StoryMoment({
  item,
  theme,
}: {
  item: SectionContentMap["story"]["items"][number];
  theme: Theme;
}) {
  return (
    <>
      {item.date ? (
        <p className="text-[10px] tracking-[0.22em] uppercase opacity-55">
          {item.date}
        </p>
      ) : null}
      <p
        className="mt-1 text-lg"
        style={{ fontFamily: `"${theme.headingFont}", serif` }}
      >
        {item.title || "Moment"}
      </p>
      {item.description ? (
        <p className="mt-1 text-sm opacity-75">{item.description}</p>
      ) : null}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="mt-3 inline-block h-28 max-w-[11rem] object-cover opacity-90"
        />
      ) : null}
    </>
  );
}

function CountdownSection({
  data,
  theme,
}: {
  data: SectionContentMap["countdown"];
  theme: Theme;
}) {
  const [label, setLabel] = useState("…");

  useEffect(() => {
    function tick() {
      if (!data.targetDate) {
        setLabel("Data nunții va apărea aici");
        return;
      }
      const target = new Date(data.targetDate);
      if (Number.isNaN(target.getTime())) {
        setLabel(data.targetDate);
        return;
      }
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setLabel("A sosit ziua cea mare!");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setLabel(`${days} zile · ${hours} ore`);
    }
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [data.targetDate]);

  const { style } = usePresentation();
  const countdownStyle = style.countdownStyle ?? "digits";

  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Până la ziua cea mare"}</SectionHeader>
      <div className="text-center">
        {countdownStyle === "cards" ? (
          <div
            className="inline-block rounded-md border px-6 py-3 text-2xl"
            style={{
              fontFamily: `"${theme.headingFont}", serif`,
              color: resolveAccent(style, theme),
              borderColor: `${resolveAccent(style, theme)}55`,
            }}
          >
            {label}
          </div>
        ) : countdownStyle === "inline" ? (
          <p className="text-base opacity-90">{label}</p>
        ) : (
          <p
            className="text-3xl"
            style={{
              fontFamily: `"${theme.headingFont}", serif`,
              color: resolveAccent(style, theme),
            }}
          >
            {label}
          </p>
        )}
      </div>
    </Shell>
  );
}

function WhenWhereSection({
  data,
  theme,
}: {
  data: SectionContentMap["when_where"];
  theme: Theme;
}) {
  const accent = theme.accent;
  const dateLine = [data.weddingDate, data.weddingTime]
    .filter(Boolean)
    .join(" · ");

  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Când și unde"}</SectionHeader>
      {dateLine ? (
        <p
          className="mb-6 text-center text-xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          {dateLine}
        </p>
      ) : null}
      <SplitRow
        accent={accent}
        left={
          <div>
            <MetaLabel>Ceremonie</MetaLabel>
            <p className="mt-2 text-sm leading-relaxed">
              {data.ceremonyLocation || "Locație ceremonie"}
            </p>
          </div>
        }
        right={
          <div>
            <MetaLabel>Petrecere</MetaLabel>
            <p className="mt-2 text-sm leading-relaxed">
              {data.receptionLocation || "Locație petrecere"}
            </p>
          </div>
        }
      />
      {data.mapUrl ? (
        <div className="mt-5 text-center">
          <a
            href={data.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs tracking-[0.18em] uppercase underline underline-offset-4"
            style={{ color: accent }}
          >
            Vezi pe hartă
          </a>
        </div>
      ) : null}
    </Shell>
  );
}

function TimelineSection({
  data,
  theme,
}: {
  data: SectionContentMap["timeline"];
  theme: Theme;
}) {
  const { style } = usePresentation();
  const layout = style.timelineLayout ?? "alternating";
  const showIcons = style.showIcons;
  const accent = resolveAccent(style, theme);

  if (layout === "compact") {
    return (
      <Shell>
        <SectionHeader theme={theme}>
          {data.title || "Programul evenimentului"}
        </SectionHeader>
        <ol className="mx-auto max-w-md space-y-2">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-4 border-b border-black/5 py-2 text-sm"
            >
              <span className="opacity-55">{item.time}</span>
              <span className="flex-1 text-right font-medium">{item.title}</span>
            </li>
          ))}
        </ol>
      </Shell>
    );
  }

  return (
    <Shell>
      <SectionHeader theme={theme}>
        {data.title || "Programul evenimentului"}
      </SectionHeader>
      <ol className="relative space-y-5">
        <div
          className="absolute top-1 bottom-1 left-1/2 hidden w-px -translate-x-1/2 sm:block"
          style={{ background: `${accent}44` }}
          aria-hidden
        />
        {data.items.map((item, index) => {
          const onLeft = layout === "alternating" ? index % 2 === 0 : true;
          return (
            <li
              key={item.id}
              className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-10"
            >
              <div
                className={`${
                  onLeft
                    ? "text-center sm:text-right"
                    : "text-center sm:col-start-2 sm:text-left"
                }`}
              >
                <p className="text-[10px] tracking-[0.22em] uppercase opacity-55">
                  {[item.time, showIcons ? item.icon : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p
                  className="mt-1 text-lg"
                  style={{ fontFamily: `"${theme.headingFont}", serif` }}
                >
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 text-sm opacity-75">{item.description}</p>
                ) : null}
                {item.location ? (
                  <p className="mt-1 text-xs opacity-55">{item.location}</p>
                ) : null}
              </div>
              {onLeft ? <div className="hidden sm:block" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}

function GallerySection({
  data,
  theme,
}: {
  data: SectionContentMap["gallery"];
  theme: Theme;
}) {
  const { dict } = useI18n();
  const { style } = usePresentation();
  const layout = style.galleryLayout ?? "grid-3";
  const gridClass =
    layout === "grid-2"
      ? "grid-cols-2"
      : layout === "carousel"
        ? "grid-flow-col auto-cols-[70%] overflow-x-auto"
        : layout === "masonry"
          ? "grid-cols-2 sm:grid-cols-3 [&>*:nth-child(3n)]:row-span-2"
          : "grid-cols-2 sm:grid-cols-3";
  const imageClass =
    style.imageStyle === "circle"
      ? "rounded-full object-cover"
      : style.imageStyle === "rounded"
        ? "rounded-lg object-cover"
        : style.imageStyle === "contain"
          ? "object-contain"
          : "object-cover";

  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Galerie"}</SectionHeader>
      {data.items.length === 0 ? (
        <p className="text-center text-sm opacity-50">{dict.invitations.editor.imagesPlaceholder}</p>
      ) : (
        <div className={`grid gap-2 ${gridClass}`}>
          {data.items.map((item) => (
            <figure key={item.id} className="overflow-hidden">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption || ""}
                  className={`aspect-square w-full ${imageClass}`}
                />
              ) : (
                <div
                  className="flex aspect-square items-center justify-center text-xs opacity-40"
                  style={{ background: `${resolveAccent(style, theme)}22` }}
                >
                  Imagine
                </div>
              )}
              {item.caption ? (
                <figcaption className="mt-1 text-center text-xs opacity-70">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}
    </Shell>
  );
}

function DressCodeSection({
  data,
  theme,
}: {
  data: SectionContentMap["dress_code"];
  theme: Theme;
}) {
  const { dict } = useI18n();
  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Dress code"}</SectionHeader>
      <SplitRow
        accent={theme.accent}
        left={
          <div>
            {data.description ? (
              <p className="text-sm leading-relaxed opacity-85">{data.description}</p>
            ) : (
              <p className="text-sm opacity-50">{dict.invitations.editor.dressCodeDetails}</p>
            )}
          </div>
        }
        right={
          <div>
            {data.colors.length ? (
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {data.colors.map((color) => (
                  <span
                    key={color}
                    title={color}
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
            ) : null}
            {data.inspirationImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.inspirationImageUrl}
                alt=""
                className="mt-3 inline-block h-28 max-w-[10rem] object-cover"
              />
            ) : null}
          </div>
        }
      />
    </Shell>
  );
}

function AccommodationSection({
  data,
  theme,
}: {
  data: SectionContentMap["accommodation"];
  theme: Theme;
}) {
  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Cazare"}</SectionHeader>
      {data.description ? (
        <p className="mx-auto mb-5 max-w-md text-center text-sm opacity-85">
          {data.description}
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.items.map((item) => (
          <li
            key={item.id}
            className="border px-4 py-3 text-sm"
            style={{ borderColor: `${theme.accent}33` }}
          >
            <p
              className="text-lg"
              style={{ fontFamily: `"${theme.headingFont}", serif` }}
            >
              {item.name || "Cazare"}
            </p>
            {item.address ? <p className="mt-1 opacity-75">{item.address}</p> : null}
            {item.phone ? <p className="mt-1 opacity-75">{item.phone}</p> : null}
            {item.bookingInfo ? (
              <p className="mt-1 text-xs opacity-65">{item.bookingInfo}</p>
            ) : null}
            <div className="mt-2 flex gap-3 text-xs">
              {item.website ? (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: theme.accent }}
                >
                  Site
                </a>
              ) : null}
              {item.mapUrl ? (
                <a
                  href={item.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: theme.accent }}
                >
                  Hartă
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function TransportSection({
  data,
  theme,
}: {
  data: SectionContentMap["transport"];
  theme: Theme;
}) {
  const cells = [
    { label: "Preluare", value: data.pickupPoints },
    { label: "Plecări", value: data.departureTimes },
    { label: "Întoarceri", value: data.returnTimes },
    { label: "Contact", value: data.contact },
  ].filter((c) => c.value);

  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Transport"}</SectionHeader>
      {data.description ? (
        <p className="mx-auto mb-5 max-w-md text-center text-sm opacity-85">
          {data.description}
        </p>
      ) : null}
      {cells.length ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {cells.map((cell) => (
            <div key={cell.label} className="text-center sm:odd:text-right sm:even:text-left">
              <MetaLabel>{cell.label}</MetaLabel>
              <p className="mt-1 text-sm opacity-85">{cell.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}

function GiftsSection({
  data,
  theme,
}: {
  data: SectionContentMap["gifts"];
  theme: Theme;
}) {
  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Daruri"}</SectionHeader>
      <SplitRow
        accent={theme.accent}
        left={
          data.description ? (
            <p className="text-sm leading-relaxed opacity-85">{data.description}</p>
          ) : (
            <span />
          )
        }
        right={
          <div>
            {!data.hideBankDetails && data.bankDetails ? (
              <p className="whitespace-pre-line text-sm opacity-85">
                {data.bankDetails}
              </p>
            ) : null}
            {data.registryUrl ? (
              <a
                href={data.registryUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs tracking-[0.18em] uppercase underline underline-offset-4"
                style={{ color: theme.accent }}
              >
                Listă de cadouri
              </a>
            ) : null}
          </div>
        }
      />
    </Shell>
  );
}

function FaqSection({
  data,
  theme,
}: {
  data: SectionContentMap["faq"];
  theme: Theme;
}) {
  return (
    <Shell>
      <SectionHeader theme={theme}>{data.title || "Întrebări frecvente"}</SectionHeader>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {data.items.map((item) => (
          <div key={item.id} className="text-center sm:odd:text-right sm:even:text-left">
            <dt
              className="text-base"
              style={{ fontFamily: `"${theme.headingFont}", serif` }}
            >
              {item.question || "Întrebare"}
            </dt>
            <dd className="mt-1 text-sm opacity-75">{item.answer || ""}</dd>
          </div>
        ))}
      </dl>
    </Shell>
  );
}

function RsvpSection({
  data,
  theme,
}: {
  data: SectionContentMap["rsvp"];
  theme: Theme;
}) {
  return (
    <Shell>
      <div
        className="border px-5 py-5 text-center"
        style={{ borderColor: `${theme.accent}55` }}
      >
        <SectionHeader theme={theme}>
          {data.title || "Confirmare participare"}
        </SectionHeader>
        <p className="mx-auto max-w-sm text-sm opacity-85">{data.message}</p>
      </div>
    </Shell>
  );
}

function FooterSection({
  data,
  theme,
}: {
  data: SectionContentMap["footer"];
  theme: Theme;
}) {
  return (
    <Shell>
      <p
        className="pb-2 text-center text-lg"
        style={{ fontFamily: `"${theme.headingFont}", serif` }}
      >
        {data.text || "Cu drag,"} {data.signature}
      </p>
    </Shell>
  );
}

export const sectionRenderers: {
  [K in CanonicalSectionKey]: (props: {
    data: SectionContentMap[K];
    theme: Theme;
    guestName?: string;
  }) => React.ReactNode;
} = {
  hero: HeroSection,
  announcement: AnnouncementSection,
  couple: CoupleSection,
  story: StorySection,
  countdown: CountdownSection,
  when_where: WhenWhereSection,
  timeline: TimelineSection,
  gallery: GallerySection,
  dress_code: DressCodeSection,
  accommodation: AccommodationSection,
  transport: TransportSection,
  gifts: GiftsSection,
  faq: FaqSection,
  rsvp: RsvpSection,
  footer: FooterSection,
};

export function RenderInvitationSection({
  sectionKey,
  content,
  theme,
  guestName,
  forceShow = false,
  style,
}: {
  sectionKey: string;
  content: InvitationContentConfigV2;
  theme: Theme;
  guestName?: string;
  forceShow?: boolean;
  style?: Partial<SectionPresentation> | SectionPresentation;
}) {
  const canonical =
    (isCanonicalSectionKey(sectionKey) ? sectionKey : null) ??
    mapLegacySectionKey(sectionKey);
  if (!canonical) return null;
  if (!forceShow && !isSectionEnabled(content, canonical)) return null;

  const data = getSectionContent(content, canonical);
  const presentation = normalizeSectionPresentation(
    style ?? content.sectionStyles?.[canonical],
  );
  const Renderer = sectionRenderers[canonical] as (props: {
    data: SectionContentMap[CanonicalSectionKey];
    theme: Theme;
    guestName?: string;
  }) => React.ReactNode;

  return (
    <PresentationProvider style={presentation} theme={theme}>
      <Renderer data={data} theme={theme} guestName={guestName} />
    </PresentationProvider>
  );
}

export function InvitationSectionsView({
  content,
  theme,
  guestName,
  includeDisabled = false,
}: {
  content: InvitationContentConfigV2;
  theme: Theme;
  guestName?: string;
  includeDisabled?: boolean;
}) {
  const order =
    content.sectionOrder?.length > 0
      ? content.sectionOrder
      : content.enabledSections;

  return (
    <>
      {order.map((key) => {
        if (!includeDisabled && !isSectionEnabled(content, key)) return null;
        if (includeDisabled && !isSectionEnabled(content, key)) {
          return null;
        }
        return (
          <RenderInvitationSection
            key={key}
            sectionKey={key}
            content={content}
            theme={theme}
            guestName={guestName}
            forceShow
          />
        );
      })}
    </>
  );
}
