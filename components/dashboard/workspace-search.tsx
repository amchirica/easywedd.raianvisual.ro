"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchWorkspaceAction } from "@/lib/actions/search";
import { translateErrorCode } from "@/lib/i18n/errors";
import {
  isSearchQueryReady,
  type SearchCategory,
  type SearchGroup,
} from "@/lib/search/types";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 280;

function subscribeNoop() {
  return () => {};
}

function useIsMac() {
  return useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform),
    () => false,
  );
}

export function WorkspaceSearch() {
  const { dict, locale } = useI18n();
  const s = dict.search;
  const router = useRouter();
  const isMac = useIsMac();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const resetSearch = useCallback(() => {
    setQuery("");
    setGroups([]);
    setError(null);
    setHasSearched(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) resetSearch();
    },
    [resetSearch],
  );

  const runSearch = useCallback(
    (value: string) => {
      if (!isSearchQueryReady(value)) {
        setGroups([]);
        setError(null);
        setHasSearched(false);
        return;
      }
      const id = ++requestId.current;
      startTransition(async () => {
        const result = await searchWorkspaceAction(value);
        if (id !== requestId.current) return;
        setHasSearched(true);
        if (result.errorCode || result.error) {
          setError(
            translateErrorCode(result.errorCode, locale, result.error) ||
              s.error,
          );
          setGroups([]);
          return;
        }
        setError(null);
        setGroups(result.groups);
      });
    },
    [locale, s.error],
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      setOpen((prev) => {
        const next = !prev;
        if (!next) resetSearch();
        return next;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetSearch]);

  function navigate(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  const groupLabel = (category: SearchCategory) =>
    s.groups[category] ?? category;

  const showMinHint = query.trim().length > 0 && !isSearchQueryReady(query);
  const showEmpty =
    hasSearched &&
    !pending &&
    !error &&
    groups.length === 0 &&
    isSearchQueryReady(query);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden gap-2 text-muted-foreground sm:inline-flex"
        onClick={() => setOpen(true)}
        aria-label={s.open}
      >
        <SearchIcon className="size-3.5" />
        <span className="max-w-[9rem] truncate">{s.placeholder}</span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
          {isMac ? s.shortcutMac : s.shortcut}
        </kbd>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={s.open}
      >
        <SearchIcon className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton
        >
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle>{s.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {s.placeholder}
            </DialogDescription>
          </DialogHeader>
          <div className="border-b border-border px-3 py-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.placeholder}
              aria-controls={listId}
              autoComplete="off"
              autoFocus
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div
            id={listId}
            className="max-h-[min(60vh,24rem)] overflow-y-auto p-2"
            role="listbox"
          >
            {showMinHint ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {s.minChars}
              </p>
            ) : null}
            {pending ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {s.loading}
              </p>
            ) : null}
            {error ? (
              <p className="px-2 py-6 text-center text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {showEmpty ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {s.empty}
              </p>
            ) : null}
            {!pending && !error
              ? groups.map((group) => (
                  <div key={group.category} className="mb-3">
                    <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {groupLabel(group.category)}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={`${group.category}-${item.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            className={cn(
                              "flex w-full flex-col rounded-lg px-2 py-2 text-left transition hover:bg-muted",
                            )}
                            onClick={() => navigate(item.href)}
                          >
                            <span className="text-sm font-medium text-foreground">
                              {item.title}
                            </span>
                            {item.subtitle ? (
                              <span className="text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
