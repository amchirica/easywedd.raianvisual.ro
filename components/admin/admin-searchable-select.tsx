"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  disabled?: boolean;
};

type Props = {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  emptyText?: string;
  loading?: boolean;
};

export function AdminSearchableSelect({
  id: idProp,
  name,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  required,
  emptyText,
  loading,
}: Props) {
  const { dict } = useI18n();
  const resolvedPlaceholder = placeholder ?? dict.admin.searchPlaceholder;
  const resolvedEmpty = emptyText ?? dict.admin.noResults;
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.description ?? ""} ${o.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm",
          disabled && "opacity-50",
        )}
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? selected.label : resolvedPlaceholder}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>
      {selected?.description ? (
        <p className="text-xs text-muted-foreground">{selected.description}</p>
      ) : null}

      {open ? (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={resolvedPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {dict.dialog.loading}
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {resolvedEmpty}
              </li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted",
                      opt.value === value && "bg-muted",
                      opt.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.description ? (
                      <span className="text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
