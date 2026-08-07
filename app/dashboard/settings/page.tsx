import type { Metadata } from "next";

import {
  NotificationPreferencesForm,
  ProfileSettingsForm,
  SettingsPasswordSection,
  WeddingPreferencesForm,
  WorkspaceSettingsForm,
  WorkspaceSwitcher,
} from "@/components/dashboard/settings-forms";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { canManagePlanner } from "@/lib/planner/access";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.settings.title };
}

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { user, profile, activeWorkspace, workspaces, wedding } =
    await getCurrentUserContext();

  if (!user || !profile) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">{dict.settings.title}</h1>
        <p className="text-muted-foreground">{dict.settings.authRequired}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: membership }, { data: emailPrefs }] = await Promise.all([
    activeWorkspace
      ? supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", activeWorkspace.id)
          .eq("user_id", user.id)
          .eq("invitation_status", "accepted")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("email_preferences")
      .select("transactional_enabled, reminders_enabled, marketing_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
  const canEditWorkspace =
    Boolean(membership) &&
    ["owner", "partner", "admin"].includes(membership?.role ?? "") &&
    (activeWorkspace?.workspace_type !== "admin" || Boolean(isPlatformAdmin));

  const canEditWedding = canManagePlanner(membership?.role);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{dict.settings.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.settings.subtitle}</p>
      </header>

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">{dict.settings.profileSection}</h2>
        <div className="mt-4">
          <ProfileSettingsForm profile={profile} />
        </div>
      </section>

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">{dict.settings.passwordSection}</h2>
        <div className="mt-4 max-w-md">
          <SettingsPasswordSection />
        </div>
      </section>

      <section className="space-y-6 border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">{dict.settings.workspaceSection}</h2>
        {workspaces.length > 0 ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeId={activeWorkspace?.id ?? null}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {dict.settings.noWorkspace}
          </p>
        )}
        {activeWorkspace ? (
          <WorkspaceSettingsForm
            workspace={activeWorkspace}
            canEdit={canEditWorkspace}
          />
        ) : null}
      </section>

      {wedding && canEditWedding ? (
        <section className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">
            {dict.settings.weddingPrefsSection}
          </h2>
          <div className="mt-4">
            <WeddingPreferencesForm wedding={wedding} />
          </div>
        </section>
      ) : null}

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">
          {dict.settings.notificationsSection}
        </h2>
        <div className="mt-4">
          <NotificationPreferencesForm
            prefs={{
              transactional_enabled: emailPrefs?.transactional_enabled ?? true,
              reminders_enabled: emailPrefs?.reminders_enabled ?? true,
              marketing_enabled: emailPrefs?.marketing_enabled ?? false,
            }}
          />
        </div>
      </section>
    </div>
  );
}
