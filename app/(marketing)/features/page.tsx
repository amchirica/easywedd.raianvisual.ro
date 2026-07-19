import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funcționalități",
};

const features = [
  {
    title: "Wedding Planner",
    description:
      "Task-uri, checklist-uri și calendar pentru fiecare etapă a organizării.",
  },
  {
    title: "Invitation Studio",
    description:
      "Invitații digitale elegante, cu RSVP și urmărirea răspunsurilor.",
  },
  {
    title: "Wedding Website Builder",
    description:
      "Un site de nuntă dedicat, cu informații esențiale pentru invitați.",
  },
  {
    title: "Workspace colaborativ",
    description:
      "Invită partenerul, plannerul sau fotograful — fiecare cu rolul potrivit.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f7f4ef_0%,#fffdf9_45%,#efe8dc_100%)]">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <header className="max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl">Funcționalități</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Trei module majore, pe o fundație comună de workspace și abonamente.
          </p>
        </header>
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="border-t border-border pt-6 transition duration-500"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <h2 className="font-heading text-2xl">{feature.title}</h2>
              <p className="mt-3 text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
