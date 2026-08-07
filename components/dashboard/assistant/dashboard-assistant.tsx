"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { HelpCircle, MessageCircle, ThumbsDown, ThumbsUp, X } from "lucide-react";

import {
  askAssistantAction,
  submitAssistantFeedbackAction,
} from "@/lib/actions/assistant";
import { ASSISTANT_RATE_LIMIT } from "@/lib/assistant/rate-limit";
import type { AssistantAskResult } from "@/lib/assistant/types";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  links?: { href: string; label: string }[];
  meta?: Pick<
    AssistantAskResult,
    "category" | "matchedKey" | "answered" | "source"
  >;
  feedback?: "up" | "down" | null;
};

const QUICK_KEYS = [
  "guests",
  "budget",
  "seating",
  "vendors",
  "partner",
  "overview",
] as const;

function isOnboardingPath(pathname: string) {
  return pathname.startsWith("/dashboard/onboarding");
}

export function DashboardAssistant() {
  const { dict } = useI18n();
  const a = dict.assistant;
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedbackComment, setFeedbackComment] = useState<{
    messageId: string;
    value: string;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAskAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open, pending]);

  const ask = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message || pending) return;

      const now = Date.now();
      if (now - lastAskAt.current < ASSISTANT_RATE_LIMIT.debounceMs) return;
      lastAskAt.current = now;

      const userMsg: ChatMessage = {
        id: `u-${now}`,
        role: "user",
        text: message,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setError(null);

      startTransition(async () => {
        const res = await askAssistantAction({ message, pathname });
        if (!res.ok) {
          const err =
            res.error === "rate_limited"
              ? a.errorRateLimit
              : res.error === "unauthenticated"
                ? a.errorAuth
                : a.errorGeneric;
          setError(err);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: res.result.answer,
            links: res.result.links,
            meta: {
              category: res.result.category,
              matchedKey: res.result.matchedKey,
              answered: res.result.answered,
              source: res.result.source,
            },
            feedback: null,
          },
        ]);
      });
    },
    [a, pathname, pending],
  );

  function onFeedback(messageId: string, helpful: boolean) {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== "assistant") return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: helpful ? "up" : "down" } : m,
      ),
    );

    if (!helpful) {
      setFeedbackComment({ messageId, value: "" });
      return;
    }

    void submitAssistantFeedbackAction({
      helpful: true,
      category: msg.meta?.category,
      pathname,
      matchedKey: msg.meta?.matchedKey,
    });
  }

  function submitNegativeFeedback() {
    if (!feedbackComment) return;
    const msg = messages.find((m) => m.id === feedbackComment.messageId);
    void submitAssistantFeedbackAction({
      helpful: false,
      category: msg?.meta?.category,
      pathname,
      matchedKey: msg?.meta?.matchedKey,
      comment: feedbackComment.value,
    });
    setFeedbackComment(null);
  }

  // Available to every authenticated dashboard user (not admin-only).
  // On onboarding, park the FAB on the left so it never covers "Finalizează".
  const dockLeft = isOnboardingPath(pathname);

  return (
    <>
      <button
        type="button"
        aria-label={a.fabLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg transition",
          "bottom-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6",
          dockLeft ? "left-4 sm:left-6" : "right-4 sm:right-6",
          open && "pointer-events-none opacity-0",
        )}
      >
        <MessageCircle className="size-4 text-champagne" aria-hidden />
        <span className="hidden sm:inline">{a.fabLabel}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={a.title}
          className={cn(
            "fixed z-40 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl",
            "bottom-4 max-h-[min(85svh,36rem)] sm:bottom-6",
            dockLeft ? "left-4 sm:left-6" : "right-4 sm:right-6",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 shrink-0 text-champagne" aria-hidden />
                <h2 className="font-heading text-lg leading-tight">{a.title}</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.subtitle}</p>
            </div>
            <button
              type="button"
              aria-label={a.close}
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{a.emptyHint}</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => ask(a.quick[key])}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition hover:border-champagne/40 hover:bg-muted"
                    >
                      {a.quick[key]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-6 bg-champagne/15 text-foreground"
                    : "mr-2 border border-border bg-background",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.links?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex rounded-md border border-champagne/30 bg-champagne/10 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-champagne/20"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {msg.role === "assistant" ? (
                  <div className="mt-3 border-t border-border/70 pt-2">
                    {msg.feedback == null ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{a.helpful}</span>
                        <button
                          type="button"
                          aria-label={a.yes}
                          className="rounded p-1 hover:bg-muted hover:text-foreground"
                          onClick={() => onFeedback(msg.id, true)}
                        >
                          <ThumbsUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={a.no}
                          className="rounded p-1 hover:bg-muted hover:text-foreground"
                          onClick={() => onFeedback(msg.id, false)}
                        >
                          <ThumbsDown className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-soft">{a.feedbackThanks}</p>
                    )}

                    {feedbackComment?.messageId === msg.id ? (
                      <div className="mt-2 space-y-2">
                        <label className="block text-xs text-muted-foreground">
                          {a.feedbackPrompt}
                          <textarea
                            value={feedbackComment.value}
                            onChange={(e) =>
                              setFeedbackComment({
                                messageId: msg.id,
                                value: e.target.value.slice(0, 280),
                              })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={submitNegativeFeedback}
                          >
                            {a.feedbackSend}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setFeedbackComment(null)}
                          >
                            {a.feedbackSkip}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}

            {pending ? (
              <p className="text-xs text-muted-foreground">{a.thinking}</p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-border bg-background/80 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={a.placeholder}
                maxLength={ASSISTANT_RATE_LIMIT.maxInputChars}
                disabled={pending}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" disabled={pending || !input.trim()}>
                {a.send}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
