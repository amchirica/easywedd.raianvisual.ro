import type { TaskCategory, TaskPriority } from "@/types/planner";

export type TaskTemplateItem = {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  daysBeforeWedding: number;
};

/** Client-side mirror of SQL seed_wedding_task_template for docs/tests */
export const DEFAULT_TASK_TEMPLATE: TaskTemplateItem[] = [
  { title: "Rezervare locație", category: "venue", priority: "urgent", daysBeforeWedding: 150 },
  { title: "Contract foto-video", category: "photo_video", priority: "high", daysBeforeWedding: 120 },
  { title: "Alegere ținute", category: "outfits", priority: "high", daysBeforeWedding: 90 },
  { title: "Comandă verighete", category: "rings", priority: "medium", daysBeforeWedding: 60 },
  { title: "Program ceremonie", category: "ceremony", priority: "high", daysBeforeWedding: 45 },
  { title: "Trimite invitații", category: "invitations", priority: "high", daysBeforeWedding: 60 },
  { title: "Finalizează lista invitați", category: "guests", priority: "high", daysBeforeWedding: 75 },
  { title: "Confirmă meniu catering", category: "catering", priority: "high", daysBeforeWedding: 40 },
  { title: "Contract muzică / DJ", category: "music", priority: "medium", daysBeforeWedding: 50 },
  { title: "Plan decor", category: "decor", priority: "medium", daysBeforeWedding: 30 },
  { title: "Organizează transport", category: "transport", priority: "medium", daysBeforeWedding: 20 },
  { title: "Cazare invitați", category: "accommodation", priority: "low", daysBeforeWedding: 35 },
  { title: "Rezervare lună de miere", category: "honeymoon", priority: "low", daysBeforeWedding: 40 },
  { title: "Documente legale", category: "legal", priority: "urgent", daysBeforeWedding: 100 },
];

export function dueDateFromWedding(weddingDate: Date, daysBefore: number) {
  const d = new Date(weddingDate);
  d.setDate(d.getDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}
