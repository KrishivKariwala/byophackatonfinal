"use client";
import type { Diet } from "@/lib/types";
import { discountPercent } from "@/lib/rules";
import { useT } from "@/components/I18n";
import { statusLabel } from "@/components/i18n-helpers";

// Translated presentational pieces re-exported from components/bits.tsx (which also holds the plain formatting helpers
// that server components call, so it cannot itself be a client module).

export function DietTag({ diet, large = false }: { diet: Diet; large?: boolean }) {
  const { t } = useT();
  const veg = diet === "Vegetarian";
  const s = large ? 18 : 14;
  return (
    <span className="inline-flex items-center gap-1.5" title={veg ? t("diet.Vegetarian") : t("diet.Non-vegetarian")}>
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center border-[1.5px]"
        style={{ width: s, height: s, borderColor: veg ? "#1F7A3A" : "#8A2A00" }}
      >
        {veg ? (
          <span className="rounded-full" style={{ width: s / 2, height: s / 2, background: "#1F7A3A" }} />
        ) : (
          <span style={{ width: 0, height: 0, borderLeft: `${s / 4}px solid transparent`, borderRight: `${s / 4}px solid transparent`, borderBottom: `${s / 2}px solid #8A2A00` }} />
        )}
      </span>
      <span className={`font-semibold ${large ? "text-sm" : "text-[11px]"}`} style={{ color: veg ? "#1F7A3A" : "#8A2A00" }}>
        {veg ? t("diet.veg") : t("diet.nonVeg")}
      </span>
    </span>
  );
}

export function DemoBadge({ children }: { children?: React.ReactNode }) {
  const { t } = useT();
  return <span className="chip bg-peach text-burgundy !py-0.5 !px-2 text-[10px]">{children ?? t("bits.demo")}</span>;
}

export function Price({ original, rescue, size = "md" }: { original: number; rescue: number; size?: "md" | "lg" }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`price-tag ${size === "lg" ? "text-2xl" : "text-base"}`}>₹{rescue}</span>
      <s className="text-sm tabular-nums text-muted">₹{original}</s>
      <span className="text-xs font-bold text-tomato">{t("bits.off", { pct: discountPercent(original, rescue) })}</span>
    </span>
  );
}

export function Photo({ title, surprise, className = "" }: { title: string; surprise?: boolean; className?: string }) {
  const { t } = useT();
  // No real food photography was supplied; show a clearly labelled representative tile instead of a fake photo.
  return (
    <div className={`relative flex items-end justify-between bg-peach p-3 ${className}`} role="img" aria-label={t("bits.photoAlt", { title })}
      style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 11px, rgba(121,0,0,0.07) 11px 12px)" }}>
      <span className="relative rounded bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-burgundy">
        {surprise ? t("bits.photoSurprise") : t("bits.photo")}
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  const map: Record<string, string> = {
    Live: "bg-cream text-burgundy", Reserved: "bg-cream text-burgundy", Ready: "bg-peach text-burgundy", "Picked up": "bg-[#E6F2E9] text-veg",
    "Sold Out": "bg-sand text-muted", Paused: "bg-sand text-muted", Expired: "bg-sand text-muted", Cancelled: "bg-sand text-muted",
    Open: "bg-cream text-burgundy", Claimed: "bg-peach text-burgundy", Collected: "bg-[#E6F2E9] text-veg", Pending: "bg-peach text-burgundy",
    Approved: "bg-[#E6F2E9] text-veg", Rejected: "bg-sand text-tomato", Hold: "bg-peach text-burgundy", "No-show": "bg-sand text-tomato", Dismissed: "bg-sand text-muted", Actioned: "bg-[#E6F2E9] text-veg",
  };
  return <span className={`chip ${map[status] ?? "bg-sand text-muted"}`}>{statusLabel(t, status)}</span>;
}
