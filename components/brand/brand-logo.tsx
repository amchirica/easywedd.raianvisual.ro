"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MARK_SRC = "/brand/raian-mark.png";

type BrandLogoProps = {
  href?: string;
  showWordmark?: boolean;
  /** Visual size of the mark (px). Aspect ratio preserved. */
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  priority?: boolean;
  /**
   * When true on dark surfaces, wraps the mark in a light pad for contrast.
   * Does not invert or recolor the logo asset.
   */
  lightPad?: boolean;
  /** @deprecated Prefer lightPad — invert filters are not used. */
  inverted?: boolean;
};

/**
 * Brand mark + optional wordmark. Always uses PNG (never ICO) for next/image.
 */
export function BrandLogo({
  href = "/",
  showWordmark = true,
  size = 28,
  className,
  wordmarkClassName,
  priority = false,
  lightPad = false,
  inverted = false,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const usePad = lightPad || inverted;

  const markInner = failed ? (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-sm bg-foreground font-heading text-[0.65em] font-semibold text-background"
      style={{ width: size, height: size }}
    >
      N
    </span>
  ) : (
    <Image
      src={MARK_SRC}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );

  const mark = usePad ? (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm"
      style={{ width: size + 8, height: size + 8 }}
    >
      {failed ? (
        <span
          aria-hidden
          className="inline-flex size-full items-center justify-center rounded-sm bg-[#2a2420] font-heading text-[0.65em] font-semibold text-white"
        >
          N
        </span>
      ) : (
        <Image
          src={MARK_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="object-contain"
          style={{ width: size - 2, height: size - 2 }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  ) : (
    markInner
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      {showWordmark ? (
        <span
          className={cn(
            "font-heading text-2xl leading-none tracking-tight",
            wordmarkClassName,
          )}
        >
          {APP_NAME}
        </span>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex items-center"
      aria-label={APP_NAME}
    >
      {content}
    </Link>
  );
}
