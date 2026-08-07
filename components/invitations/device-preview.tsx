"use client";

import { useState } from "react";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import { useI18n } from "@/components/providers/i18n-provider";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type Device = "desktop" | "tablet" | "mobile";

const FRAME_WIDTHS: Record<Device, number> = {
  desktop: 720,
  tablet: 520,
  mobile: 360,
};

type DevicePreviewProps = {
  theme: InvitationThemeConfig;
  content: InvitationContentConfig;
  watermark: boolean;
};

export function DevicePreview({ theme, content, watermark }: DevicePreviewProps) {
  const { dict } = useI18n();
  const [device, setDevice] = useState<Device>("desktop");
  const width = FRAME_WIDTHS[device];
  const labels: Record<Device, string> = {
    desktop: dict.invitations.deviceDesktop,
    tablet: dict.invitations.deviceTablet,
    mobile: dict.invitations.deviceMobile,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {(Object.keys(FRAME_WIDTHS) as Device[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setDevice(key)}
            className={`text-sm ${device === key ? "text-foreground" : "text-muted-foreground"}`}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <div className="flex justify-center overflow-auto border border-border bg-secondary/30 p-6">
        <div style={{ width }} className="shadow-sm">
          <InvitationCanvas theme={theme} content={content} watermark={watermark} />
        </div>
      </div>
    </div>
  );
}
