import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import Wordmark from "@/components/brand/Wordmark";
import EventSwitcher from "@/components/layout/EventSwitcher";
import { NAV, isActive } from "@/components/layout/nav";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/AuthContext";

const roleLabel = { admin: "Admin / Manager", designer: "Designer", model: "Model" };

export function AppShell({ children }) {
  const { user, role, isAdmin, unreadCount, activeEvent } = useWorkspace();
  const { logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  const items = NAV.filter((item) => !item.adminOnly || isAdmin);
  const mobilePrimary = items.filter((item) => item.mobile).slice(0, 4);
  const mobileRest = items.filter((item) => !mobilePrimary.includes(item));

  const initials = (user?.full_name || user?.email || "FS")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-brand-black lg:flex">
        <div className="px-7 pb-6 pt-8">
          <Link to="/" aria-label="Fly Showcase home">
            <Wordmark tone="light" />
          </Link>
        </div>
        <div className="px-5">
          <p className="label-eyebrow mb-2 text-white/30">Active event</p>
          <EventSwitcher />
        </div>
        <nav className="mt-7 flex-1 space-y-0.5 overflow-y-auto px-3 no-scrollbar">
          {items.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 border-l-2 px-4 py-2.5 text-[13px] transition ${
                  active
                    ? "border-brand-gold bg-white/[0.06] text-white"
                    : "border-transparent text-white/55 hover:border-white/20 hover:text-white/90"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-brand-gold" : "text-white/35 group-hover:text-white/70"}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.to === "/notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-brand-gold px-1.5 py-0.5 text-[10px] font-bold text-brand-black">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-[12px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-white/85">{user?.full_name || user?.email}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-brand-gold/70">{roleLabel[role]}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 flex w-full items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40 transition hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-brand-black px-4 py-3 lg:hidden">
        <Link to="/" aria-label="Fly Showcase home">
          <Wordmark tone="light" />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            className="relative flex h-10 w-10 items-center justify-center text-white/70"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-gold" />
            )}
          </Link>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center" aria-label="Profile">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-[11px] font-bold text-white">
              {initials}
            </span>
          </Link>
        </div>
      </header>

      <div className="lg:pl-[264px]">
        {activeEvent && (
          <div className="border-b border-brand-line bg-white/70 px-4 py-2 lg:hidden">
            <EventSwitcher tone="light" />
          </div>
        )}
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-brand-black safe-bottom lg:hidden">
        {mobilePrimary.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] uppercase tracking-[0.12em] ${
                active ? "text-brand-gold" : "text-white/45"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] uppercase tracking-[0.12em] text-white/45">
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-none border-t-2 border-brand-gold bg-brand-black text-white">
            <SheetHeader className="text-left">
              <SheetTitle className="font-heading text-2xl text-white">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-2 grid grid-cols-2 gap-1 pb-4">
              {mobileRest.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 border border-white/10 px-3 py-3 text-[12px] text-white/75"
                >
                  <item.icon className="h-4 w-4 text-brand-gold" />
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => logout()}
              className="mb-6 flex w-full items-center justify-center gap-2 border border-white/15 py-3 text-[11px] uppercase tracking-[0.2em] text-white/60"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}