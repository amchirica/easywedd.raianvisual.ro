"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  VisualBuilder,
  type BuilderSectionItem,
} from "@/components/builder/visual-builder";
import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import { uiSectionRegistry } from "@/components/invitations/sections/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  publishInvitationProjectAction,
  saveInvitationProjectAction,
} from "@/lib/actions/invitations";
import {
  DEFAULT_SECTION_PRESENTATION,
  normalizeSectionPresentation,
  normalizeThemePresentation,
  type SectionPresentation,
  type ThemePresentation,
} from "@/lib/builder/presentation";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import {
  listEditorSections,
  normalizeInvitationContent,
  type CanonicalSectionKey,
} from "@/lib/invitations/sections";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [theme, setTheme] = useState(() =>
    normalizeThemePresentation(initialTheme),
  );
  const [content, setContent] = useState(() =>
    normalizeInvitationContent(initialContent),
  );
  const [deadline, setDeadline] = useState(rsvpDeadline ?? "");
  const navKeys = listEditorSections(content);
  const [activeKey, setActiveKey] = useState<CanonicalSectionKey>(
    navKeys[0] ?? "hero",
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const contentRef = useRef(content);
  const themeRef = useRef(theme);
  const nameRef = useRef(name);
  const deadlineRef = useRef(deadline);
  const saveSeqRef = useRef(0);
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);
  useEffect(() => {
    deadlineRef.current = deadline;
  }, [deadline]);

  const persist = useCallback(async () => {
    const seq = ++saveSeqRef.current;
    setSaveState("saving");
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("name", nameRef.current);
    fd.set("theme_config", JSON.stringify(themeToInvitationTheme(themeRef.current)));
    fd.set("content_config", JSON.stringify(contentRef.current));
    fd.set("rsvp_deadline", deadlineRef.current);
    try {
      await saveInvitationProjectAction(fd);
      if (saveSeqRef.current !== seq) return;
      const stamp = new Date().toLocaleTimeString("ro-RO");
      setSaveState("saved");
      setSavedAt(stamp);
    } catch {
      if (saveSeqRef.current !== seq) return;
      setSaveState("error");
    }
  }, [projectId]);

  function scheduleSave() {
    if (metaTimer.current) clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => {
      startTransition(() => {
        void persist();
      });
    }, 1200);
  }

  const builderSections: BuilderSectionItem[] = useMemo(
    () =>
      navKeys.map((key) => ({
        id: key,
        key,
        label: uiSectionRegistry[key]?.label ?? key,
        enabled: content.enabledSections.includes(key),
      })),
    [navKeys, content.enabledSections],
  );

  const activePresentation = normalizeSectionPresentation(
    content.sectionStyles?.[activeKey] ?? DEFAULT_SECTION_PRESENTATION,
  );

  function updateSectionContent(
    next: InvitationContentConfig["sections"][CanonicalSectionKey],
  ) {
    setContent((prev) => {
      const updated = normalizeInvitationContent({
        ...prev,
        sections: {
          ...prev.sections,
          [activeKey]: next,
        },
        sectionStyles: prev.sectionStyles,
      });
      contentRef.current = updated;
      scheduleSave();
      return updated;
    });
  }

  function updatePresentation(next: SectionPresentation) {
    setContent((prev) => {
      const updated = {
        ...prev,
        sectionStyles: {
          ...(prev.sectionStyles ?? {}),
          [activeKey]: next,
        },
      };
      contentRef.current = updated;
      scheduleSave();
      return updated;
    });
  }

  function updateTheme(next: ThemePresentation) {
    setTheme(next);
    themeRef.current = next;
    scheduleSave();
  }

  return (
    <VisualBuilder
      sections={builderSections}
      activeId={activeKey}
      onSelect={(id) => setActiveKey(id as CanonicalSectionKey)}
      onReorder={(a, b) => {
        setContent((prev) => {
          const order = [...listEditorSections(prev)];
          const oldIndex = order.indexOf(a as CanonicalSectionKey);
          const newIndex = order.indexOf(b as CanonicalSectionKey);
          if (oldIndex < 0 || newIndex < 0) return prev;
          const next = {
            ...prev,
            sectionOrder: arrayMove(order, oldIndex, newIndex),
          };
          contentRef.current = next;
          scheduleSave();
          return next;
        });
      }}
      onToggle={(id) => {
        const key = id as CanonicalSectionKey;
        setContent((prev) => {
          const exists = prev.enabledSections.includes(key);
          if (exists && prev.enabledSections.length === 1) return prev;
          const next = {
            ...prev,
            enabledSections: exists
              ? prev.enabledSections.filter((s) => s !== key)
              : [...prev.enabledSections, key],
          };
          contentRef.current = next;
          scheduleSave();
          return next;
        });
      }}
      content={content.sections[activeKey] ?? sectionDefaults(activeKey)}
      onContentChange={updateSectionContent}
      presentation={activePresentation}
      onPresentationChange={updatePresentation}
      theme={theme}
      onThemeChange={updateTheme}
      preview={
        <InvitationCanvas
          theme={themeToInvitationTheme(theme)}
          content={content}
          watermark={watermark}
          preview
          className="max-h-[80vh] overflow-y-auto"
        />
      }
      settingsHeader={
        <div className="space-y-3 border-b border-border pb-4">
          <div className="space-y-1">
            <Label>Nume proiect</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                scheduleSave();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Deadline RSVP</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                scheduleSave();
              }}
            />
          </div>
        </div>
      }
      sidebarFooter={
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
          <SaveStatusLabel state={saveState} savedAt={savedAt} />
        </div>
      }
    />
  );
}

function themeToInvitationTheme(theme: ThemePresentation): InvitationThemeConfig {
  return {
    background: theme.background,
    foreground: theme.foreground,
    accent: theme.accent,
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
    density: theme.density,
    radius: theme.radius,
    pageGradientFrom: theme.pageGradientFrom || undefined,
    pageGradientTo: theme.pageGradientTo || undefined,
    buttonBackground: theme.buttonBackground || undefined,
    buttonForeground: theme.buttonForeground || undefined,
  };
}

function SaveStatusLabel({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: string | null;
}) {
  if (state === "saving") {
    return <p className="mt-2 text-xs text-muted-foreground">Se salvează…</p>;
  }
  if (state === "error") {
    return <p className="mt-2 text-xs text-destructive">Eroare la salvare</p>;
  }
  if (state === "saved" && savedAt) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">Salvat la {savedAt}</p>
    );
  }
  return null;
}
