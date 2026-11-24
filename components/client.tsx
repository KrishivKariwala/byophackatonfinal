"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/I18n";

/** The two messages this plain function writes itself (everything else arrives already translated from the server). */
const API_FALLBACK: Record<string, { network: string; failed: string }> = {
  en: { network: "Network error", failed: "Request failed" },
  hi: { network: "नेटवर्क में समस्या", failed: "अनुरोध पूरा नहीं हुआ" },
  kn: { network: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ", failed: "ವಿನಂತಿ ವಿಫಲವಾಯಿತು" },
};
function apiFallback() {
  const lang = typeof document !== "undefined" ? document.documentElement.lang.slice(0, 2) : "en";
  return API_FALLBACK[lang] ?? API_FALLBACK.en;
}

export async function api<T = unknown>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await res.json().catch(() => ({ ok: false, error: apiFallback().network }));
  if (!j.ok) {
    const err = new Error(j.error || apiFallback().failed) as Error & { code?: string };
    err.code = j.code;
    throw err;
  }
  return j.data as T;
}

/** A button that performs a server action and shows its real result. */
export function ActionButton({
  path, body, label, className = "btn-primary", confirm, onDone, successText,
}: { path: string; body?: unknown; label: React.ReactNode; className?: string; confirm?: string; onDone?: (d: unknown) => void; successText?: string }) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (confirm && !window.confirm(confirm)) return;
            try {
              const d = await api(path, body);
              setMsg(successText ? { ok: true, text: successText } : null);
              onDone?.(d);
              router.refresh();
            } catch (e) {
              setMsg({ ok: false, text: (e as Error).message });
            }
          })
        }
      >
        {pending ? t("common.working") : label}
      </button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}
    </span>
  );
}

/** Display-only countdown. Uses the server clock (incl. demo offset) via serverNow; enforcement is always server-side. */
export function Countdown({ to, serverNow, label, endedText }: { to: string; serverNow: number; label?: string; endedText?: string }) {
  const { t } = useT();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const drift = serverNow - Date.now();
    setNow(Date.now() + drift);
    const i = setInterval(() => setNow(Date.now() + drift), 1000);
    return () => clearInterval(i);
  }, [serverNow]);
  if (now === null) return <span>…</span>;
  const ms = Date.parse(to) - now;
  if (ms <= 0) return <span>{endedText ?? t("common.ended")}</span>;
  const h = Math.floor(ms / 3600_000), m = Math.floor((ms % 3600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
  return <span suppressHydrationWarning>{h > 0 ? t("common.hoursMinutes", { h, m }) : `${m}:${String(s).padStart(2, "0")}`} {label ?? t("common.left")}</span>;
}
