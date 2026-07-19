"use client";

import { useState } from "react";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type Device = "desktop" | "tablet" | "mobile";

const FRAMES: Record<Device, { width: number; label: string }> = {
  desktop: { width: 720, label: "Desktop" },
  tablet: { width: 520, label: "Tablet" },
  mobile: { width: 360, label: "Mobile" },
};

type DevicePreviewProps = {
  theme: InvitationThemeConfig;
  content: InvitationContentConfig;
  watermark: boolean;
};

export function DevicePreview({ theme, content, watermark }: DevicePreviewProps) {
  const [device, setDevice] = useState<Device>("desktop");
  const frame = FRAMES[device];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {(Object.keys(FRAMES) as Device[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setDevice(key)}
            className={`text-sm ${device === key ? "text-foreground" : "text-muted-foreground"}`}
          >
            {FRAMES[key].label}
          </button>
        ))}
      </div>
      <div className="flex justify-center overflow-auto border border-border bg-secondary/30 p-6">
        <div style={{ width: frame.width }} className="shadow-sm">
          <InvitationCanvas theme={theme} content={content} watermark={watermark} />
        </div>
      </div>
    </div>
  );
}
