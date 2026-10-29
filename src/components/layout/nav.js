import {
  Bell,
  CalendarDays,
  Clock3,
  Compass,
  Images,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/schedule", label: "Schedule", icon: Clock3, mobile: true },
  { to: "/lookbook", label: "Lookbook", icon: Images, mobile: true },
  { to: "/hair-makeup", label: "Hair & Makeup", icon: Sparkles },
  { to: "/live", label: "Live Show", icon: Radio, mobile: true },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/opportunities", label: "Opportunities", icon: Compass },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin Management", icon: ShieldCheck, adminOnly: true },
];

export const isActive = (pathname, to) =>
  to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);