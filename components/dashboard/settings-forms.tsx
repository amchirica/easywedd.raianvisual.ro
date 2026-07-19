"use client";

import { useActionState } from "react";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
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
  if (state.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {state.error}
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
  const [state, action, pending] = useActionState(
    updateProfileSettingsAction,
    {} as SettingsActionResult,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="full_name">Nume</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={profile.email} disabled readOnly />
        </div>
        <div className="space-y-1">
          <Label htmlFor="locale">Limbă</Label>
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
          <Label htmlFor="timezone">Fus orar</Label>
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
        {pending ? "Se salvează..." : "Salvează profilul"}
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
  const [state, action, pending] = useActionState(
    updateWorkspaceSettingsAction,
    {} as SettingsActionResult,
  );

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Nu ai permisiunea de a redenumi acest workspace.
        {workspace.workspace_type === "admin"
          ? " Workspace-urile de tip admin sunt protejate."
          : ""}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspace.id} />
      <div className="space-y-1">
        <Label htmlFor="workspace_name">Nume workspace</Label>
        <Input
          id="workspace_name"
          name="name"
          required
          defaultValue={workspace.name}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tipul workspace-ului ({workspace.workspace_type}) nu poate fi schimbat
        din Setări.
      </p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Se salvează..." : "Salvează workspace"}
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
  const [state, action, pending] = useActionState(
    switchWorkspaceFormAction,
    {} as SettingsActionResult,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="switch_workspace">Workspace activ</Label>
        <select
          id="switch_workspace"
          name="workspace_id"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue={activeId ?? undefined}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
              {ws.id === activeId ? " (activ)" : ""}
            </option>
          ))}
        </select>
      </div>
      <Feedback state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Se schimbă..." : "Activează workspace-ul selectat"}
      </Button>
    </form>
  );
}

export function WeddingPreferencesForm({ wedding }: { wedding: Wedding }) {
  const [state, action, pending] = useActionState(
    updateWeddingPreferencesAction,
    {} as SettingsActionResult,
  );
  const statuses = Object.keys(WEDDING_STATUS_LABELS) as Array<
    z.infer<typeof weddingStatusSchema>
  >;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="couple_name_1">Partener 1</Label>
        <Input
          id="couple_name_1"
          name="couple_name_1"
          required
          defaultValue={wedding.couple_name_1 ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="couple_name_2">Partener 2</Label>
        <Input
          id="couple_name_2"
          name="couple_name_2"
          required
          defaultValue={wedding.couple_name_2 ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wedding_date">Data</Label>
        <Input
          id="wedding_date"
          name="wedding_date"
          type="date"
          defaultValue={wedding.wedding_date ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="city">Oraș</Label>
        <Input id="city" name="city" defaultValue={wedding.city ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="venue_name">Locație</Label>
        <Input
          id="venue_name"
          name="venue_name"
          defaultValue={wedding.venue_name ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="estimated_guest_count">Invitați estimați</Label>
        <Input
          id="estimated_guest_count"
          name="estimated_guest_count"
          type="number"
          min={0}
          defaultValue={wedding.estimated_guest_count ?? 0}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="currency">Monedă</Label>
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
        <Label htmlFor="wedding_status">Status</Label>
        <select
          id="wedding_status"
          name="wedding_status"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue={wedding.wedding_status}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {WEDDING_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 space-y-3">
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Se salvează..." : "Salvează preferințele nunții"}
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
        Emailuri tranzacționale
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="reminders_enabled"
          defaultChecked={prefs.reminders_enabled}
        />
        Reminder-e
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="marketing_enabled"
          defaultChecked={prefs.marketing_enabled}
        />
        Marketing
      </label>
      <Feedback state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Se salvează..." : "Salvează notificările"}
      </Button>
    </form>
  );
}

export function SettingsPasswordSection() {
  return <UpdatePasswordForm />;
}
