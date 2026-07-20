import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { getSafeNextPath } from "@/lib/url";

export const metadata: Metadata = {
  title: "Înregistrare",
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string; claim?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? null, "/dashboard/onboarding");

  return (
    <div>
      <h1 className="font-heading text-3xl">Creează cont</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Începe cu un workspace pentru nunta ta.
      </p>
      <RegisterForm nextPath={nextPath} claimToken={params.claim} />
    </div>
  );
}
