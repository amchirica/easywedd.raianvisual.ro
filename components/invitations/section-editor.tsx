"use client";

import { startTransition, useEffect, useState } from "react";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";
import {
  publishInvitationProjectAction,
  saveInvitationProjectAction,
} from "@/lib/actions/invitations";
import {
  ALL_SECTIONS,
  type InvitationContentConfig,
  type InvitationSectionKey,
  type InvitationThemeConfig,
} from "@/types/invitations";

type SectionEditorProps = {
  projectId: string;
  initialName: string;
  initialTheme: InvitationThemeConfig;
  initialContent: InvitationContentConfig;
  rsvpDeadline: string | null;
  watermark: boolean;
};

export function SectionEditor({
  projectId,
  initialName,
  initialTheme,
  initialContent,
  rsvpDeadline,
  watermark,
}: SectionEditorProps) {
  const [name, setName] = useState(initialName);
  const [theme, setTheme] = useState(initialTheme);
  const [content, setContent] = useState(initialContent);
  const [deadline, setDeadline] = useState(rsvpDeadline ?? "");
  const [active, setActive] = useState<InvitationSectionKey>("hero");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("name", name);
      fd.set("theme_config", JSON.stringify(theme));
      fd.set("content_config", JSON.stringify(content));
      fd.set("rsvp_deadline", deadline);
      startTransition(() => {
        void saveInvitationProjectAction(fd).then(() => {
          setSavedAt(new Date().toLocaleTimeString("ro-RO"));
        });
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [projectId, name, theme, content, deadline]);

  function toggleSection(key: InvitationSectionKey) {
    setContent((prev) => {
      const exists = prev.enabledSections.includes(key);
      if (exists && prev.enabledSections.length === 1) return prev;
      return {
        ...prev,
        enabledSections: exists
          ? prev.enabledSections.filter((s) => s !== key)
          : [...prev.enabledSections, key],
      };
    });
  }

  function setField<K extends keyof InvitationContentConfig>(
    key: K,
    value: InvitationContentConfig[K],
  ) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr_360px]">
      <aside className="space-y-2">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Secțiuni
        </p>
        {ALL_SECTIONS.map((section) => {
          const enabled = content.enabledSections.includes(section.key);
          return (
            <div key={section.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleSection(section.key)}
                aria-label={`Activează ${section.label}`}
              />
              <button
                type="button"
                onClick={() => setActive(section.key)}
                className={`text-left text-sm ${
                  active === section.key ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {section.label}
              </button>
            </div>
          );
        })}
        <div className="pt-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              startTransition(() => {
                void publishInvitationProjectAction(projectId);
              });
            }}
          >
            Publică
          </Button>
          {savedAt ? (
            <p className="mt-2 text-xs text-muted-foreground">Salvat {savedAt}</p>
          ) : null}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nume proiect</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Deadline RSVP</Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {active === "hero" || active === "couple" ? (
          <FieldGroup title="Cuplu & intro">
            <TextField
              label="Nume 1"
              value={content.coupleName1}
              onChange={(v) => setField("coupleName1", v)}
            />
            <TextField
              label="Nume 2"
              value={content.coupleName2}
              onChange={(v) => setField("coupleName2", v)}
            />
            <TextField
              label="Text intro"
              value={content.introText}
              onChange={(v) => setField("introText", v)}
              multiline
            />
            <TextField
              label="URL imagine hero"
              value={content.heroImageUrl}
              onChange={(v) => setField("heroImageUrl", v)}
            />
          </FieldGroup>
        ) : null}

        {active === "when_where" ? (
          <FieldGroup title="Când & unde">
            <TextField
              label="Data"
              value={content.weddingDate}
              onChange={(v) => setField("weddingDate", v)}
            />
            <TextField
              label="Ora"
              value={content.weddingTime}
              onChange={(v) => setField("weddingTime", v)}
            />
            <TextField
              label="Locație ceremonie"
              value={content.ceremonyLocation}
              onChange={(v) => setField("ceremonyLocation", v)}
            />
            <TextField
              label="Locație petrecere"
              value={content.receptionLocation}
              onChange={(v) => setField("receptionLocation", v)}
            />
            <TextField
              label="URL hartă"
              value={content.mapUrl}
              onChange={(v) => setField("mapUrl", v)}
            />
          </FieldGroup>
        ) : null}

        {active === "schedule" ? (
          <FieldGroup title="Program">
            <TextField
              label="Program"
              value={content.scheduleText}
              onChange={(v) => setField("scheduleText", v)}
              multiline
            />
          </FieldGroup>
        ) : null}

        {active === "party" ? (
          <FieldGroup title="Părinți & nași">
            <TextField
              label="Părinți"
              value={content.parentsText}
              onChange={(v) => setField("parentsText", v)}
              multiline
            />
            <TextField
              label="Nași"
              value={content.godparentsText}
              onChange={(v) => setField("godparentsText", v)}
              multiline
            />
          </FieldGroup>
        ) : null}

        {active === "dress_code" ? (
          <FieldGroup title="Dress code">
            <TextField
              label="Dress code"
              value={content.dressCode}
              onChange={(v) => setField("dressCode", v)}
            />
          </FieldGroup>
        ) : null}

        {active === "travel" ? (
          <FieldGroup title="Transport & cazare">
            <TextField
              label="Transport"
              value={content.travelInfo}
              onChange={(v) => setField("travelInfo", v)}
              multiline
            />
            <TextField
              label="Cazare"
              value={content.accommodationInfo}
              onChange={(v) => setField("accommodationInfo", v)}
              multiline
            />
          </FieldGroup>
        ) : null}

        {active === "rsvp" ? (
          <FieldGroup title="RSVP">
            <TextField
              label="Mesaj RSVP"
              value={content.rsvpMessage}
              onChange={(v) => setField("rsvpMessage", v)}
              multiline
            />
          </FieldGroup>
        ) : null}

        {active === "footer" ? (
          <FieldGroup title="Footer & temă">
            <TextField
              label="Footer"
              value={content.footerText}
              onChange={(v) => setField("footerText", v)}
            />
            <div className="grid grid-cols-3 gap-2">
              {(["background", "foreground", "accent"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="capitalize">{key}</Label>
                  <Input
                    type="color"
                    value={theme[key]}
                    onChange={(e) =>
                      setTheme((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Font titlu</Label>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={theme.headingFont}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      headingFont: e.target.value,
                    }))
                  }
                >
                  {CONTROLLED_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Font body</Label>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={theme.bodyFont}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      bodyFont: e.target.value,
                    }))
                  }
                >
                  {CONTROLLED_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FieldGroup>
        ) : null}
      </div>

      <div className="border border-border bg-card p-2">
        <InvitationCanvas
          theme={theme}
          content={content}
          watermark={watermark}
          className="max-h-[80vh] overflow-y-auto"
        />
      </div>
    </div>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h2 className="font-heading text-2xl">{title}</h2>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
