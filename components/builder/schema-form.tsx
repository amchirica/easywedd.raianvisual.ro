"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPathValue,
  setPathValue,
  type FieldDef,
} from "@/lib/builder/field-schema";

type SchemaFormProps = {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

export function SchemaForm({ fields, values, onChange }: SchemaFormProps) {
  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      {groups.map(([group, groupFields]) => (
        <div key={group} className="space-y-3">
          {group !== "_" ? (
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {group}
            </p>
          ) : null}
          <div className="space-y-3">
            {groupFields.map((field) => (
              <FieldControl
                key={field.path}
                field={field}
                value={getPathValue(values, field.path)}
                onChange={(value) =>
                  onChange(setPathValue(values, field.path, value))
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupFields(fields: FieldDef[]): [string, FieldDef[]][] {
  const map = new Map<string, FieldDef[]>();
  for (const field of fields) {
    const key = field.group ?? "_";
    const list = map.get(key) ?? [];
    list.push(field);
    map.set(key, list);
  }
  return Array.from(map.entries());
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <select
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "color") {
    const color =
      typeof value === "string" && value.trim() ? value : "#000000";
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            className="h-9 w-14 p-1"
            value={color}
            onChange={(e) => onChange(e.target.value)}
          />
          <Input
            type="text"
            value={typeof value === "string" ? value : ""}
            placeholder="#000000 sau gol"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label>{field.label}</Label>
      <Input
        type={
          field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : field.type === "time"
                ? "time"
                : field.type === "url"
                  ? "url"
                  : "text"
        }
        value={
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : ""
        }
        placeholder={field.placeholder}
        onChange={(e) =>
          onChange(
            field.type === "number"
              ? Number(e.target.value || 0)
              : e.target.value,
          )
        }
      />
    </div>
  );
}
