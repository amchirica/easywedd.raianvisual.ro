"use client";

import { useActionState } from "react";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  switchWorkspaceFormAction,
  updateNotificationPreferencesAction,
  updateProfileSettingsAction,
  updateWeddingPreferencesAction,
  updateWorkspaceSettingsAction,
  type SettingsActionResult,
} from "@/lib/actions/settings";
import { translateActionError } from "@/lib/i18n/errors";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import {
  LOCALE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/validations/settings";
import {
  WEDDING_STATUS_LABELS,
  type weddingStatusSchema,
} from "@/lib/validations/wedding";
import type { Profile, Wedding, Workspace } from "@/types/database";
import type { z } from "zod";

function Feedback({ state }: { state: SettingsActionResult }) {
  const { locale } = useI18n();
  if (state.error || state.errorCode) {
    const message = translateActionError(state.error, state.errorCode, locale);
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {message}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(
    updateProfileSettingsAction,
    {} as SettingsActionResult,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="full_name">{dict.settings.name}</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label>{dict.common.email}</Label>
          <Input value={profile.email} disabled readOnly />
        </div>
        <div className="space-y-1">
          <Label htmlFor="locale">{dict.settings.language}</Label>
          <select
            id="locale"
            name="locale"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            defaultValue={profile.locale === "en" ? "en" : "ro"}
          >
            {LOCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="timezone">{dict.settings.timezone}</Label>
          <select
            id="timezone"
            name="timezone"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            defaultValue={profile.timezone || "Europe/Bucharest"}
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? dict.settings.saving : dict.settings.saveProfile}
      </Button>
    </form>
  );
}

export function WorkspaceSettingsForm({
  workspace,
  canEdit,
}: {
  workspace: Workspace;
  canEdit: boolean;
}) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(
    updateWorkspaceSettingsAction,
    {} as SettingsActionResult,
  );

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        {dict.settings.noRenamePermission}
        {workspace.workspace_type === "admin"
          ? dict.settings.adminWorkspaceProtected
          : ""}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspace.id} />
      <div className="space-y-1">
        <Label htmlFor="workspace_name">{dict.settings.workspaceName}</Label>
        <Input
          id="workspace_name"
          name="name"
          required
          defaultValue={workspace.name}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {dict.settings.workspaceTypeImmutable.replace(
          "{type}",
          workspace.workspace_type,
        )}
      </p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? dict.settings.saving : dict.settings.saveWorkspace}
      </Button>
    </form>
  );
}

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: Workspace[];
  activeId: string | null;
}) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(
    switchWorkspaceFormAction,
    {} as SettingsActionResult,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="switch_workspace">{dict.settings.activeWorkspace}</Label>
        <select
          id="switch_workspace"
          name="workspace_id"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue={activeId ?? undefined}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
              {ws.id === activeId ? dict.settings.activeSuffix : ""}
            </option>
          ))}
        </select>
      </div>
      <Feedback state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? dict.settings.switching : dict.settings.activateWorkspace}
      </Button>
    </form>
  );
}

export function WeddingPreferencesForm({ wedding }: { wedding: Wedding }) {
  const { dict, locale } = useI18n();
  const [state, action, pending] = useActionState(
    updateWeddingPreferencesAction,
    {} as SettingsActionResult,
  );
  const statuses = Object.keys(WEDDING_STATUS_LABELS) as Array<
    z.infer<typeof weddingStatusSchema>
  >;
  const fields = dict.wedding.fields;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="couple_name_1">{fields.couple1}</Label>
        <Input
          id="couple_name_1"
          name="couple_name_1"
          required
          defaultValue={wedding.couple_name_1 ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="couple_name_2">{fields.couple2}</Label>
        <Input
          id="couple_name_2"
          name="couple_name_2"
          required
          defaultValue={wedding.couple_name_2 ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wedding_date">{fields.date}</Label>
        <Input
          id="wedding_date"
          name="wedding_date"
          type="date"
          defaultValue={wedding.wedding_date ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="city">{fields.city}</Label>
        <Input id="city" name="city" defaultValue={wedding.city ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="venue_name">{fields.venue}</Label>
        <Input
          id="venue_name"
          name="venue_name"
          defaultValue={wedding.venue_name ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="estimated_guest_count">{fields.guestCount}</Label>
        <Input
          id="estimated_guest_count"
          name="estimated_guest_count"
          type="number"
          min={0}
          defaultValue={wedding.estimated_guest_count ?? 0}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="currency">{dict.settings.currency}</Label>
        <select
          id="currency"
          name="currency"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue={wedding.currency || "RON"}
        >
          <option value="RON">RON</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="wedding_status">{fields.status}</Label>
        <select
          id="wedding_status"
          name="wedding_status"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue={wedding.wedding_status}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel("wedding", status, locale)}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 space-y-3">
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? dict.settings.saving : dict.settings.saveWeddingPrefs}
        </Button>
      </div>
    </form>
  );
}

export function NotificationPreferencesForm({
  prefs,
}: {
  prefs: {
    transactional_enabled: boolean;
    reminders_enabled: boolean;
    marketing_enabled: boolean;
  };
}) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(
    updateNotificationPreferencesAction,
    {} as SettingsActionResult,
  );

  return (
    <form action={action} className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="transactional_enabled"
          defaultChecked={prefs.transactional_enabled}
        />
        {dict.settings.transactionalEmails}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="reminders_enabled"
          defaultChecked={prefs.reminders_enabled}
        />
        {dict.settings.reminders}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="marketing_enabled"
          defaultChecked={prefs.marketing_enabled}
        />
        {dict.settings.marketing}
      </label>
      <Feedback state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? dict.settings.saving : dict.settings.saveNotifications}
      </Button>
    </form>
  );
}

export function SettingsPasswordSection() {
  return <UpdatePasswordForm />;
}
