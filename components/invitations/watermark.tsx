export function InvitationWatermark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-6">
      <p className="rounded bg-background/70 px-3 py-1 text-xs tracking-[0.2em] text-foreground/50 uppercase">
        EasyWedd
      </p>
    </div>
  );
}
