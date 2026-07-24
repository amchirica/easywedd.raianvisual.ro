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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useState } from "react";

import { SchemaForm } from "@/components/builder/schema-form";
import { SectionEditorPanel } from "@/components/invitations/sections/section-editors";
import {
  CONTENT_FIELD_SCHEMAS,
  presentationFieldsForSection,
  THEME_FIELD_SCHEMA,
} from "@/lib/builder/field-schema";
import {
  DEFAULT_SECTION_PRESENTATION,
  normalizeSectionPresentation,
  normalizeThemePresentation,
  type SectionPresentation,
  type ThemePresentation,
} from "@/lib/builder/presentation";
import type {
  CanonicalSectionKey,
  SectionContentMap,
} from "@/lib/invitations/sections/types";

/** Sections with nested lists / colors that need specialized editors */
const RICH_LIST_SECTIONS: CanonicalSectionKey[] = [
  "timeline",
  "gallery",
  "faq",
  "story",
  "accommodation",
  "dress_code",
];

export type BuilderSectionItem = {
  id: string;
  key: CanonicalSectionKey;
  label: string;
  enabled: boolean;
};

type SettingsTab = "content" | "presentation" | "theme";

type VisualBuilderProps = {
  sections: BuilderSectionItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggle: (id: string) => void;
  content: SectionContentMap[CanonicalSectionKey];
  onContentChange: (next: SectionContentMap[CanonicalSectionKey]) => void;
  presentation: SectionPresentation;
  onPresentationChange: (next: SectionPresentation) => void;
  theme: ThemePresentation;
  onThemeChange: (next: ThemePresentation) => void;
  preview: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  settingsHeader?: React.ReactNode;
};

export function VisualBuilder({
  sections,
  activeId,
  onSelect,
  onReorder,
  onToggle,
  content,
  onContentChange,
  presentation,
  onPresentationChange,
  theme,
  onThemeChange,
  preview,
  sidebarFooter,
  settingsHeader,
}: VisualBuilderProps) {
  const [tab, setTab] = useState<SettingsTab>("content");
  /** Avoid SSR/client DnD accessibility id mismatches (DndDescribedBy-N). */
  const [dndReady, setDndReady] = useState(false);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const sectionKey = active?.key ?? "hero";

  useEffect(() => {
    setDndReady(true);
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    onReorder(String(a.id), String(over.id));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(280px,380px)]">
      <aside className="space-y-3 rounded-lg border border-border bg-card/40 p-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Secțiuni
        </p>
        {dndReady ? (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableSectionRow
                  key={section.id}
                  id={section.id}
                  label={section.label}
                  active={section.id === active?.id}
                  enabled={section.enabled}
                  onSelect={() => onSelect(section.id)}
                  onToggle={() => onToggle(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-1">
            {sections.map((section) => (
              <StaticSectionRow
                key={section.id}
                label={section.label}
                active={section.id === active?.id}
                enabled={section.enabled}
                onSelect={() => onSelect(section.id)}
                onToggle={() => onToggle(section.id)}
              />
            ))}
          </div>
        )}
        {sidebarFooter}
      </aside>

      <div className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
        {settingsHeader}

        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {(
            [
              ["content", "Conținut"],
              ["presentation", "Prezentare"],
              ["theme", "Temă pagină"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "content" && active ? (
          RICH_LIST_SECTIONS.includes(sectionKey) ? (
            <SectionEditorPanel
              sectionKey={sectionKey}
              data={content}
              onChange={onContentChange}
            />
          ) : (
            <SchemaForm
              fields={CONTENT_FIELD_SCHEMAS[sectionKey] ?? []}
              values={content as unknown as Record<string, unknown>}
              onChange={(next) =>
                onContentChange(
                  next as unknown as SectionContentMap[CanonicalSectionKey],
                )
              }
            />
          )
        ) : null}

        {tab === "presentation" && active ? (
          <SchemaForm
            fields={presentationFieldsForSection(sectionKey)}
            values={presentation as unknown as Record<string, unknown>}
            onChange={(next) =>
              onPresentationChange(
                normalizeSectionPresentation({
                  ...DEFAULT_SECTION_PRESENTATION,
                  ...next,
                }),
              )
            }
          />
        ) : null}

        {tab === "theme" ? (
          <SchemaForm
            fields={THEME_FIELD_SCHEMA}
            values={theme as unknown as Record<string, unknown>}
            onChange={(next) =>
              onThemeChange(normalizeThemePresentation(next))
            }
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card p-2">
        <p className="mb-2 px-1 text-xs tracking-wide text-muted-foreground uppercase">
          Preview live
        </p>
        <div className="max-h-[78vh] overflow-y-auto">{preview}</div>
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <span
      className="inline-flex h-3.5 w-2.5 flex-col justify-between py-px"
      aria-hidden
    >
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}

function StaticSectionRow({
  label,
  active,
  enabled,
  onSelect,
  onToggle,
}: {
  label: string;
  active: boolean;
  enabled: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md border px-2 py-1.5 ${
        active ? "border-foreground/40 bg-background" : "border-transparent"
      }`}
    >
      <span className="px-1 text-muted-foreground">
        <GripIcon />
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        aria-label={`Activează ${label}`}
      />
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 truncate text-left text-sm ${
          active ? "text-foreground" : "text-muted-foreground"
        } ${!enabled ? "opacity-50" : ""}`}
      >
        {label}
      </button>
    </div>
  );
}

function SortableSectionRow({
  id,
  label,
  active,
  enabled,
  onSelect,
  onToggle,
}: {
  id: string;
  label: string;
  active: boolean;
  enabled: boolean;
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
      className={`flex items-center gap-1 rounded-md border px-2 py-1.5 ${
        active ? "border-foreground/40 bg-background" : "border-transparent"
      }`}
    >
      <button
        type="button"
        className="cursor-grab px-1 text-muted-foreground"
        aria-label="Mută"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        aria-label={`Activează ${label}`}
      />
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 truncate text-left text-sm ${
          active ? "text-foreground" : "text-muted-foreground"
        } ${!enabled ? "opacity-50" : ""}`}
      >
        {label}
      </button>
    </div>
  );
}
