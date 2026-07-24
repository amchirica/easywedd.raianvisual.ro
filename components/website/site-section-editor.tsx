"use client";

import { arrayMove } from "@dnd-kit/sortable";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  VisualBuilder,
  type BuilderSectionItem,
} from "@/components/builder/visual-builder";
import { SiteCanvas, type SiteSectionView } from "@/components/website/site-canvas";
import { Button } from "@/components/ui/button";
import {
  normalizeSectionPresentation,
  normalizeThemePresentation,
  type SectionPresentation,
  type ThemePresentation,
} from "@/lib/builder/presentation";
import {
  publishWeddingSiteAction,
  saveWeddingSiteSectionsAction,
  unpublishWeddingSiteAction,
} from "@/lib/actions/website";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import { SECTION_LABELS_RO } from "@/lib/invitations/sections/types";
import type { CanonicalSectionKey, SectionContentMap } from "@/lib/invitations/sections/types";
import {
  mapWebsiteSectionType,
  sectionDataToSiteConfig,
  siteConfigToSectionData,
} from "@/lib/website/section-adapter";
import { ALL_SITE_SECTIONS, type SiteThemeConfig } from "@/types/website";

type EditorProps = {
  siteId: string;
  initialTheme: SiteThemeConfig;
  initialSections: SiteSectionView[];
  status: string;
  canPublish: boolean;
  showBranding: boolean;
};

const AUTOSAVE_MS = 1200;

export function SiteSectionEditor({
  siteId,
  initialTheme,
  initialSections,
  status,
  canPublish,
  showBranding,
}: EditorProps) {
  const [theme, setTheme] = useState(() =>
    normalizeThemePresentation(initialTheme),
  );
  const [sections, setSections] = useState(initialSections);
  const [activeId, setActiveId] = useState(initialSections[0]?.id ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const themeRef = useRef(theme);
  const sectionsRef = useRef(sections);
  const saveSeqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const persist = useCallback(async () => {
    if (!dirtyRef.current) return;
    const seq = ++saveSeqRef.current;
    setSaveState("saving");
    const snapshotTheme = themeRef.current;
    const snapshotSections = sectionsRef.current;
    try {
      await saveWeddingSiteSectionsAction(siteId, {
        theme: themeToSiteTheme(snapshotTheme),
        sections: snapshotSections.map((s) => ({
          id: s.id,
          section_type: s.section_type,
          section_config: s.section_config,
          sort_order: s.sort_order,
          is_visible: s.is_visible,
        })),
      });
      if (saveSeqRef.current !== seq) return;
      dirtyRef.current = false;
      const stamp = new Date().toLocaleTimeString("ro-RO");
      setSavedAt(stamp);
      setSaveState("saved");
    } catch {
      if (saveSeqRef.current !== seq) return;
      setSaveState("error");
    }
  }, [siteId]);

  function scheduleSave() {
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        void persist();
      });
    }, AUTOSAVE_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const builderSections: BuilderSectionItem[] = useMemo(
    () =>
      [...sections]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => {
          const key = mapWebsiteSectionType(s.section_type) ?? "hero";
          return {
            id: s.id,
            key,
            label: siteSectionLabel(s.section_type),
            enabled: s.is_visible,
          };
        }),
    [sections],
  );

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const mapped = active
    ? siteConfigToSectionData(active.section_type, active.section_config)
    : null;
  const activeKey = mapped?.key ?? ("hero" as CanonicalSectionKey);
  const activeContent =
    mapped?.data ?? sectionDefaults(activeKey);
  const activePresentation = normalizeSectionPresentation(
    active?.section_config.style,
  );

  function updateActiveContent(next: SectionContentMap[CanonicalSectionKey]) {
    if (!active) return;
    setSections((prev) => {
      const updated = prev.map((s) =>
        s.id === active.id
          ? {
              ...s,
              section_config: sectionDataToSiteConfig(
                activeKey,
                next,
                s.section_config.style,
                s.section_config,
              ),
            }
          : s,
      );
      sectionsRef.current = updated;
      scheduleSave();
      return updated;
    });
  }

  function updateActivePresentation(next: SectionPresentation) {
    if (!active || !mapped) return;
    setSections((prev) => {
      const updated = prev.map((s) =>
        s.id === active.id
          ? {
              ...s,
              section_config: sectionDataToSiteConfig(
                activeKey,
                mapped.data,
                next as unknown as Record<string, unknown>,
                s.section_config,
              ),
            }
          : s,
      );
      sectionsRef.current = updated;
      scheduleSave();
      return updated;
    });
  }

  return (
    <VisualBuilder
      sections={builderSections}
      activeId={active?.id ?? ""}
      onSelect={setActiveId}
      onReorder={(a, b) => {
        setSections((items) => {
          const sorted = [...items].sort((x, y) => x.sort_order - y.sort_order);
          const oldIndex = sorted.findIndex((i) => i.id === a);
          const newIndex = sorted.findIndex((i) => i.id === b);
          const updated = arrayMove(sorted, oldIndex, newIndex).map(
            (item, index) => ({
              ...item,
              sort_order: index,
            }),
          );
          sectionsRef.current = updated;
          scheduleSave();
          return updated;
        });
      }}
      onToggle={(id) =>
        setSections((prev) => {
          const updated = prev.map((s) =>
            s.id === id ? { ...s, is_visible: !s.is_visible } : s,
          );
          sectionsRef.current = updated;
          scheduleSave();
          return updated;
        })
      }
      content={activeContent}
      onContentChange={updateActiveContent}
      presentation={activePresentation}
      onPresentationChange={updateActivePresentation}
      theme={theme}
      onThemeChange={(next) => {
        setTheme(next);
        themeRef.current = next;
        scheduleSave();
      }}
      preview={
        <SiteCanvas
          theme={themeToSiteTheme(theme)}
          sections={sections}
          showBranding={showBranding}
        />
      }
      sidebarFooter={
        <div className="space-y-2 pt-4">
          {canPublish ? (
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                startTransition(() => {
                  void publishWeddingSiteAction(siteId);
                })
              }
            >
              Publică
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Publish necesită plan cu website_publish.
            </p>
          )}
          {status === "published" ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                startTransition(() => {
                  void unpublishWeddingSiteAction(siteId);
                })
              }
            >
              Unpublish
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Se salvează…"
              : saveState === "error"
                ? "Eroare la salvare"
                : savedAt
                  ? `Salvat la ${savedAt}`
                  : "Modificările se salvează automat"}
          </p>
        </div>
      }
    />
  );
}

function themeToSiteTheme(theme: ThemePresentation): SiteThemeConfig {
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

function siteSectionLabel(type: string) {
  const mapped = mapWebsiteSectionType(type);
  if (mapped && SECTION_LABELS_RO[mapped]) return SECTION_LABELS_RO[mapped];
  return (
    ALL_SITE_SECTIONS.find((s) => s.type === type)?.label ??
    type.replaceAll("_", " ")
  );
}
