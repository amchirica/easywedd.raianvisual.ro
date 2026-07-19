import { organizationProgress, sumBudgetItems } from "@/lib/planner/budget-math";
import type { BudgetItem, Guest, Vendor, WeddingTask } from "@/types/planner";

export function buildDashboardAnalytics(input: {
  tasks: WeddingTask[];
  guests: Guest[];
  vendors: Vendor[];
  budgetItems: BudgetItem[];
}) {
  const { tasks, guests, vendors, budgetItems } = input;
  const now = new Date();
  const inSevenDays = new Date();
  inSevenDays.setDate(now.getDate() + 7);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      t.due_date &&
      new Date(t.due_date) < now,
  );
  const upcomingTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "done" || t.status === "cancelled") return false;
    const due = new Date(t.due_date);
    return due >= now && due <= inSevenDays;
  });

  const confirmed = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;
  const declined = guests.filter((g) => g.rsvp_status === "declined").length;
  const maybe = guests.filter((g) => g.rsvp_status === "maybe").length;

  const bride = guests.filter((g) => g.side === "bride").length;
  const groom = guests.filter((g) => g.side === "groom").length;
  const both = guests.filter((g) => g.side === "both").length;

  const contractedVendors = vendors.filter((v) => v.status === "contracted").length;
  const vendorsWithoutContract = vendors.filter(
    (v) => v.status !== "contracted" && v.status !== "rejected",
  );

  const budget = sumBudgetItems(budgetItems);
  const upcomingPayments = budgetItems
    .filter((i) => i.due_amount > 0 && i.payment_status !== "paid")
    .slice(0, 5);

  const progress = organizationProgress({
    totalTasks: tasks.length,
    doneTasks,
    totalGuests: guests.length,
    confirmedGuests: confirmed,
    totalVendors: vendors.length,
    contractedVendors,
  });

  return {
    progress,
    budget,
    overdueTasks,
    upcomingTasks,
    rsvp: { confirmed, pending, declined, maybe, total: guests.length },
    sideDistribution: { bride, groom, both, other: guests.length - bride - groom - both },
    vendorsWithoutContract,
    upcomingPayments,
  };
}
