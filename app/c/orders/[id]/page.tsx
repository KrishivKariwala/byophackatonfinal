import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Check } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { directionsUrl, NEIGHBOURHOODS } from "@/lib/geo";
import { fmtDateTime, fmtWindow, StatusPill } from "@/components/bits";
import { Countdown } from "@/components/client";
import { CancelOrder, ReportButton, ReviewForm } from "@/components/p1";
import { cancelQuote } from "@/lib/cancel";
import { RULES } from "@/lib/rules";
import { S } from "@/lib/strings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pickup pass" };

const STEPS = ["Reserved", "Ready", "Picked up"] as const;

export default async function OrderPass({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("customer");
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
        <p className="eyebrow text-peach">Pickup pass · {r.ref}</p>
        <h1 className="display text-center text-3xl">
          {r.status === "Ready" ? "READY FOR YOU" : r.status === "Reserved" ? "RESERVED" : r.status.toUpperCase()}
        </h1>
        <ol className="flex w-full gap-1.5" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-bold ${i <= stepIdx ? "bg-peach text-burgundy" : "border border-peach/60 text-peach"}`} aria-current={i === stepIdx ? "step" : undefined}>
              {i < stepIdx && <Check size={12} aria-hidden="true" />}{s}
            </li>
          ))}
        </ol>
        {qr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`Pickup QR code for ${r.ref}`} width={220} height={220} className="rounded-2xl bg-white p-2" />
            <p className="text-xs text-peach">Or tell the counter</p>
            <p className="display text-5xl tracking-[0.3em]" aria-label={`Fallback code ${r.code.split("").join(" ")}`}>{r.code}</p>
            <p className="text-center text-[11px] text-peach">Works once, only at {v.businessName}, only during the pickup window.</p>
          </>
        ) : (
          <p className="rounded-xl bg-cream/10 p-3 text-center text-sm">
            {r.status === "Picked up" ? `Collected ${fmtDateTime(r.pickedUpAt!)}. Code is now invalid.` : r.status === "No-show" ? S.noShow : r.cancelReason ?? `This order is ${r.status.toLowerCase()}.`}
          </p>
        )}
      </div>
      <div className="card flex flex-col gap-1.5 p-4 text-sm">
        <div className="flex items-center justify-between"><b>{v.businessName}</b><StatusPill status={r.status} /></div>
        <p>{r.qty} × {l.title} · ₹{r.amount}</p>
        <p className="text-muted">Payment: {p?.status ?? "—"} ({r.method === "online" ? "online, test mode" : "pay at pickup"})</p>
        <p className="text-muted">Pickup window {fmtWindow(l.windowStart, l.windowEnd)}</p>
        {active && (
          <p className="font-bold text-tomato">
            {started ? <Countdown to={l.windowEnd} serverNow={n} label="until the window closes" endedText="Window closed" /> : <Countdown to={l.windowStart} serverNow={n} label="until pickup opens" endedText="Pickup is open" />}
          </p>
        )}
        <p className="text-muted">{o.address}</p>
        <a className="btn-primary mt-2" href={directionsUrl(o, NEIGHBOURHOODS.Koramangala)} target="_blank" rel="noreferrer">Get directions</a>
        <p className="text-[11px] text-muted">Directions start from Koramangala (demo default location).</p>
      </div>
      {r.status === "Picked up" && l.surpriseBag && <p className="rounded-2xl bg-peach p-4 text-sm text-burgundy"><b>Your Surprise Bag:</b> {l.description.startsWith("Surprise Bag") ? "contents varied with what was left today." : l.description}</p>}
      {active && <div className="card p-4"><p className="mb-2 text-xs text-muted">{S.cancel.policy}</p><CancelOrder reservationId={r.id} free={quote.free} refund={quote.refundAmount} freeUntil={fmtDateTime(quote.freeUntil)} /></div>}
      {canReview && <ReviewForm reservationId={r.id} />}
      {review && <p className="card p-4 text-sm">You rated this order {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}{review.text && <span className="text-muted"> — {review.text}</span>}</p>}
      <details className="card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Order history</summary>
        <ol className="mt-2 flex flex-col gap-1 text-xs text-muted">{events.map((e) => <li key={e.id}>{fmtDateTime(e.at)} · {e.from ? `${e.from} → ` : ""}{e.to}{e.note ? ` (${e.note})` : ""}</li>)}{events.length === 0 && <li>No history recorded.</li>}</ol>
      </details>
      <div className="text-center"><ReportButton targetType="reservation" targetId={r.id} /></div>
    </div>
  );
}
