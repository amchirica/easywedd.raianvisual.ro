import type {
  AccessSource,
  ContractStatus,
  SubscriptionStatus,
  WorkspaceType,
} from "@/types/database";

export type AdminUserOption = {
  id: string;
  fullName: string;
  email: string;
  suspended: boolean;
  softDeleted?: boolean;
  workspaceCount: number;
  createdAt: string;
  lastSignInAt: string | null;
  activePlan: string | null;
};

export type AdminWorkspaceOption = {
  id: string;
  name: string;
  workspaceType: WorkspaceType;
  ownerId: string;
  planKey: string | null;
  planLabel: string;
  status: SubscriptionStatus | null;
  accessEndsAt: string | null;
  accessSource: AccessSource | null;
  subscriptionId: string | null;
};

export type AdminContractOption = {
  id: string;
  title: string;
  workspaceId: string | null;
  workspaceName: string;
  clientEmail: string;
  status: ContractStatus;
  planKey: string | null;
  userId: string | null;
  subscriptionId: string | null;
};

export type AdminSubscriptionOption = {
  id: string;
  workspaceId: string;
  planKey: string | null;
  planLabel: string;
  status: SubscriptionStatus;
  accessEndsAt: string | null;
};
