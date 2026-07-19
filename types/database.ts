import type {
  InvitationProjectStatus,
  InvitationTemplateCategory,
} from "@/types/invitations";
import type {
  BudgetCategory,
  BudgetItem,
  Guest,
  GuestGroup,
  GuestRsvpStatus,
  Payment,
  TableShape,
  TimelineItem,
  Vendor,
  WeddingContact,
  WeddingTask,
} from "@/types/planner";

export type WorkspaceType =
  | "couple"
  | "raian_client"
  | "professional"
  | "agency"
  | "admin";

export type MemberRole =
  | "owner"
  | "partner"
  | "collaborator"
  | "wedding_planner"
  | "photographer"
  | "videographer"
  | "guest_manager"
  | "admin";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked";

export type WorkspaceInviteStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked";

export type EmailOutboxStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export type WorkspaceStatus =
  | "active"
  | "onboarding"
  | "suspended"
  | "archived";

export type WeddingStatus =
  | "planning"
  | "confirmed"
  | "completed"
  | "cancelled";

export type SubscriptionPlan =
  | "trial"
  | "starter"
  | "essentials"
  | "premium"
  | "agency";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type BillingInterval =
  | "month"
  | "year"
  | "one_time_12m"
  | "one_time_18m"
  | "lifetime"
  | "grant";

