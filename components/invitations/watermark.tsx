import Image from "next/image";

export function InvitationWatermark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-6">
      <div className="flex items-center gap-2 rounded bg-background/70 px-3 py-1.5">
        <Image
          src="/brand/raian-mark-32.png"
          alt=""
          width={14}
          height={14}
          className="opacity-50"
        />
        <p className="text-xs tracking-[0.2em] text-foreground/50 uppercase">
          EasyWedd
        </p>
      </div>
    </div>
  );
}
