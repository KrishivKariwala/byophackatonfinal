"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

type Outcome = { outcome: "confirmed" | "duplicate" | "late_refund" | "failed"; reservationId?: string };
type RzpResp = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } } }

export function CheckoutClient({ holdId, gatewayOrderId, amount, razorpay, keyId }: { holdId: string; gatewayOrderId: string; amount: number; razorpay: boolean; keyId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const after = (o: Outcome) => {
    if ((o.outcome === "confirmed" || o.outcome === "duplicate") && o.reservationId) router.push(`/c/orders/${o.reservationId}`);
    else if (o.outcome === "late_refund") setMsg(t("checkout.lateRefund"));
    else { setMsg(t("checkout.failed")); router.refresh(); }
  };

  const demo = async (outcome: "success" | "fail") => {
    setBusy(true);
    setMsg(null);
    try { after(await api<Outcome>(`/api/checkout/${holdId}/demo-pay`, { outcome })); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  const real = async () => {
    setBusy(true);
    if (!window.Razorpay) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => res();
        s.onerror = () => rej(new Error(t("checkout.rzpLoadFail")));
        document.body.appendChild(s);
      }).catch((e) => setMsg((e as Error).message));
    }
    if (!window.Razorpay) { setBusy(false); return; }
    new window.Razorpay({
      key: keyId, amount: amount * 100, currency: "INR", order_id: gatewayOrderId, name: "SAVE A PLATE (test mode)",
      handler: async (r: RzpResp) => { try { after(await api<Outcome>(`/api/checkout/${holdId}/verify`, r)); } catch (e) { setMsg((e as Error).message); } },
      modal: { ondismiss: () => setBusy(false) }, theme: { color: "#CB0001" },
    }).open();
  };

  return (
    <div className="card flex flex-col gap-3 p-5">
      {razorpay ? (
        <>
          <p className="text-xs font-semibold text-burgundy">{t("checkout.rzpNote")}</p>
          <button className="btn-primary !py-4" disabled={busy} onClick={real}>{t("checkout.payWith", { amount })}</button>
        </>
      ) : (
        <>
          <p className="rounded-lg bg-peach p-2 text-xs font-semibold text-burgundy">{t("checkout.simNote")}</p>
          <button className="btn-primary !py-4" disabled={busy} onClick={() => demo("success")}>{t("checkout.simOk", { amount })}</button>
          <button className="btn-outline" disabled={busy} onClick={() => demo("fail")}>{t("checkout.simFail")}</button>
        </>
      )}
      {msg && <p role="alert" className="text-sm font-semibold text-tomato">{msg}</p>}
    </div>
  );
}
