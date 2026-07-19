export type TaskCategory =
  | "venue"
  | "photo_video"
  | "outfits"
  | "rings"
  | "ceremony"
  | "invitations"
  | "guests"
  | "catering"
  | "music"
  | "decor"
  | "transport"
  | "accommodation"
  | "honeymoon"
  | "legal"
  | "other";

export type TaskStatus = "todo" | "in_progress" | "waiting" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskRecurrence = "none" | "weekly" | "monthly";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overdue";
export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type GuestSide = "bride" | "groom" | "both" | "other";
export type GuestInvitationStatus = "not_sent" | "sent" | "delivered" | "opened";
export type GuestRsvpStatus = "pending" | "confirmed" | "declined" | "maybe";

export type TableShape = "round" | "rectangle";
export type VendorStatus =
  | "offered"
  | "contacted"
  | "shortlist"
  | "contracted"
  | "rejected";

export type TimelineVisibility = "couple" | "photo_team" | "guests" | "private";

export type ContactType =
  | "parents"
  | "godparents"
  | "bridesmaids"
  | "groomsmen"
  | "restaurant"
  | "dj"
  | "photo_video"
  | "transport"
  | "accommodation"
  | "emergency"
  | "other";

export type SupportedCurrency = "RON" | "EUR";

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "venue", label: "Locație" },
  { value: "photo_video", label: "Foto-Video" },
  { value: "outfits", label: "Ținute" },
  { value: "rings", label: "Verighete" },
  { value: "ceremony", label: "Ceremonie" },
  { value: "invitations", label: "Invitații" },
  { value: "guests", label: "Invitați" },
  { value: "catering", label: "Catering" },
  { value: "music", label: "Muzică" },
  { value: "decor", label: "Decor" },
  { value: "transport", label: "Transport" },
  { value: "accommodation", label: "Cazare" },
  { value: "honeymoon", label: "Lună de miere" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Altele" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "De făcut" },
  { value: "in_progress", label: "În lucru" },
  { value: "waiting", label: "În așteptare" },
  { value: "done", label: "Finalizat" },
  { value: "cancelled", label: "Anulat" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Scăzută" },
  { value: "medium", label: "Medie" },
  { value: "high", label: "Ridicată" },
  { value: "urgent", label: "Urgentă" },
];

export type WeddingTask = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  recurrence: TaskRecurrence;
  recurrence_parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BudgetCategory = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BudgetItem = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  category_id: string | null;
  name: string;
  vendor_id: string | null;
  estimated_amount: number;
  contracted_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  workspace_id: string;
  budget_item_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  proof_document_url: string | null;
  created_at: string;
};

export type Guest = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  group_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  side: GuestSide;
  invitation_status: GuestInvitationStatus;
  rsvp_status: GuestRsvpStatus;
  attendance_count: number;
  children_count: number;
  meal_preference: string | null;
  allergies: string | null;
  accommodation_needed: boolean;
  transport_needed: boolean;
  table_id: string | null;
  notes: string | null;
  consent_to_contact: boolean;
  is_anonymized: boolean;
  created_at: string;
  updated_at: string;
};

export type GuestGroup = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VenueTable = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  layout_id: string | null;
  label: string;
  shape: TableShape;
  capacity: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  category: string;
  category_id: string | null;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  social_url: string | null;
  quoted_price: number | null;
  contracted_price: number | null;
  status: VendorStatus;
  contract_url: string | null;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TimelineItem = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  title: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  responsible_person: string | null;
  contact_phone: string | null;
  vendor_id: string | null;
  notes: string | null;
  visibility: TimelineVisibility;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WeddingContact = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  contact_type: ContactType;
  name: string;
  role_label: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
