"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeleteImpact, DeleteMode, DeleteResult } from "@/lib/deletion/types";

type DeleteConfirmDialogProps = {
  triggerLabel?: string;
  title?: string;
  /** Precomputed impact (from server) */
  impact: DeleteImpact;
  /** Soft delete handler */
  onSoftDelete?: () => Promise<DeleteResult | void>;
  /** Hard/permanent delete handler */
  onHardDelete?: () => Promise<DeleteResult | void>;
  /** Restore soft-deleted resource */
  onRestore?: () => Promise<DeleteResult | void>;
  defaultMode?: DeleteMode;
  variant?: "outline" | "destructive" | "ghost";
  size?: "sm" | "default";
  disabled?: boolean;
};

export function DeleteConfirmDialog({
  triggerLabel,
  title,
  impact,
  onSoftDelete,
  onHardDelete,
  onRestore,
  defaultMode = "soft",
  variant = "outline",
  size = "sm",
  disabled,
}: DeleteConfirmDialogProps) {
  const { dict } = useI18n();
  const resolvedTrigger = triggerLabel ?? dict.dialog.delete;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DeleteMode>(
    impact.canSoftDelete ? defaultMode : "hard",
  );
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsTyped =
    mode === "hard" || impact.requiresTypedConfirm || impact.blockers.length > 0;
  const typedOk =
    !needsTyped ||
    typed.trim().toUpperCase() === impact.typedConfirmPhrase.toUpperCase();
  const blocked = impact.blockers.length > 0 && mode === "hard" && !typedOk;

  function run() {
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const fn = mode === "hard" ? onHardDelete : onSoftDelete;
          if (!fn) {
            setError(dict.dialog.actionUnavailable);
            return;
          }
          const result = await fn();
          if (result && !result.ok) {
            setError(result.error ?? dict.dialog.operationFailed);
            return;
          }
          setOpen(false);
          setTyped("");
        } catch {
          setError(dict.dialog.operationFailed);
        }
      })();
    });
  }

  function runRestore() {
    if (!onRestore) return;
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const result = await onRestore();
          if (result && !result.ok) {
            setError(result.error ?? dict.dialog.restoreFailed);
            return;
          }
          setOpen(false);
        } catch {
          setError(dict.dialog.restoreFailed);
        }
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {resolvedTrigger}
      </Button>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {title ??
              dict.dialog.deleteResource.replace(
                "{label}",
                impact.resourceLabel,
              )}
          </DialogTitle>
          <DialogDescription>
            {impact.resourceName}
          </DialogDescription>
        </DialogHeader>

        {impact.items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {dict.dialog.affectedResources}
            </p>
            <ul className="space-y-1 text-sm">
              {impact.items.map((item) => (
                <li
                  key={item.label}
                  className={`flex justify-between gap-4 ${
                    item.severity === "danger"
                      ? "text-destructive"
                      : item.severity === "warn"
                        ? "text-amber-700 dark:text-amber-400"
                        : ""
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="tabular-nums opacity-70">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {impact.warnings.length > 0 ? (
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
            {impact.warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        ) : null}

        {impact.blockers.length > 0 ? (
          <ul className="space-y-1 text-sm text-destructive">
            {impact.blockers.map((b) => (
              <li key={b}>⛔ {b}</li>
            ))}
          </ul>
        ) : null}

        {impact.canSoftDelete && impact.canHardDelete ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "soft" ? "default" : "outline"}
              onClick={() => setMode("soft")}
            >
              {dict.dialog.archiveRecoverable}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "hard" ? "destructive" : "outline"}
              onClick={() => setMode("hard")}
            >
              {dict.dialog.permanentDelete}
            </Button>
          </div>
        ) : null}

        {mode === "soft" ? (
          <p className="text-xs text-muted-foreground">
            {dict.dialog.archiveHint}
          </p>
        ) : (
          <p className="text-xs text-destructive">
            {dict.dialog.hardDeleteHint}
          </p>
        )}

        {needsTyped ? (
          <div className="space-y-1">
            <Label>
              {dict.dialog.typeToConfirm.replace(
                "{phrase}",
                impact.typedConfirmPhrase,
              )}
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={impact.typedConfirmPhrase}
              autoComplete="off"
            />
          </div>
        ) : null}

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          {impact.canRestore && onRestore ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={runRestore}
            >
              {dict.dialog.restore}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {dict.dialog.cancel}
          </Button>
          <Button
            type="button"
            variant={mode === "hard" ? "destructive" : "default"}
            disabled={pending || !typedOk || blocked}
            onClick={run}
          >
            {pending
              ? "…"
              : mode === "hard"
                ? dict.dialog.deletePermanently
                : dict.dialog.archive}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
