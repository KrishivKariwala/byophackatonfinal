import { getActor } from "@/lib/session";
import { readDb, now } from "@/lib/store";
import { AccountMenu, BellMenu, HeaderShell, LanguageMenu } from "./HeaderBar";
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
    { href: "/admin/moderation", label: "nav.moderation" },
    { href: "/admin/settings", label: "nav.settings" },
  ],
};

export async function Header() {
  const actor = await getActor();
  const { t, fmt, locale } = await getT();
  const db = await readDb();
  const offsetMin = Math.round((db.clockOffsetMs || 0) / 60000);
  const org = actor?.role === "vendor" ? resolveOrg(db, actor) : null;
  const navItems = (NAV[actor?.role ?? ""] || []).filter((n) => {
    if (n.href === "/c/referrals" && !isFlagOn("referrals")) return false;
    if (n.href === "/admin/moderation" && !isFlagOn("moderation")) return false;
    if (n.href === "/admin/settings" && !isFlagOn("platformSettings")) return false;
    if ((n.href === "/v/receipts" || n.href === "/n/receipts") && !isFlagOn("donationReceipts")) return false;
    if (actor?.role !== "vendor" || !org) return true;
    const need: Record<string, Parameters<typeof can>[1] | undefined> = { "/v/new": "listing.write", "/v/analytics": "analytics.view", "/v/payouts": "payouts.view", "/v/onboarding": "org.settings", "/v/receipts": "receipts.view" };
    return !need[n.href] || can(org.role, need[n.href]!);
  });
  if (org && can(org.role, "staff.manage") && isFlagOn("multiOutlet")) navItems.push({ href: "/v/team", label: "nav.team" });
  const notes = actor ? db.notifications.filter((n) => n.userId === actor.id).slice(-8).reverse() : [];
  const roleLabel = actor ? (actor.role === "vendor" && org ? t(`org.role.${org.role}`) : t(`header.role.${actor.role}`)) : "";
  return (
    <HeaderShell
      homeLabel={t("header.home")}
      menuLabel={t("header.menu")}
      menu={actor ? navItems.map((n) => ({ href: n.href, label: t(n.label), desc: t(n.label.replace("nav.", "navd.")) })) : []}
      language={isFlagOn("i18n") ? <LanguageMenu current={locale} /> : null}
      bell={actor ? <BellMenu items={notes.map((n) => ({ id: n.id, text: n.key ? t(`notif.${n.key}`, n.vars) : n.text, at: n.at, read: n.read }))} /> : null}
      account={actor ? <AccountMenu name={actor.name} roleLabel={roleLabel} isAdmin={actor.role === "admin"} offsetMin={offsetMin} serverTime={fmt.time(now(db))} /> : null}
      signIn={<a href="/signin" className="btn-primary !min-h-[44px] !py-2">{t("header.signIn")}</a>}
    />
  );
}
