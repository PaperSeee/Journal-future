"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/journal", label: "Journal", icon: JournalIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/plan", label: "Plan", icon: PlanIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-bg-soft/60 px-4 py-6 backdrop-blur md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <Logo className="h-9 w-9" />
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight">
            HqGambler
          </div>
          <div className="text-[11px] text-ink-dim">Trading journal</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-accent/12 text-accent"
                  : "text-ink-soft hover:bg-panel-hover hover:text-ink",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-[18px] w-[18px] transition",
                  active ? "text-accent" : "text-ink-dim group-hover:text-ink",
                ].join(" ")}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-dim transition hover:bg-panel-hover hover:text-loss"
      >
        <LogoutIcon className="h-[18px] w-[18px]" />
        Déconnexion
      </button>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-bg-soft/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
              active ? "text-accent" : "text-ink-dim",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-soft/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-7 w-7" />
        <span className="font-display text-base font-semibold tracking-tight">
          HqGambler
        </span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-ink-dim transition hover:text-loss"
        aria-label="Déconnexion"
      >
        <LogoutIcon className="h-5 w-5" />
      </button>
    </header>
  );
}

// ── Icons (inline, no dependency) ──
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function JournalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z" />
      <path d="M8 4v16M11 8h5M11 12h5" />
    </svg>
  );
}
function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 3 4-6" />
    </svg>
  );
}
function PlanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l2 2 4-4" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
