"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { startTransition, useEffect, useState } from "react";

import { SiteCanvas, type SiteSectionView } from "@/components/website/site-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";
import {
  publishWeddingSiteAction,
  saveWeddingSiteSectionsAction,
  unpublishWeddingSiteAction,
} from "@/lib/actions/website";
import type { SiteThemeConfig } from "@/types/website";

type EditorProps = {
  siteId: string;
  initialTheme: SiteThemeConfig;
  initialSections: SiteSectionView[];
  status: string;
  canPublish: boolean;
  showBranding: boolean;
};

export function SiteSectionEditor({
  siteId,
  initialTheme,
  initialSections,
  status,
  canPublish,
  showBranding,
}: EditorProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [sections, setSections] = useState(initialSections);
  const [activeId, setActiveId] = useState(initialSections[0]?.id ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void saveWeddingSiteSectionsAction(siteId, {
          theme,
          sections: sections.map((s) => ({
            id: s.id,
            section_type: s.section_type,
            section_config: s.section_config,
            sort_order: s.sort_order,
            is_visible: s.is_visible,
          })),
        }).then(() => setSavedAt(new Date().toLocaleTimeString("ro-RO")));
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [siteId, theme, sections]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const moved = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sort_order: index,
      }));
      return moved;
    });
  }

  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr_360px]">
      <aside className="space-y-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Secțiuni
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableRow
                key={section.id}
                id={section.id}
                label={section.section_type}
                active={section.id === active?.id}
                visible={section.is_visible}
                onSelect={() => setActiveId(section.id)}
                onToggle={() =>
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === section.id
                        ? { ...s, is_visible: !s.is_visible }
                        : s,
                    ),
                  )
                }
              />
            ))}
          </SortableContext>
        </DndContext>

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
          {savedAt ? (
            <p className="text-xs text-muted-foreground">Salvat {savedAt}</p>
          ) : null}
        </div>
      </aside>

      <div className="space-y-4">
        {active ? (
          <>
            <div className="space-y-2">
              <Label>Titlu</Label>
              <Input
                value={active.section_config.title ?? ""}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === active.id
                        ? {
                            ...s,
                            section_config: {
                              ...s.section_config,
                              title: e.target.value,
                            },
                          }
                        : s,
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Conținut</Label>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={active.section_config.body ?? ""}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((s) =>
                      s.id === active.id
                        ? {
                            ...s,
                            section_config: {
                              ...s.section_config,
                              body: e.target.value,
                            },
                          }
                        : s,
                    ),
                  )
                }
              />
            </div>
            {active.section_type === "rsvp" ? (
              <div className="space-y-2">
                <Label>URL RSVP</Label>
                <Input
                  value={active.section_config.rsvpUrl ?? ""}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((s) =>
                        s.id === active.id
                          ? {
                              ...s,
                              section_config: {
                                ...s.section_config,
                                rsvpUrl: e.target.value,
                              },
                            }
                          : s,
                      ),
                    )
                  }
                  placeholder="/rsvp/... sau /i/..."
                />
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
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
                    setTheme((prev) => ({ ...prev, bodyFont: e.target.value }))
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
          </>
        ) : null}
      </div>

      <div className="border border-border bg-card p-2">
        <SiteCanvas
          theme={theme}
          sections={sections}
          showBranding={showBranding}
        />
      </div>
    </div>
  );
}

function SortableRow({
  id,
  label,
  active,
  visible,
  onSelect,
  onToggle,
}: {
  id: string;
  label: string;
  active: boolean;
  visible: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}
    >
      <button type="button" className="cursor-grab px-1" {...attributes} {...listeners}>
        ::
      </button>
      <input type="checkbox" checked={visible} onChange={onToggle} />
      <button type="button" onClick={onSelect} className="capitalize text-left">
        {label.replaceAll("_", " ")}
      </button>
    </div>
  );
}
