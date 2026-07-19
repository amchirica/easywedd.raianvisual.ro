import { InvitationWatermark } from "@/components/invitations/watermark";
import type {
  InvitationContentConfig,
  InvitationSectionKey,
  InvitationThemeConfig,
} from "@/types/invitations";

type InvitationCanvasProps = {
  theme: InvitationThemeConfig;
  content: InvitationContentConfig;
  watermark?: boolean;
  guestName?: string;
  className?: string;
  id?: string;
};

function Section({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return <section className="px-8 py-6">{children}</section>;
}

function hasSection(content: InvitationContentConfig, key: InvitationSectionKey) {
  return content.enabledSections.includes(key);
}

export function InvitationCanvas({
  theme,
  content,
  watermark = false,
  guestName,
  className = "",
  id,
}: InvitationCanvasProps) {
  return (
    <div
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: `"${theme.bodyFont}", sans-serif`,
      }}
    >
      <InvitationWatermark show={watermark} />

      <Section show={hasSection(content, "hero")}>
        <div className="relative min-h-[220px] overflow-hidden">
          {content.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          ) : (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(160deg, ${theme.accent}55, transparent 60%)`,
              }}
            />
          )}
          <div className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-16 text-center">
            <p
              className="text-xs tracking-[0.35em] uppercase"
              style={{ color: theme.accent }}
            >
              Invitație
            </p>
            <h1
              className="mt-4 text-4xl leading-tight sm:text-5xl"
              style={{ fontFamily: `"${theme.headingFont}", serif` }}
            >
              {content.coupleName1}
              {content.coupleName1 && content.coupleName2 ? " & " : ""}
              {content.coupleName2}
            </h1>
            {guestName ? (
              <p className="mt-4 text-sm opacity-80">Dragă {guestName},</p>
            ) : null}
          </div>
        </div>
      </Section>

      <Section show={hasSection(content, "couple")}>
        <p className="text-center text-base leading-relaxed opacity-90">
          {content.introText}
        </p>
      </Section>

      <Section show={hasSection(content, "when_where")}>
        <div className="text-center">
          <h2
            className="text-2xl"
            style={{ fontFamily: `"${theme.headingFont}", serif` }}
          >
            Când & unde
          </h2>
          <div
            className="mx-auto mt-3 h-px w-16"
            style={{ background: theme.accent }}
          />
          <p className="mt-4 text-sm">
            {[content.weddingDate, content.weddingTime].filter(Boolean).join(" · ")}
          </p>
          {content.ceremonyLocation ? (
            <p className="mt-2 text-sm opacity-80">
              Ceremonie: {content.ceremonyLocation}
            </p>
          ) : null}
          {content.receptionLocation ? (
            <p className="mt-1 text-sm opacity-80">
              Petrecere: {content.receptionLocation}
            </p>
          ) : null}
          {content.mapUrl ? (
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm underline underline-offset-4"
              style={{ color: theme.accent }}
            >
              Vezi pe hartă
            </a>
          ) : null}
        </div>
      </Section>

      <Section show={hasSection(content, "schedule") && Boolean(content.scheduleText)}>
        <h2
          className="text-center text-2xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          Program
        </h2>
        <p className="mt-3 whitespace-pre-line text-center text-sm leading-relaxed opacity-90">
          {content.scheduleText}
        </p>
      </Section>

      <Section
        show={
          hasSection(content, "party") &&
          Boolean(content.parentsText || content.godparentsText)
        }
      >
        <h2
          className="text-center text-2xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          Familie
        </h2>
        {content.parentsText ? (
          <p className="mt-3 text-center text-sm opacity-90">{content.parentsText}</p>
        ) : null}
        {content.godparentsText ? (
          <p className="mt-2 text-center text-sm opacity-90">
            {content.godparentsText}
          </p>
        ) : null}
      </Section>

      <Section show={hasSection(content, "dress_code") && Boolean(content.dressCode)}>
        <h2
          className="text-center text-2xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          Dress code
        </h2>
        <p className="mt-3 text-center text-sm opacity-90">{content.dressCode}</p>
      </Section>

      <Section
        show={
          hasSection(content, "travel") &&
          Boolean(content.travelInfo || content.accommodationInfo)
        }
      >
        <h2
          className="text-center text-2xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          Transport & cazare
        </h2>
        {content.travelInfo ? (
          <p className="mt-3 whitespace-pre-line text-center text-sm opacity-90">
            {content.travelInfo}
          </p>
        ) : null}
        {content.accommodationInfo ? (
          <p className="mt-2 whitespace-pre-line text-center text-sm opacity-90">
            {content.accommodationInfo}
          </p>
        ) : null}
      </Section>

      <Section show={hasSection(content, "rsvp")}>
        <div
          className="rounded-sm border px-4 py-6 text-center"
          style={{ borderColor: `${theme.accent}66` }}
        >
          <h2
            className="text-2xl"
            style={{ fontFamily: `"${theme.headingFont}", serif` }}
          >
            RSVP
          </h2>
          <p className="mt-3 text-sm opacity-90">{content.rsvpMessage}</p>
        </div>
      </Section>

      <Section show={hasSection(content, "footer")}>
        <p
          className="pb-10 text-center text-lg"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          {content.footerText || "Cu drag,"}{" "}
          {[content.coupleName1, content.coupleName2].filter(Boolean).join(" & ")}
        </p>
      </Section>
    </div>
  );
}
