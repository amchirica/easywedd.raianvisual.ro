"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

type QrCodeProps = {
  value: string;
  filename?: string;
};

export function InvitationQrCode({ value, filename = "invitation-qr.png" }: QrCodeProps) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    void QRCode.toDataURL(value, { width: 320, margin: 1 }).then(setSrc);
  }, [value]);

  if (!src) {
    return <p className="text-sm text-muted-foreground">Se generează QR…</p>;
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR invitație" className="h-40 w-40 border border-border bg-white p-2" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const a = document.createElement("a");
          a.href = src;
          a.download = filename;
          a.click();
        }}
      >
        Descarcă QR PNG
      </Button>
    </div>
  );
}
