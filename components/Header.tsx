import Link from "next/link";
import { getActor } from "@/lib/session";
import { read, now } from "@/lib/store";
import { Logo } from "./Logo";
import { LiveDot } from "./LiveProvider";
import { DemoControls, SignOutButton, NotificationBell } from "./HeaderClient";

const NAV: Record<string, { href: string; label: string }[]> = {
  customer: [
    { href: "/c", label: "Discover" },
    { href: "/c/orders", label: "My orders" },
  ],
  vendor: [
    { href: "/v", label: "Today" },
    { href: "/v/new", label: "Quick list" },
    { href: "/v/scan", label: "Scan & hand over" },
    { href: "/v/onboarding", label: "Outlet profile" },
  ],
  ngo: [
    { href: "/n", label: "Donation feed" },
    { href: "/n/onboarding", label: "Verification" },
  ],
  admin: [{ href: "/admin", label: "City impact" }],
};

export async function Header() {
  const actor = await getActor();
  const db = read();
  const offsetMin = Math.round((db.clockOffsetMs || 0) / 60000);
  const notes = actor ? db.notifications.filter((n) => n.userId === actor.id).slice(-8).reverse() : [];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-logobg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link href="/" aria-label="SAVE A PLATE home" className="shrink-0">
          <Logo width={84} priority />
        </Link>
        {actor && (
          <nav aria-label="Main" className="flex flex-wrap gap-1">
            {(NAV[actor.role] || []).map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-burgundy hover:bg-cream">
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <LiveDot />
          {actor ? (
            <>
              <NotificationBell items={notes.map((n) => ({ id: n.id, text: n.text, at: n.at, read: n.read }))} />
              <span className="hidden text-xs font-semibold text-muted sm:inline">{actor.name}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/signin" className="btn-primary !py-2">Sign in</Link>
          )}
        </div>
      </div>
      <div className="border-t border-line bg-cream/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-1.5 text-[11px] font-semibold text-burgundy sm:px-6">
          <span>DEMO MODE · fictional businesses · simulated payments</span>
          <span className="text-muted">
            Server time {new Date(now(db)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
            {offsetMin !== 0 && ` (demo clock +${offsetMin} min)`}
          </span>
          {actor && <DemoControls isAdmin={actor.role === "admin"} offsetMin={offsetMin} />}
        </div>
      </div>
    </header>
  );
}
