import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getCurrentUserContext } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserContext();

  if (!user) {
    redirect("/login");
  }

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <h1 className="font-heading text-4xl">Configurează spațiul de lucru</h1>
        <p className="mt-3 text-muted-foreground">
          Câțiva pași pentru a crea workspace-ul nunții și a invita partenerul.
        </p>
      </header>
      <OnboardingForm />
    </div>
  );
}
