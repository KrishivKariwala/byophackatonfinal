"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/I18n";

/** The back arrow of the restaurant kitchens: one step up, to the restaurants and outlets page (where the live orders are one tap away). */
export function BackToOutlets() {
  const { t } = useT();
  return (
    <Link href="/v/outlets" aria-label={t("kitchen.backOutlets")} title={t("kitchen.backOutlets")} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border-2 shadow-lg"
      style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}>
      <ArrowLeft size={20} aria-hidden="true" />
    </Link>
  );
}
