import { redirect } from "next/navigation";

/** Legacy path — keep for old emails; canonical is /auth/reset-password */
export default function LegacyUpdatePasswordPage() {
  redirect("/auth/reset-password");
}
