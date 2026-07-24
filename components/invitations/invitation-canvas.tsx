import { InvitationWatermark } from "@/components/invitations/watermark";
import { InvitationSectionsView } from "@/components/invitations/sections/section-renderers";
import { normalizeInvitationContent } from "@/lib/invitations/sections";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type InvitationCanvasProps = {
  theme: InvitationThemeConfig;
  content: InvitationContentConfig;
  watermark?: boolean;
  guestName?: string;
  className?: string;
  id?: string;
  /** Editor preview: show empty sections with defaults */
  preview?: boolean;
};

export function InvitationCanvas({
  theme,
  content,
  watermark = false,
  guestName,
  className = "",
  id,
  preview = false,
}: InvitationCanvasProps) {
  const normalized = normalizeInvitationContent(content);
  const pageBackground =
    theme.pageGradientFrom && theme.pageGradientTo
      ? undefined
      : theme.background;
  const pageBackgroundImage =
    theme.pageGradientFrom && theme.pageGradientTo
      ? `linear-gradient(160deg, ${theme.pageGradientFrom}, ${theme.pageGradientTo})`
      : undefined;

  return (
    <div
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: pageBackground,
        backgroundImage: pageBackgroundImage,
        color: theme.foreground,
        fontFamily: `"${theme.bodyFont}", sans-serif`,
      }}
    >
      <InvitationWatermark show={watermark} />
      <InvitationSectionsView
        content={normalized}
        theme={theme}
        guestName={guestName}
        includeDisabled={false}
      />
      {preview ? null : null}
    </div>
  );
}

/** Exported so tests can assert preview + public share the same view component */
export { InvitationSectionsView as SharedInvitationSectionsView };
