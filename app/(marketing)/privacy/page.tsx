import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidențialitate",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-28 prose-neutral">
        <h1 className="font-heading text-4xl">Politica de confidențialitate</h1>
        <p className="mt-6 text-muted-foreground">
          Datele personale sunt colectate exclusiv pentru a facilita organizarea
          nunții, comunicarea dintre participanți și gestionarea eficientă a
          evenimentului. Acestea sunt protejate și nu sunt utilizate automat în
          scopuri de marketing.
        </p>
        <h2 className="mt-10 font-heading text-2xl">Consimțăminte</h2>
        <p className="mt-3 text-muted-foreground">
          Termenii și confidențialitatea sunt obligatorii la înregistrare.
          Marketingul, analytics și cercetarea de piață anonimizată necesită
          consimțăminte separate.
        </p>
        <h2 className="mt-10 font-heading text-2xl">Cercetare de industrie</h2>
        <p className="mt-3 text-muted-foreground">
          Datele pentru cercetare de piață nu sunt folosite fără consimțământul
          explicit pentru cercetare anonimizată de industrie.
        </p>
      </article>
    </div>
  );
}
