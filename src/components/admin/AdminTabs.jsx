import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { to: "/admin", label: "Team" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/activity", label: "Activity" },
];

export default function AdminTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-brand-line no-scrollbar">
      {TABS.map((tab) => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] transition ${
              active ? "border-brand-purple text-brand-black" : "border-transparent text-black/40 hover:text-brand-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}