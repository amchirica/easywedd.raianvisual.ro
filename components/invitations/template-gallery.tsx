"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvitationProjectAction } from "@/lib/actions/invitations";
import {
  TEMPLATE_CATEGORIES,
  type InvitationTemplate,
  type InvitationTemplateCategory,
} from "@/types/invitations";

type TemplateGalleryProps = {
  templates: InvitationTemplate[];
  allowPremium: boolean;
  canCreate: boolean;
};

export function TemplateGallery({
  templates,
  allowPremium,
  canCreate,
}: TemplateGalleryProps) {
  const { dict } = useI18n();
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(
    templates[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      return true;
    });
  }, [templates, category]);

  function categoryLabel(value: InvitationTemplateCategory | string) {
    const key = value as InvitationTemplateCategory;
    return dict.invitations.categories[key] ?? value.replaceAll("_", " ");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`text-sm ${category === "all" ? "text-foreground" : "text-muted-foreground"}`}
        >
          {dict.invitations.allCategories}
        </button>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`text-sm ${category === c.value ? "text-foreground" : "text-muted-foreground"}`}
          >
            {categoryLabel(c.value)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => {
          const locked = template.is_premium && !allowPremium;
          const active = selected === template.id;
          return (
            <button
              key={template.id}
              type="button"
              disabled={locked}
              onClick={() => setSelected(template.id)}
              className={`border p-4 text-left transition-colors ${
                active ? "border-champagne bg-secondary/50" : "border-border"
              } ${locked ? "opacity-50" : "hover:border-champagne/60"}`}
            >
              <div
                className="mb-3 h-28"
                style={{
                  background:
                    (template.template_schema?.theme?.background as string) ||
                    "#F7F4EF",
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="font-heading text-xl">{template.name}</p>
                {template.is_premium ? (
                  <span className="text-[10px] tracking-wide uppercase text-champagne">
                    {dict.invitations.premium}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {categoryLabel(template.category)}
              </p>
            </button>
          );
        })}
      </div>

      {canCreate && selected ? (
        <form action={createInvitationProjectAction} className="max-w-md space-y-3">
          <input type="hidden" name="template_id" value={selected} />
          <div className="space-y-2">
            <Label htmlFor="name">{dict.invitations.projectName}</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={dict.invitations.defaultProjectName}
            />
          </div>
          <Button type="submit">{dict.invitations.createProject}</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          {dict.invitations.projectLimitReached}
        </p>
      )}
    </div>
  );
}
