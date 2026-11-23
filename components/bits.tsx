import type { Diet } from "@/lib/types";
import { discountPercent } from "@/lib/rules";

export function DietTag({ diet, large = false }: { diet: Diet; large?: boolean }) {
  const veg = diet === "Vegetarian";
  const s = large ? 18 : 14;
  return (
    <span className="inline-flex items-center gap-1.5" title={diet}>
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
        {veg ? "VEG" : "NON-VEG"}
      </span>
    </span>
  );
}

export function DemoBadge({ children = "Demo" }: { children?: React.ReactNode }) {
  return <span className="chip bg-peach text-burgundy !py-0.5 !px-2 text-[10px]">{children}</span>;
}

export function Price({ original, rescue, size = "md" }: { original: number; rescue: number; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <b className={`text-tomato ${size === "lg" ? "text-3xl" : "text-lg"}`}>₹{rescue}</b>
      <s className="text-muted text-sm">₹{original}</s>
      <span className="chip bg-tomato text-white !py-0.5">{discountPercent(original, rescue)}% off</span>
    </span>
  );
}

export function Photo({ title, surprise, className = "" }: { title: string; surprise?: boolean; className?: string }) {
  // No real food photography was supplied; show a clearly labelled representative tile instead of a fake photo.
  return (
    <div className={`relative flex items-end justify-between bg-peach p-3 ${className}`} role="img" aria-label={`Representative image for ${title}`}>
      <svg aria-hidden="true" viewBox="0 0 120 60" className="absolute inset-x-6 top-4 h-[55%] text-tomato/25" fill="none" stroke="currentColor" strokeWidth="4">
        <ellipse cx="60" cy="44" rx="54" ry="10" />
        <path d="M22 40c4-18 20-30 38-30s34 12 38 30" />
      </svg>
      <span className="relative rounded bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-burgundy">
        {surprise ? "Representative · contents vary" : "Representative image"}
      </span>
    </div>
  );
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtWindow = (a: string, b: string) => `${fmtTime(a)}–${fmtTime(b)}`;

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Live: "bg-cream text-burgundy", Reserved: "bg-cream text-burgundy", Ready: "bg-peach text-burgundy", "Picked up": "bg-[#E6F2E9] text-veg",
    "Sold Out": "bg-sand text-muted", Paused: "bg-sand text-muted", Expired: "bg-sand text-muted", Cancelled: "bg-sand text-muted",
    Open: "bg-cream text-burgundy", Claimed: "bg-peach text-burgundy", Collected: "bg-[#E6F2E9] text-veg", Pending: "bg-peach text-burgundy",
    Approved: "bg-[#E6F2E9] text-veg", Rejected: "bg-sand text-tomato", Hold: "bg-peach text-burgundy",
  };
  return <span className={`chip ${map[status] ?? "bg-sand text-muted"}`}>{status}</span>;
}
