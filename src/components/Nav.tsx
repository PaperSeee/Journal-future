"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { NewsTicker } from "./NewsWidget";

const NAV = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/journal", label: "Journal", icon: JournalIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/plan", label: "Plan", icon: PlanIcon },
  { href: "/tilt", label: "Tilt", icon: TiltIcon },
  { href: "/news", label: "News", icon: NewsIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      // UTC+2 fixed offset.
      const d = new Date(Date.now() + 2 * 3600_000);
      setTime(d.toISOString().slice(11, 19) + " UTC+2");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/** Desktop top bar — logo left, live clock + news ticker + tabs top-right. No sliding sidebar. */
export function TopBar() {
  const pathname = usePathname();
  const clock = useClock();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-black/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <div className="leading-tight">
            <div className="font-display text-base font-semibold tracking-[0.08em]">
              MERCURE
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">
              Trading terminal
            </div>
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <NewsTicker />
          <span className="hidden shrink-0 font-mono text-xs tabular text-ink-dim xl:inline">
            {clock}
          </span>

          <nav className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-panel-soft p-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-ink-soft hover:bg-panel-hover hover:text-ink",
                  ].join(" ")}
                >
                  <Icon className={["h-3.5 w-3.5", active ? "text-accent" : "text-ink-dim"].join(" ")} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-black/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-7 w-7" />
        <span className="font-display text-base font-semibold tracking-[0.08em]">
          MERCURE
        </span>
      </Link>
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
function TiltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function NewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}
