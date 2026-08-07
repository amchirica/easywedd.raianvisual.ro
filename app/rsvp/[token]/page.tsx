import type { Metadata } from "next";

import { RsvpForm } from "@/components/planner/rsvp-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.publicUi.rsvpMetaTitle };
}

type RsvpPageProps = {
  params: Promise<{ token: string }>;
};

export default async function RsvpPage({ params }: RsvpPageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { publicUi } = dict;
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_rsvp_by_token", {
    p_token: token,
  });

  const row = Array.isArray(data) ? data[0] : data;

  if (error || !row) {
    return (
      <Shell>
        <h1 className="font-heading text-3xl">{publicUi.linkInvalid}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.linkInvalidBody}
        </p>
      </Shell>
    );
  }

  if (row.revoked_at) {
    return (
      <Shell>
        <h1 className="font-heading text-3xl">{publicUi.linkRevoked}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.linkRevokedBody}
        </p>
      </Shell>
    );
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return (
      <Shell>
        <h1 className="font-heading text-3xl">{publicUi.linkExpired}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.linkExpiredBody}
        </p>
      </Shell>
    );
  }

  if (row.used_at) {
    return (
      <Shell>
        <h1 className="font-heading text-3xl">{publicUi.responseRecorded}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.responseRecordedBody.replace(
            "{name}",
            String(row.first_name ?? ""),
          )}
        </p>
      </Shell>
    );
  }

  const guestName = `${row.first_name} ${row.last_name}`.trim();

  return (
    <Shell>
      <p className="text-sm text-muted-foreground">
        {[row.couple_name_1, row.couple_name_2].filter(Boolean).join(" & ")}
        {row.wedding_date ? ` · ${row.wedding_date}` : ""}
      </p>
      <h1 className="mt-2 font-heading text-3xl">
        {publicUi.rsvpHeading.replace("{name}", guestName)}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{publicUi.rsvpHint}</p>
      <div className="mt-6">
        <RsvpForm
          token={token}
          defaults={{
            attendance_count: row.attendance_count,
            children_count: row.children_count,
            meal_preference: row.meal_preference ?? "",
            allergies: row.allergies ?? "",
          }}
        />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)] px-6 py-16">
      <div className="w-full max-w-md border border-border bg-card p-8">{children}</div>
    </div>
  );
}
