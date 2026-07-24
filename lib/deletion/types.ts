/**
 * Shared deletion contracts — soft vs hard, impact previews, safety flags.
 */

export type DeleteMode = "soft" | "hard";

export type DeleteImpactItem = {
  label: string;
  count: number;
  severity?: "info" | "warn" | "danger";
};

export type DeleteImpact = {
  resourceLabel: string;
  resourceName: string;
  mode: DeleteMode;
  items: DeleteImpactItem[];
  blockers: string[];
  warnings: string[];
  requiresTypedConfirm: boolean;
  typedConfirmPhrase: string;
  canSoftDelete: boolean;
  canHardDelete: boolean;
  canRestore: boolean;
};

export type DeleteResult = {
  ok: boolean;
  error?: string;
  mode?: DeleteMode;
  restored?: boolean;
};

export function emptyImpact(
  partial: Partial<DeleteImpact> &
    Pick<DeleteImpact, "resourceLabel" | "resourceName">,
): DeleteImpact {
  return {
    mode: "soft",
    items: [],
    blockers: [],
    warnings: [],
    requiresTypedConfirm: false,
    typedConfirmPhrase: "STERGE",
    canSoftDelete: true,
    canHardDelete: true,
    canRestore: false,
    ...partial,
  };
}
