import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni",
};

export default function TermsPage() {
  return (
    <div className="bg-background">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <h1 className="font-heading text-4xl">Termeni și condiții</h1>
        <p className="mt-6 text-muted-foreground">
          Prin crearea unui cont EasyWedd, accepți utilizarea platformei pentru
          organizarea evenimentului de nuntă, inclusiv gestionarea workspace-ului,
          a membrilor și a datelor asociate.
        </p>
        <h2 className="mt-10 font-heading text-2xl">Workspace-uri</h2>
        <p className="mt-3 text-muted-foreground">
          Fiecare workspace aparține unei organizații sau unui cuplu. Accesul
          membrilor este controlat prin roluri și invitații.
        </p>
        <h2 className="mt-10 font-heading text-2xl">Abonamente</h2>
        <p className="mt-3 text-muted-foreground">
          Integrarea Stripe este pregătită; în această etapă plățile nu sunt
          activate. Planul trial este disponibil pentru onboarding.
        </p>
      </article>
    </div>
  );
}
