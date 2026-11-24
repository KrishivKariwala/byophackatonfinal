import Link from "next/link";
import { getActor } from "@/lib/session";
import { read, now } from "@/lib/store";
import { Logo } from "./Logo";
import { LiveDot } from "./LiveProvider";
import { DemoControls, SignOutButton, NotificationBell } from "./HeaderClient";
import { LanguageSwitcher } from "./I18n";
import { getT } from "@/lib/i18n/server";
import { isFlagOn } from "@/lib/p2/platform";
import { can, resolveOrg } from "@/lib/p2/org";

const NAV: Record<string, { href: string; label: string }[]> = {
  customer: [
    { href: "/c", label: "nav.discover" },
    { href: "/c/orders", label: "nav.myOrders" },
    { href: "/c/following", label: "nav.following" },
    { href: "/c/impact", label: "nav.myImpact" },
    { href: "/c/referrals", label: "nav.referrals" },
  ],
  vendor: [
    { href: "/v", label: "nav.today" },
    { href: "/v/new", label: "nav.quickList" },
    { href: "/v/scan", label: "nav.scan" },
    { href: "/v/analytics", label: "nav.analytics" },
    { href: "/v/payouts", label: "nav.payouts" },
    { href: "/v/receipts", label: "nav.receipts" },
    { href: "/v/onboarding", label: "nav.outletProfile" },
  ],
  ngo: [
    { href: "/n", label: "nav.donationFeed" },
    { href: "/n/receipts", label: "nav.receipts" },
    { href: "/n/onboarding", label: "nav.verification" },
  ],
  admin: [
    { href: "/admin", label: "nav.cityImpact" },
    { href: "/admin/approvals", label: "nav.approvals" },
    { href: "/admin/reports", label: "nav.reports" },
    { href: "/admin/flagged", label: "nav.flagged" },
  ],
};

export async function Header() {
  const actor = await getActor();
  const { t, fmt } = await getT();
  const db = read();
  const offsetMin = Math.round((db.clockOffsetMs || 0) / 60000);
  const org = actor?.role === "vendor" ? resolveOrg(db, actor) : null;
  const navItems = (NAV[actor?.role ?? ""] || []).filter((n) => {
    if (actor?.role !== "vendor" || !org) return true;
    if (n.href === "/c/referrals" && !isFlagOn("referrals")) return false;
    if ((n.href === "/v/receipts" || n.href === "/n/receipts") && !isFlagOn("donationReceipts")) return false;
    const need: Record<string, Parameters<typeof can>[1] | undefined> = { "/v/new": "listing.write", "/v/analytics": "analytics.view", "/v/payouts": "payouts.view", "/v/onboarding": "org.settings", "/v/receipts": "receipts.view" };
    return !need[n.href] || can(org.role, need[n.href]!);
  });
  if (org && can(org.role, "staff.manage") && isFlagOn("multiOutlet")) navItems.push({ href: "/v/team", label: "nav.team" });
  const notes = actor ? db.notifications.filter((n) => n.userId === actor.id).slice(-8).reverse() : [];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-logobg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link href="/" aria-label={t("header.home")} className="shrink-0">
          <Logo width={84} priority />
        </Link>
        {actor && (
          <nav aria-label={t("header.main")} className="flex flex-wrap gap-1">
            {navItems.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-burgundy hover:bg-cream">
                {t(n.label)}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {isFlagOn("i18n") && <LanguageSwitcher />}
          <LiveDot />
          {actor ? (
            <>
              <NotificationBell items={notes.map((n) => ({ id: n.id, text: n.text, at: n.at, read: n.read }))} />
              <span className="hidden text-xs font-semibold text-muted sm:inline">{actor.name}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/signin" className="btn-primary !py-2">{t("header.signIn")}</Link>
          )}
        </div>
      </div>
      <div className="border-t border-line bg-cream/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-1.5 text-[11px] font-semibold text-burgundy sm:px-6">
          <span>{t("header.demoBanner")}</span>
          <span className="text-muted">
            {t("header.serverTime", { time: fmt.time(now(db)) })}
            {offsetMin !== 0 && ` (demo clock +${offsetMin} min)`}
          </span>
          {actor && <DemoControls isAdmin={actor.role === "admin"} offsetMin={offsetMin} />}
        </div>
      </div>
    </header>
  );
}
