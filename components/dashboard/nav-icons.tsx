"use client";

import {
  BookUser,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Globe,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Settings,
  Shield,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { NavIconKey } from "@/components/dashboard/nav-config";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  wedding: CalendarDays,
  planner: ListChecks,
  budget: HandCoins,
  guests: Users,
  seating: LayoutDashboard,
  vendors: Store,
  timeline: CalendarClock,
  contacts: BookUser,
  invitations: Mail,
  website: Globe,
  billing: CreditCard,
  privacy: Shield,
  settings: Settings,
};

export function NavIcon({
  iconKey,
  className,
}: {
  iconKey: NavIconKey;
  className?: string;
}) {
  const Icon = NAV_ICONS[iconKey] ?? LayoutDashboard;
  return <Icon className={className} />;
}

export function LockIcon({ className }: { className?: string }) {
  return <Lock className={className} />;
}
