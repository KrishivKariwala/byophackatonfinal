import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Check } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { directionsUrl, NEIGHBOURHOODS } from "@/lib/geo";
import { StatusPill } from "@/components/bits";
import { Countdown } from "@/components/client";
import { CancelOrder, ReportButton, ReviewForm } from "@/components/p1";
import { cancelQuote } from "@/lib/cancel";
import { RULES } from "@/lib/rules";
import { EtaButton } from "@/components/p2-customer";
import { isFlagOn } from "@/lib/p2/platform";
import { getT } from "@/lib/i18n/server";
import { statusLabel } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.pickupPass") };
}

const STEPS = ["Reserved", "Ready", "Picked up"] as const;

/** Reasons the system writes itself are shown in the reader's language; a vendor's own words and demo text stay as written. */
function cancelReasonText(t: (k: string, v?: Record<string, string | number>) => string, reason?: string) {
  if (!reason) return undefined;
  const fixed: Record<string, string> = { "Refunded by an administrator": "cancelr.admin", "Cancelled by customer": "cancelr.customer", "Late cancellation by customer (no refund)": "cancelr.customerLate" };
  if (fixed[reason]) return t(fixed[reason]);
  const m = /^Vendor cancelled listing: ([\s\S]*)$/.exec(reason);
  return m ? t("cancelr.vendor", { reason: m[1] }) : reason;
}

export default async function OrderPass({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("customer");
  const { t, fmt } = await getT();
  const { id } = await params;
  const db = read();
  const r = db.reservations.find((x) => x.id === id && x.customerId === me.id); // owner-only
  if (!r) notFound();
  const l = db.listings.find((x) => x.id === r.listingId)!;
  const v = db.vendors.find((x) => x.id === r.vendorId)!;
  const o = db.outlets.find((x) => x.id === r.outletId)!;
  const p = db.payments.find((x) => x.reservationId === r.id);
  const n = now(db);
  const active = r.status === "Reserved" || r.status === "Ready";
  const qr = active ? await QRCode.toDataURL(`sap:${r.qrToken}`, { margin: 1, width: 360, color: { dark: "#2A0A0A", light: "#FFFFFF" } }) : null;
  const stepIdx = STEPS.indexOf(r.status as (typeof STEPS)[number]);
  const started = n >= Date.parse(l.windowStart);
  const quote = cancelQuote(db, r, l);
  const review = db.reviews.find((x) => x.reservationId === r.id);
  const canReview = r.status === "Picked up" && !review && r.pickedUpAt && n <= Date.parse(r.pickedUpAt) + RULES.REVIEW_WINDOW_HOURS * 3600_000;
  const events = db.reservationEvents.filter((e) => e.reservationId === r.id);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-burgundy p-6 text-cream">
        <p className="eyebrow text-peach">{t("order.pass", { ref: r.ref })}</p>
        <h1 className="display text-center text-3xl">
          {r.status === "Ready" ? t("order.readyForYou") : r.status === "Reserved" ? t("order.reserved") : statusLabel(t, r.status).toUpperCase()}
        </h1>
        <ol className="flex w-full gap-1.5" aria-label={t("order.progress")}>
          {STEPS.map((s, i) => (
            <li key={s} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-bold ${i <= stepIdx ? "bg-peach text-burgundy" : "border border-peach/60 text-peach"}`} aria-current={i === stepIdx ? "step" : undefined}>
              {i < stepIdx && <Check size={12} aria-hidden="true" />}{statusLabel(t, s)}
            </li>
          ))}
        </ol>
        {qr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={t("order.qrAlt", { ref: r.ref })} width={220} height={220} className="rounded-2xl bg-white p-2" />
            <p className="text-xs text-peach">{t("order.orTell")}</p>
            <p className="display text-5xl tracking-[0.3em]" aria-label={t("order.fallbackAria", { code: r.code.split("").join(" ") })}>{r.code}</p>
            <p className="text-center text-[11px] text-peach">{t("order.once", { vendor: v.businessName })}</p>
          </>
        ) : (
          <p className="rounded-xl bg-cream/10 p-3 text-center text-sm">
            {r.status === "Picked up" ? t("order.collected", { when: fmt.dateTime(r.pickedUpAt!) }) : r.status === "No-show" ? t("order.noShow") : cancelReasonText(t, r.cancelReason) ?? t("order.isStatus", { status: statusLabel(t, r.status).toLowerCase() })}
          </p>
        )}
      </div>
      <div className="card flex flex-col gap-1.5 p-4 text-sm">
        <div className="flex items-center justify-between"><b>{v.businessName}</b><StatusPill status={r.status} /></div>
        <p>{r.qty} × {l.title} · ₹{r.amount}{r.creditApplied ? <span className="text-muted"> {t("order.paidWithCredit", { amount: r.creditApplied })}</span> : null}</p>
        <p className="text-muted">{t("order.payment", { status: p ? statusLabel(t, p.status) : "—", method: r.method === "online" ? t("order.methodOnline") : t("order.methodPickup") })}</p>
        <p className="text-muted">{t("order.window", { window: fmt.window(l.windowStart, l.windowEnd) })}</p>
        {active && (
          <p className="font-bold text-tomato">
            {started ? <Countdown to={l.windowEnd} serverNow={n} label={t("order.untilClose")} endedText={t("order.windowClosed")} /> : <Countdown to={l.windowStart} serverNow={n} label={t("order.untilOpen")} endedText={t("order.pickupOpen")} />}
          </p>
        )}
        <p className="text-muted">{o.address}</p>
        <a className="btn-primary mt-2" href={directionsUrl(o, NEIGHBOURHOODS.Koramangala)} target="_blank" rel="noreferrer">{t("order.directions")}</a>
        <p className="text-[11px] text-muted">{t("order.directionsNote")}</p>
      </div>
      {r.status === "Picked up" && l.surpriseBag && <p className="rounded-2xl bg-peach p-4 text-sm text-burgundy"><b>{t("order.surprise")}</b> {l.description.startsWith("Surprise Bag") ? t("order.surpriseVaried") : l.description}</p>}
      {active && isFlagOn("liveEta") && <EtaButton reservationId={r.id} outlet={{ lat: o.lat, lng: o.lng }} initialMinutes={r.etaMinutes} canStart={n >= Date.parse(l.windowStart) - 90 * 60_000 && n <= Date.parse(l.windowEnd)} />}
      {active && <div className="card p-4"><p className="mb-2 text-xs text-muted">{t("cancel.policy", { minutes: RULES.CANCEL_FREE_MINUTES_BEFORE_START })}</p><CancelOrder reservationId={r.id} free={quote.free} refund={quote.refundAmount} freeUntil={fmt.dateTime(quote.freeUntil)} minutes={RULES.CANCEL_FREE_MINUTES_BEFORE_START} /></div>}
      {canReview && <ReviewForm reservationId={r.id} />}
      {review && <p className="card p-4 text-sm">{t("order.youRated")} {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}{review.text && <span className="text-muted"> — {review.text}</span>}</p>}
      <details className="card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">{t("order.history")}</summary>
        <ol className="mt-2 flex flex-col gap-1 text-xs text-muted">{events.map((e) => <li key={e.id}>{fmt.dateTime(e.at)} · {e.from ? `${statusLabel(t, e.from)} → ` : ""}{statusLabel(t, e.to)}{e.note ? ` (${e.note})` : ""}</li>)}{events.length === 0 && <li>{t("order.noHistory")}</li>}</ol>
      </details>
      <div className="text-center"><ReportButton targetType="reservation" targetId={r.id} /></div>
    </div>
  );
}
