"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

type Res = { kind: "hold"; holdId: string } | { kind: "reservation"; reservationId: string };

export function ReserveBox({ listingId, unitPrice, maxQty, payAtPickup, payAtPickupNote, activeCount, policy, creditBalance = 0, creditMaxPct = 50, maxActive = 3, holdMinutes = 5 }: { listingId: string; unitPrice: number; maxQty: number; payAtPickup: boolean; payAtPickupNote: string; activeCount: number; policy: string; creditBalance?: number; creditMaxPct?: number; maxActive?: number; holdMinutes?: number }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [useCredit, setUseCredit] = useState(true);
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<"online" | "pay_at_pickup">("online");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const capped = Math.max(1, maxQty);
  const total = qty * unitPrice;
  const creditUse = useCredit ? Math.max(0, Math.min(creditBalance, Math.floor((total * creditMaxPct) / 100))) : 0;
  const pay = total - creditUse;

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<Res>("/api/reservations", { listingId, qty, method, useCredit: creditUse > 0 });
      router.push(r.kind === "hold" ? `/c/checkout/${r.holdId}` : `/c/orders/${r.reservationId}`);
    } catch (e) {
      setErr((e as Error).message);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Quantity</span>
        <div className="flex items-center gap-3">
          <button aria-label="Decrease quantity" className="h-11 w-11 rounded-full border-2 border-tomato text-xl text-tomato disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>−</button>
          <b className="w-6 text-center text-lg" aria-live="polite">{qty}</b>
          <button aria-label="Increase quantity" className="h-11 w-11 rounded-full bg-tomato text-xl text-white disabled:opacity-40" disabled={qty >= capped} onClick={() => setQty(qty + 1)}>+</button>
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-1">Payment</legend>
        <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm ${method === "online" ? "border-tomato bg-cream" : "border-line"}`}>
          <input type="radio" name="m" checked={method === "online"} onChange={() => setMethod("online")} className="accent-tomato" />
          <span><b>Pay now</b> · UPI / card (test mode). Units held {holdMinutes} minutes while you pay.</span>
        </label>
        <label className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm ${!payAtPickup ? "opacity-50" : "cursor-pointer"} ${method === "pay_at_pickup" ? "border-tomato bg-cream" : "border-line"}`}>
          <input type="radio" name="m" disabled={!payAtPickup} checked={method === "pay_at_pickup"} onChange={() => setMethod("pay_at_pickup")} className="accent-tomato" />
          <span><b>Pay at pickup</b> · {payAtPickup ? "reserved instantly, pay the vendor at handover." : payAtPickupNote}</span>
        </label>
      </fieldset>
      {creditBalance > 0 && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line p-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
          <span><b>{t("credit.use", { amount: fmt.inr(Math.min(creditBalance, Math.floor((total * creditMaxPct) / 100))) })}</b><span className="block text-xs text-muted">{t("credit.useHelp", { balance: fmt.inr(creditBalance), pct: creditMaxPct })}</span></span>
        </label>
      )}
      <dl className="rounded-xl bg-canvas p-3 text-sm">
        <div className="flex justify-between"><dt>{qty} × ₹{unitPrice}</dt><dd>₹{total}</dd></div>
        <div className="flex justify-between text-muted"><dt>Convenience fee</dt><dd>₹0 (pilot)</dd></div>
        {creditUse > 0 && <div className="flex justify-between text-veg"><dt>{t("credit.line")}</dt><dd>−₹{creditUse}</dd></div>}
        <div className="mt-1 flex justify-between border-t border-line pt-1 font-bold"><dt>{creditUse > 0 ? t("credit.toPay") : "Total"}</dt><dd>₹{pay}</dd></div>
      </dl>
      <p className="rounded-xl bg-cream p-3 text-xs text-burgundy"><b>Cancellation policy.</b> {policy}</p>
      <button className="btn-primary !py-4 text-base" disabled={busy} onClick={submit}>
        {busy ? "Reserving…" : method === "online" ? `Reserve & pay ₹${pay}` : `Reserve ${qty} · pay at pickup${creditUse > 0 ? ` (₹${pay})` : ""}`}
      </button>
      {activeCount >= maxActive && <p className="text-xs font-semibold text-tomato">You already have {maxActive} active reservations. Collect or cancel one first.</p>}
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}
