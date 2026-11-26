import { notFound } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { ReferralClient } from "@/components/p2-customer";
import { getT } from "@/lib/i18n/server";
import { myReferral } from "@/lib/p2/credits";
import { deviceId } from "@/lib/p2/device";
import { isFlagOn } from "@/lib/p2/platform";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.referrals") };
}

export default async function Referrals() {
  const me = await requirePage("customer");
  if (!isFlagOn("referrals")) notFound();
  const { t } = await getT();
  const data = await myReferral(me, await deviceId(false));
  const db = await readDb();
  const canRedeem = !data.referredBy && !db.reservations.some((r) => r.customerId === me.id) && !db.holds.some((h) => h.customerId === me.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="page-title">{t("credit.title").toUpperCase()}</h1>
      <ReferralClient data={{ ...data, canRedeem }} />
    </div>
  );
}
