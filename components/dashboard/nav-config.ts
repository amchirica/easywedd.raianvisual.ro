import {
  BookUser,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Globe,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Mail,
  Settings,
  Shield,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Prezentare", icon: LayoutDashboard },
  { href: "/dashboard/wedding", label: "Nunta", icon: CalendarDays },
  { href: "/dashboard/planner", label: "Planner", icon: ListChecks },
  { href: "/dashboard/budget", label: "Buget", icon: HandCoins },
  { href: "/dashboard/guests", label: "Invitați", icon: Users },
  { href: "/dashboard/seating", label: "Seating", icon: LayoutDashboard },
  { href: "/dashboard/vendors", label: "Furnizori", icon: Store },
  { href: "/dashboard/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/dashboard/contacts", label: "Contacte", icon: BookUser },
  { href: "/dashboard/invitations", label: "Invitații", icon: Mail },
  { href: "/dashboard/website", label: "Website", icon: Globe },
  { href: "/dashboard/billing", label: "Abonament", icon: CreditCard },
  { href: "/dashboard/privacy", label: "Privacy", icon: Shield },
  { href: "/dashboard/settings", label: "Setări", icon: Settings },
];
