"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "./client";
import { useT } from "./I18n";

/** "Food you can take": a charity chooses which diets the donation feed shows. It is a filter; the hidden offers can always be shown. */
export function DietPreference({ current, hidden, showingAll }: { current: "any" | "Vegetarian" | "Non-vegetarian"; hidden: number; showingAll: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const change = async (diet: string) => {
    setBusy(true); setErr(null);
    try { await api("/api/ngo/preferences", { diet }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <label className="label">{t("ngo.pref.title")}
        <select className="input !w-auto" value={current} disabled={busy} onChange={(e) => change(e.target.value)}>
          <option value="any">{t("ngo.pref.any")}</option>
          <option value="Vegetarian">{t("ngo.pref.veg")}</option>
          <option value="Non-vegetarian">{t("ngo.pref.nonveg")}</option>
        </select>
      </label>
      {current !== "any" && hidden > 0 && !showingAll && (
        <p className="text-xs text-muted" role="status">{t("ngo.pref.hidden", { n: hidden })} <Link href="/n?all=1" className="font-semibold text-tomato underline">{t("ngo.pref.showAll")}</Link></p>
      )}
      {showingAll && current !== "any" && <Link href="/n" className="text-xs font-semibold text-tomato underline">{t("ngo.pref.applyAgain")}</Link>}
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </div>
  );
}
