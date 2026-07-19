import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Resetare parolă",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl">Resetare parolă</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Introdu emailul contului și îți trimitem un link de resetare.
      </p>
      <AuthForm mode="forgot" action={forgotPasswordAction} />
    </div>
  );
}
