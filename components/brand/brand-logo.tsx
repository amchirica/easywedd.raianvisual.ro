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
  /** Invert mark for dark/hero backgrounds via CSS filter */
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
  inverted = false,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  const mark = failed ? (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm bg-foreground font-heading text-[0.65em] font-semibold text-background",
        inverted && "bg-background text-foreground",
      )}
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
      className={cn(
        "shrink-0 object-contain",
        inverted && "brightness-0 invert",
      )}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
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
    <Link href={href} className="inline-flex items-center" aria-label={APP_NAME}>
      {content}
    </Link>
  );
}
