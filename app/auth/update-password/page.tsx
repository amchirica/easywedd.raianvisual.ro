import { redirect } from "next/navigation";

/** Legacy path — keep for old emails; canonical is /update-password */
export default function AuthUpdatePasswordRedirectPage() {
  redirect("/update-password");
}
