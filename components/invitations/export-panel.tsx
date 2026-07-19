"use client";

import { startTransition, useRef, useState } from "react";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import { Button } from "@/components/ui/button";
import { logInvitationExportAction } from "@/lib/actions/invitations";
import {
  EXPORT_VIEWPORTS,
  exportElementAsJpg,
  exportElementAsPdf,
  exportElementAsPng,
  type ExportViewport,
} from "@/lib/invitations/exports";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type ExportPanelProps = {
  projectId: string;
  projectName: string;
  theme: InvitationThemeConfig;
  content: InvitationContentConfig;
  watermark: boolean;
  allowPdf: boolean;
  allowMultiExport: boolean;
};

export function ExportPanel({
  projectId,
  projectName,
  theme,
  content,
  watermark,
  allowPdf,
  allowMultiExport,
}: ExportPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ExportViewport>("story");
  const [busy, setBusy] = useState(false);
  const size = EXPORT_VIEWPORTS[viewport];

  async function run(kind: "png" | "jpg" | "pdf") {
    if (!ref.current) return;
    setBusy(true);
    try {
      const slug = projectName.toLowerCase().replace(/\s+/g, "-");
      if (kind === "png") await exportElementAsPng(ref.current, `${slug}.png`);
      if (kind === "jpg") await exportElementAsJpg(ref.current, `${slug}.jpg`);
      if (kind === "pdf") await exportElementAsPdf(ref.current, `${slug}.pdf`);
      startTransition(() => {
        void logInvitationExportAction(projectId, kind);
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(Object.keys(EXPORT_VIEWPORTS) as ExportViewport[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setViewport(key)}
            className={`text-sm ${viewport === key ? "text-foreground" : "text-muted-foreground"}`}
          >
            {EXPORT_VIEWPORTS[key].label}
          </button>
        ))}
      </div>

      <div className="overflow-auto border border-border bg-secondary/20 p-4">
        <div
          ref={ref}
          style={{ width: size.width, minHeight: size.height }}
          className="mx-auto bg-white"
        >
          <InvitationCanvas
            theme={theme}
            content={content}
            watermark={watermark}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void run("png")}>
          Export PNG
        </Button>
        {allowMultiExport ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void run("jpg")}
          >
            Export JPG
          </Button>
        ) : null}
        {allowPdf ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void run("pdf")}
          >
            Export PDF
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground self-center">
            PDF disponibil pe plan Premium+
          </p>
        )}
      </div>
    </div>
  );
}
