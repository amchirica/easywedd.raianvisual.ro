type StatCardProps = {
  title: string;
  value: string;
  hint: string;
};

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <article className="border border-border bg-card p-5 transition duration-300 hover:border-champagne/50">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-3 font-heading text-3xl tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
