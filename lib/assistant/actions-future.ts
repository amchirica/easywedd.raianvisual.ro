/**
 * Future controlled actions (NOT enabled in v1).
 * Keep architecture ready without executing mutations.
 */

export type AssistantControlledActionId =
  | "navigate"
  | "open_billing"
  | "explain_feature";

export type AssistantControlledAction = {
  id: AssistantControlledActionId;
  enabled: boolean;
  description: string;
};

export const ASSISTANT_CONTROLLED_ACTIONS: AssistantControlledAction[] = [
  {
    id: "navigate",
    enabled: true,
    description: "Suggest allowlisted in-app links only",
  },
  {
    id: "open_billing",
    enabled: true,
    description: "Link to billing when a feature is locked",
  },
  {
    id: "explain_feature",
    enabled: true,
    description: "Explain features from trusted knowledge",
  },
];

/** Explicitly disabled mutation actions for v1 */
export const ASSISTANT_DISABLED_MUTATIONS = [
  "create_guest",
  "delete_data",
  "update_budget",
  "send_invitation",
  "change_settings",
] as const;