export type ConsentType =
  | "terms"
  | "privacy"
  | "marketing"
  | "analytics"
  | "anonymized_industry_research";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          workspace_type: WorkspaceType;
          owner_id: string;
          status: WorkspaceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          workspace_type?: WorkspaceType;
          owner_id: string;
          status?: WorkspaceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          workspace_type?: WorkspaceType;
          owner_id?: string;
          status?: WorkspaceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          role: MemberRole;
          invited_by: string | null;
          invitation_status: InvitationStatus;
          invite_email: string | null;
          invite_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          role?: MemberRole;
          invited_by?: string | null;
          invitation_status?: InvitationStatus;
          invite_email?: string | null;
          invite_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          role?: MemberRole;
          invited_by?: string | null;
          invitation_status?: InvitationStatus;
          invite_email?: string | null;
          invite_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: MemberRole;
          token_hash: string;
          status: WorkspaceInviteStatus;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          accepted_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: MemberRole;
          token_hash: string;
          status?: WorkspaceInviteStatus;
          invited_by?: string | null;
          expires_at: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: MemberRole;
          token_hash?: string;
          status?: WorkspaceInviteStatus;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_outbox: {
        Row: {
          id: string;
          workspace_id: string | null;
          event_type: string;
          recipient: string;
          payload: Json;
          status: EmailOutboxStatus;
          attempt_count: number;
          last_error: string | null;
          scheduled_at: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          event_type: string;
          recipient: string;
          payload?: Json;
          status?: EmailOutboxStatus;
          attempt_count?: number;
          last_error?: string | null;
          scheduled_at?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          event_type?: string;
          recipient?: string;
          payload?: Json;
          status?: EmailOutboxStatus;
          attempt_count?: number;
          last_error?: string | null;
          scheduled_at?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weddings: {
        Row: {
          id: string;
          workspace_id: string;
          couple_name_1: string | null;
          couple_name_2: string | null;
          wedding_date: string | null;
          civil_ceremony_date: string | null;
          religious_ceremony_date: string | null;
          city: string | null;
          venue_name: string | null;
          estimated_guest_count: number | null;
          currency: string;
          wedding_status: WeddingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          couple_name_1?: string | null;
          couple_name_2?: string | null;
          wedding_date?: string | null;
          civil_ceremony_date?: string | null;
          religious_ceremony_date?: string | null;
          city?: string | null;
          venue_name?: string | null;
          estimated_guest_count?: number | null;
          currency?: string;
          wedding_status?: WeddingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          couple_name_1?: string | null;
          couple_name_2?: string | null;
          wedding_date?: string | null;
          civil_ceremony_date?: string | null;
          religious_ceremony_date?: string | null;
          city?: string | null;
          venue_name?: string | null;
          estimated_guest_count?: number | null;
          currency?: string;
          wedding_status?: WeddingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
          product_key: string | null;
          billing_interval: BillingInterval | null;
          access_ends_at: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          product_key?: string | null;
          billing_interval?: BillingInterval | null;
          access_ends_at?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          product_key?: string | null;
          billing_interval?: BillingInterval | null;
          access_ends_at?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_entitlements: {
        Row: {
          id: string;
          workspace_id: string;
          feature_key: string;
          enabled: boolean;
          usage_limit: number | null;
          usage_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          feature_key: string;
          enabled?: boolean;
          usage_limit?: number | null;
          usage_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          feature_key?: string;
          enabled?: boolean;
          usage_limit?: number | null;
          usage_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_consents: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          consent_type: ConsentType;
          consent_version: string;
          granted: boolean;
          granted_at: string | null;
          revoked_at: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          consent_type: ConsentType;
          consent_version: string;
          granted?: boolean;
          granted_at?: string | null;
          revoked_at?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string | null;
          consent_type?: ConsentType;
          consent_version?: string;
          granted?: boolean;
          granted_at?: string | null;
          revoked_at?: string | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_consent_history: {
        Row: {
          id: string;
          original_id: string | null;
          user_id: string;
          workspace_id: string | null;
          consent_type: ConsentType;
          consent_version: string;
          granted: boolean;
          granted_at: string | null;
          revoked_at: string | null;
          source: string | null;
          created_at: string;
          archived_at: string;
          archive_reason: string;
        };
        Insert: {
          id?: string;
          original_id?: string | null;
          user_id: string;
          workspace_id?: string | null;
          consent_type: ConsentType;
          consent_version: string;
          granted: boolean;
          granted_at?: string | null;
          revoked_at?: string | null;
          source?: string | null;
          created_at?: string;
          archived_at?: string;
          archive_reason?: string;
        };
        Update: Partial<{
          archive_reason: string;
        }>;
        Relationships: [];
      };
      wedding_tasks: {
        Row: WeddingTask;
        Insert: Partial<WeddingTask> &
          Pick<WeddingTask, "workspace_id" | "wedding_id" | "title">;
        Update: Partial<WeddingTask>;
        Relationships: [];
      };
      wedding_task_checklist_items: {
        Row: {
          id: string;
          task_id: string;
          workspace_id: string;
          title: string;
          is_done: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          workspace_id: string;
          title: string;
          is_done?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          is_done?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      budget_categories: {
        Row: BudgetCategory;
        Insert: Partial<BudgetCategory> &
          Pick<BudgetCategory, "workspace_id" | "wedding_id" | "name">;
        Update: Partial<BudgetCategory>;
        Relationships: [];
      };
      budget_items: {
        Row: BudgetItem;
        Insert: Partial<BudgetItem> &
          Pick<BudgetItem, "workspace_id" | "wedding_id" | "name">;
        Update: Partial<BudgetItem>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> &
          Pick<Payment, "workspace_id" | "budget_item_id" | "amount">;
        Update: Partial<Payment>;
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          workspace_id: string;
          base_currency: string;
          quote_currency: string;
          rate: number;
          effective_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          base_currency: string;
          quote_currency: string;
          rate: number;
          effective_on?: string;
          created_at?: string;
        };
        Update: {
          rate?: number;
          effective_on?: string;
        };
        Relationships: [];
      };
      guest_groups: {
        Row: GuestGroup;
        Insert: Partial<GuestGroup> &
          Pick<GuestGroup, "workspace_id" | "wedding_id" | "name">;
        Update: Partial<GuestGroup>;
        Relationships: [];
      };
      guests: {
        Row: Guest;
        Insert: Partial<Guest> &
          Pick<Guest, "workspace_id" | "wedding_id" | "first_name">;
        Update: Partial<Guest>;
        Relationships: [];
      };
      guest_companions: {
        Row: {
          id: string;
          workspace_id: string;
          guest_id: string;
          first_name: string;
          last_name: string;
          meal_preference: string | null;
          allergies: string | null;
          is_child: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          guest_id: string;
          first_name: string;
          last_name?: string;
          meal_preference?: string | null;
          allergies?: string | null;
          is_child?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          meal_preference?: string | null;
          allergies?: string | null;
          is_child?: boolean;
        };
        Relationships: [];
      };
      guest_events: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          event_key: string;
          attending: boolean | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          event_key: string;
          attending?: boolean | null;
        };
        Update: { attending?: boolean | null };
        Relationships: [];
      };
      rsvp_responses: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          rsvp_status: GuestRsvpStatus;
          attendance_count: number;
          children_count: number;
          meal_preference: string | null;
          allergies: string | null;
          message: string | null;
          submitted_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          rsvp_status: GuestRsvpStatus;
          attendance_count?: number;
          children_count?: number;
          meal_preference?: string | null;
          allergies?: string | null;
          message?: string | null;
        };
        Update: Partial<{
          rsvp_status: GuestRsvpStatus;
          attendance_count: number;
        }>;
        Relationships: [];
      };
      rsvp_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          guest_id: string;
          token_hash: string;
          expires_at: string;
        };
        Update: {
          used_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      venue_layouts: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          name: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          name?: string;
          notes?: string | null;
        };
        Update: { name?: string; notes?: string | null };
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          layout_id: string | null;
          label: string;
          shape: TableShape;
          capacity: number;
          sort_order: number;
          pos_x: number;
          pos_y: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          layout_id?: string | null;
          label: string;
          shape?: TableShape;
          capacity?: number;
          sort_order?: number;
          pos_x?: number;
          pos_y?: number;
        };
        Update: Partial<{
          label: string;
          shape: TableShape;
          capacity: number;
          sort_order: number;
          layout_id: string | null;
          pos_x: number;
          pos_y: number;
          updated_at: string;
        }>;
        Relationships: [];
      };
      table_assignments: {
        Row: {
          id: string;
          workspace_id: string;
          table_id: string;
          guest_id: string;
          seat_label: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          table_id: string;
          guest_id: string;
          seat_label?: string | null;
        };
        Update: { table_id?: string; seat_label?: string | null };
        Relationships: [];
      };
      vendor_categories: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          name: string;
        };
        Update: { name?: string };
        Relationships: [];
      };
      vendors: {
        Row: Vendor;
        Insert: Partial<Vendor> &
          Pick<Vendor, "workspace_id" | "wedding_id" | "company_name">;
        Update: Partial<Vendor>;
        Relationships: [];
      };
      vendor_contacts: {
        Row: {
          id: string;
          workspace_id: string;
          vendor_id: string;
          name: string;
          role: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          vendor_id: string;
          name: string;
          role?: string | null;
          phone?: string | null;
          email?: string | null;
        };
        Update: Partial<{
          name: string;
          role: string | null;
          phone: string | null;
          email: string | null;
        }>;
        Relationships: [];
      };
      vendor_documents: {
        Row: {
          id: string;
          workspace_id: string;
          vendor_id: string;
          title: string;
          document_url: string;
          document_type: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          vendor_id: string;
          title: string;
          document_url: string;
          document_type?: string | null;
        };
        Update: Partial<{ title: string; document_url: string }>;
        Relationships: [];
      };
      vendor_reviews_private: {
        Row: {
          id: string;
          workspace_id: string;
          vendor_id: string;
          rating: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          vendor_id: string;
          rating?: number | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{ rating: number | null; notes: string | null }>;
        Relationships: [];
      };
      wedding_timeline_items: {
        Row: TimelineItem;
        Insert: Partial<TimelineItem> &
          Pick<TimelineItem, "workspace_id" | "wedding_id" | "title">;
        Update: Partial<TimelineItem>;
        Relationships: [];
      };
      wedding_contacts: {
        Row: WeddingContact;
        Insert: Partial<WeddingContact> &
          Pick<
            WeddingContact,
            "workspace_id" | "wedding_id" | "name" | "contact_type"
          >;
        Update: Partial<WeddingContact>;
        Relationships: [];
      };
      invitation_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: InvitationTemplateCategory;
          thumbnail_url: string | null;
          template_schema: Json;
          is_premium: boolean;
          is_active: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          category?: InvitationTemplateCategory;
          thumbnail_url?: string | null;
          template_schema?: Json;
          is_premium?: boolean;
          is_active?: boolean;
          usage_count?: number;
        };
        Update: Partial<{
          name: string;
          slug: string;
          category: InvitationTemplateCategory;
          thumbnail_url: string | null;
          template_schema: Json;
          is_premium: boolean;
          is_active: boolean;
          usage_count: number;
        }>;
        Relationships: [];
      };
      invitation_projects: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          name: string;
          template_id: string | null;
          status: InvitationProjectStatus;
          theme_config: Json;
          content_config: Json;
          language: string;
          preview_key: string;
          rsvp_deadline: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          name: string;
          template_id?: string | null;
          status?: InvitationProjectStatus;
          theme_config?: Json;
          content_config?: Json;
          language?: string;
          preview_key?: string;
          rsvp_deadline?: string | null;
          published_at?: string | null;
        };
        Update: Partial<{
          name: string;
          template_id: string | null;
          status: InvitationProjectStatus;
          theme_config: Json;
          content_config: Json;
          language: string;
          preview_key: string;
          rsvp_deadline: string | null;
          published_at: string | null;
        }>;
        Relationships: [];
      };
      invitation_versions: {
        Row: {
          id: string;
          invitation_project_id: string;
          workspace_id: string;
          version_number: number;
          content_snapshot: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          invitation_project_id: string;
          workspace_id: string;
          version_number: number;
          content_snapshot: Json;
          created_by?: string | null;
        };
        Update: Partial<{ content_snapshot: Json; version_number: number }>;
        Relationships: [];
      };
      invitation_recipients: {
        Row: {
          id: string;
          invitation_project_id: string;
          workspace_id: string;
          guest_id: string;
          access_token_hash: string;
          opened_at: string | null;
          last_opened_at: string | null;
          rsvp_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          invitation_project_id: string;
          workspace_id: string;
          guest_id: string;
          access_token_hash: string;
          opened_at?: string | null;
          last_opened_at?: string | null;
          rsvp_completed_at?: string | null;
        };
        Update: Partial<{
          opened_at: string | null;
          last_opened_at: string | null;
          rsvp_completed_at: string | null;
          access_token_hash: string;
        }>;
        Relationships: [];
      };
      invitation_deliveries: {
        Row: {
          id: string;
          recipient_id: string;
          workspace_id: string;
          channel: "email" | "link" | "whatsapp_manual" | "qr";
          destination: string | null;
          delivery_status: "pending" | "sent" | "failed" | "skipped";
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          recipient_id: string;
          workspace_id: string;
          channel: "email" | "link" | "whatsapp_manual" | "qr";
          destination?: string | null;
          delivery_status?: "pending" | "sent" | "failed" | "skipped";
          sent_at?: string | null;
          error_message?: string | null;
        };
        Update: Partial<{
          delivery_status: "pending" | "sent" | "failed" | "skipped";
          sent_at: string | null;
          error_message: string | null;
          destination: string | null;
        }>;
        Relationships: [];
      };
      invitation_events: {
        Row: {
          id: string;
          workspace_id: string;
          invitation_project_id: string;
          recipient_id: string | null;
          event_type: "open" | "rsvp" | "export" | "email_sent" | "publish";
          device_class: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          invitation_project_id: string;
          recipient_id?: string | null;
          event_type: "open" | "rsvp" | "export" | "email_sent" | "publish";
          device_class?: string | null;
          metadata?: Json;
        };
        Update: Partial<{ metadata: Json; device_class: string | null }>;
        Relationships: [];
      };
      invitation_rsvp_rate_limits: {
        Row: {
          id: string;
          token_hash: string;
          ip_hash: string;
          window_start: string;
          attempt_count: number;
        };
        Insert: {
          token_hash: string;
          ip_hash: string;
          window_start?: string;
          attempt_count?: number;
        };
        Update: Partial<{ attempt_count: number }>;
        Relationships: [];
      };
      wedding_site_templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          template_schema: Json;
          is_premium: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          template_schema?: Json;
          is_premium?: boolean;
          is_active?: boolean;
        };
        Update: Partial<{
          name: string;
          slug: string;
          template_schema: Json;
          is_premium: boolean;
          is_active: boolean;
        }>;
        Relationships: [];
      };
      wedding_sites: {
        Row: {
          id: string;
          workspace_id: string;
          wedding_id: string;
          slug: string;
          custom_domain: string | null;
          domain_status: "none" | "pending" | "verified" | "failed";
          template_id: string | null;
          status: "draft" | "published" | "unpublished" | "archived";
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          social_image_url: string | null;
          password_protected: boolean;
          access_password_hash: string | null;
          analytics_enabled: boolean;
          theme_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          wedding_id: string;
          slug: string;
          custom_domain?: string | null;
          domain_status?: "none" | "pending" | "verified" | "failed";
          template_id?: string | null;
          status?: "draft" | "published" | "unpublished" | "archived";
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          social_image_url?: string | null;
          password_protected?: boolean;
          access_password_hash?: string | null;
          analytics_enabled?: boolean;
          theme_config?: Json;
        };
        Update: Partial<{
          slug: string;
          custom_domain: string | null;
          domain_status: "none" | "pending" | "verified" | "failed";
          template_id: string | null;
          status: "draft" | "published" | "unpublished" | "archived";
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          social_image_url: string | null;
          password_protected: boolean;
          access_password_hash: string | null;
          analytics_enabled: boolean;
          theme_config: Json;
        }>;
        Relationships: [];
      };
      wedding_site_pages: {
        Row: {
          id: string;
          wedding_site_id: string;
          page_type: string;
          title: string;
          slug: string;
          content: Json;
          visibility: "public" | "unlisted" | "private";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wedding_site_id: string;
          page_type?: string;
          title: string;
          slug: string;
          content?: Json;
          visibility?: "public" | "unlisted" | "private";
          sort_order?: number;
        };
        Update: Partial<{
          title: string;
          slug: string;
          content: Json;
          visibility: "public" | "unlisted" | "private";
          sort_order: number;
          page_type: string;
        }>;
        Relationships: [];
      };
      wedding_site_sections: {
        Row: {
          id: string;
          wedding_site_id: string;
          page_id: string | null;
          section_type: string;
          section_config: Json;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wedding_site_id: string;
          page_id?: string | null;
          section_type: string;
          section_config?: Json;
          sort_order?: number;
          is_visible?: boolean;
        };
        Update: Partial<{
          page_id: string | null;
          section_type: string;
          section_config: Json;
          sort_order: number;
          is_visible: boolean;
        }>;
        Relationships: [];
      };
      wedding_site_media: {
        Row: {
          id: string;
          wedding_site_id: string;
          media_type: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          wedding_site_id: string;
          media_type?: string;
          storage_path: string;
          alt_text?: string | null;
          sort_order?: number;
        };
        Update: Partial<{
          media_type: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
        }>;
        Relationships: [];
      };
      wedding_site_versions: {
        Row: {
          id: string;
          wedding_site_id: string;
          workspace_id: string;
          version_number: number;
          content_snapshot: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          wedding_site_id: string;
          workspace_id: string;
          version_number: number;
          content_snapshot: Json;
          created_by?: string | null;
        };
        Update: Partial<{ content_snapshot: Json }>;
        Relationships: [];
      };
      site_visits: {
        Row: {
          id: string;
          wedding_site_id: string;
          visitor_session_id: string;
          page_path: string;
          referrer_domain: string | null;
          device_type: string | null;
          country_code: string | null;
          created_at: string;
        };
        Insert: {
          wedding_site_id: string;
          visitor_session_id: string;
          page_path?: string;
          referrer_domain?: string | null;
          device_type?: string | null;
          country_code?: string | null;
        };
        Update: Partial<{ page_path: string }>;
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
          payload: Json;
        };
        Insert: {
          id: string;
          event_type: string;
          payload?: Json;
        };
        Update: Partial<{ payload: Json }>;
        Relationships: [];
      };
      one_time_payments: {
        Row: {
          id: string;
          workspace_id: string;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          product_key: string;
          amount_ron: number | null;
          currency: string;
          status: string;
          access_starts_at: string | null;
          access_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          product_key: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          amount_ron?: number | null;
          currency?: string;
          status?: string;
          access_starts_at?: string | null;
          access_ends_at?: string | null;
        };
        Update: Partial<{ status: string; access_ends_at: string | null }>;
        Relationships: [];
      };
      client_contract_links: {
        Row: {
          id: string;
          workspace_id: string;
          external_contract_reference: string | null;
          package_name: string | null;
          access_plan: SubscriptionPlan;
          access_starts_at: string | null;
          access_ends_at: string | null;
          activation_code: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          external_contract_reference?: string | null;
          package_name?: string | null;
          access_plan?: SubscriptionPlan;
          access_starts_at?: string | null;
          access_ends_at?: string | null;
          activation_code?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{
          package_name: string | null;
          access_plan: SubscriptionPlan;
          access_starts_at: string | null;
          access_ends_at: string | null;
          activation_code: string | null;
        }>;
        Relationships: [];
      };
      product_events: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          event_name: string;
          properties: Json;
          occurred_at: string;
        };
        Insert: {
          workspace_id?: string | null;
          user_id?: string | null;
          event_name: string;
          properties?: Json;
          occurred_at?: string;
        };
        Update: Partial<{ properties: Json }>;
        Relationships: [];
      };
      industry_metrics_monthly: {
        Row: {
          id: string;
          period: string;
          region: string;
          wedding_count: number;
          average_budget: number | null;
          median_budget: number | null;
          average_guest_count: number | null;
          average_cost_per_guest: number | null;
          category_distribution: Json;
          season_distribution: Json;
          created_at: string;
        };
        Insert: {
          period: string;
          region?: string;
          wedding_count?: number;
          average_budget?: number | null;
          median_budget?: number | null;
          average_guest_count?: number | null;
          average_cost_per_guest?: number | null;
          category_distribution?: Json;
          season_distribution?: Json;
        };
        Update: Partial<{
          wedding_count: number;
          average_budget: number | null;
          median_budget: number | null;
        }>;
        Relationships: [];
      };
      gdpr_requests: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          request_type: "export" | "delete" | "anonymize" | "consent_revoke";
          status: "pending" | "processing" | "completed" | "rejected";
          notes: string | null;
          result_payload: Json | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          workspace_id?: string | null;
          request_type: "export" | "delete" | "anonymize" | "consent_revoke";
          status?: "pending" | "processing" | "completed" | "rejected";
          notes?: string | null;
          result_payload?: Json | null;
          completed_at?: string | null;
        };
        Update: Partial<{
          status: "pending" | "processing" | "completed" | "rejected";
          notes: string | null;
          result_payload: Json | null;
          completed_at: string | null;
        }>;
        Relationships: [];
      };
      email_preferences: {
        Row: {
          id: string;
          user_id: string;
          transactional_enabled: boolean;
          marketing_enabled: boolean;
          reminders_enabled: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          transactional_enabled?: boolean;
          marketing_enabled?: boolean;
          reminders_enabled?: boolean;
        };
        Update: Partial<{
          transactional_enabled: boolean;
          marketing_enabled: boolean;
          reminders_enabled: boolean;
        }>;
        Relationships: [];
      };
      admin_access_reasons: {
        Row: {
          id: string;
          admin_user_id: string;
          target_type: string;
          target_id: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          admin_user_id: string;
          target_type: string;
          target_id?: string | null;
          reason: string;
        };
        Update: Partial<{ reason: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: {
        Args: { p_workspace_id: string };
        Returns: boolean;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_pending_invite: {
        Args: { p_token: string };
        Returns: {
          id: string;
          workspace_id: string;
          role: MemberRole;
          invite_email: string | null;
          invitation_status: InvitationStatus;
        }[];
      };
      seed_default_budget_categories: {
        Args: { p_workspace_id: string; p_wedding_id: string };
        Returns: undefined;
      };
      seed_wedding_task_template: {
        Args: {
          p_workspace_id: string;
          p_wedding_id: string;
          p_wedding_date?: string | null;
        };
        Returns: undefined;
      };
      create_rsvp_token: {
        Args: { p_guest_id: string; p_expires_days?: number };
        Returns: string;
      };
      get_rsvp_by_token: {
        Args: { p_token: string };
        Returns: {
          guest_id: string;
          first_name: string;
          last_name: string;
          rsvp_status: GuestRsvpStatus;
          attendance_count: number;
          children_count: number;
          meal_preference: string | null;
          allergies: string | null;
          couple_name_1: string | null;
          couple_name_2: string | null;
          wedding_date: string | null;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
        }[];
      };
      submit_rsvp: {
        Args: {
          p_token: string;
          p_rsvp_status: GuestRsvpStatus;
          p_attendance_count: number;
          p_children_count: number;
          p_meal_preference?: string | null;
          p_allergies?: string | null;
          p_message?: string | null;
        };
        Returns: boolean;
      };
      anonymize_guest: {
        Args: { p_guest_id: string };
        Returns: boolean;
      };
      create_invitation_recipient_token: {
        Args: { p_project_id: string; p_guest_id: string };
        Returns: string;
      };
      get_invitation_by_recipient_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      record_invitation_open: {
        Args: { p_token: string; p_device_class?: string | null };
        Returns: boolean;
      };
      submit_invitation_rsvp: {
        Args: {
          p_token: string;
          p_rsvp_status: GuestRsvpStatus;
          p_attendance_count: number;
          p_children_count: number;
          p_meal_preference?: string | null;
          p_allergies?: string | null;
          p_transport_needed?: boolean;
          p_accommodation_needed?: boolean;
          p_message?: string | null;
          p_ip_hash?: string;
        };
        Returns: boolean;
      };
      get_invitation_preview: {
        Args: { p_project_id: string; p_preview_key: string };
        Returns: Json;
      };
      get_public_wedding_site: {
        Args: { p_slug: string };
        Returns: Json;
      };
      record_site_visit: {
        Args: {
          p_slug: string;
          p_visitor_session_id: string;
          p_page_path?: string;
          p_referrer_domain?: string | null;
          p_device_type?: string | null;
          p_country_code?: string | null;
        };
        Returns: boolean;
      };
      verify_wedding_site_password: {
        Args: { p_slug: string; p_password: string };
        Returns: boolean;
      };
      sync_workspace_entitlements: {
        Args: { p_workspace_id: string };
        Returns: undefined;
      };
      refresh_industry_metrics_monthly: {
        Args: { p_period?: string | null };
        Returns: number;
      };
      ensure_own_profile: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      create_onboarding_workspace: {
        Args: {
          p_workspace_name: string;
          p_slug: string;
          p_workspace_type: WorkspaceType;
          p_couple_name_1: string;
          p_couple_name_2: string;
          p_wedding_date?: string | null;
          p_city?: string | null;
          p_venue_name?: string | null;
          p_estimated_guest_count?: number | null;
          p_anonymized_industry_research?: boolean;
          p_consent_version?: string;
          p_trial_days?: number;
          p_partner_email?: string | null;
          p_site_url?: string | null;
        };
        Returns: Json;
      };
      create_partner_invitation: {
        Args: {
          p_workspace_id: string;
          p_email: string;
          p_role?: MemberRole;
          p_expires_days?: number;
          p_site_url?: string | null;
          p_inviter_name?: string | null;
          p_workspace_name?: string | null;
        };
        Returns: Json;
      };
      accept_workspace_invitation: {
        Args: { p_token: string };
        Returns: Json;
      };
      get_workspace_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          id: string;
          workspace_id: string;
          role: MemberRole;
          email: string;
          status: WorkspaceInviteStatus;
          expires_at: string;
          is_expired: boolean;
        }[];
      };
      claim_email_outbox: {
        Args: { p_workspace_id: string; p_limit?: number };
        Returns: {
          id: string;
          workspace_id: string | null;
          event_type: string;
          recipient: string;
          payload: Json;
          status: EmailOutboxStatus;
          attempt_count: number;
          last_error: string | null;
          scheduled_at: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      mark_email_outbox: {
        Args: { p_id: string; p_ok: boolean; p_error?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      workspace_type: WorkspaceType;
      member_role: MemberRole;
      invitation_status: InvitationStatus;
      workspace_invite_status: WorkspaceInviteStatus;
      email_outbox_status: EmailOutboxStatus;
      workspace_status: WorkspaceStatus;
      wedding_status: WeddingStatus;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      consent_type: ConsentType;
      invitation_project_status: InvitationProjectStatus;
      invitation_template_category: InvitationTemplateCategory;
      invitation_delivery_channel: "email" | "link" | "whatsapp_manual" | "qr";
      invitation_delivery_status: "pending" | "sent" | "failed" | "skipped";
      invitation_event_type: "open" | "rsvp" | "export" | "email_sent" | "publish";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type Wedding = Database["public"]["Tables"]["weddings"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type FeatureEntitlement =
  Database["public"]["Tables"]["feature_entitlements"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type UserConsent = Database["public"]["Tables"]["user_consents"]["Row"];
