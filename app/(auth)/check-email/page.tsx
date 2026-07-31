import type { Metadata } from "next";

import { CheckEmailClient } from "@/components/auth/check-email-client";
import { getPendingSignupEmail } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Verifică-ți emailul",
};

export default async function CheckEmailPage() {
  const email = await getPendingSignupEmail();

  return <CheckEmailClient initialEmail={email} />;
}
