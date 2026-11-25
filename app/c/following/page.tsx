import Link from "next/link";
import { Heart } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { followingList } from "@/lib/p1";
import { FollowButton, Rating, VerifiedBadge } from "@/components/p1";
import { getT } from "@/lib/i18n/server";
import { hoodLabel } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.following") };
}

export default async function Following() {
  const me = await requirePage("customer");
  const { t } = await getT();
  const list = followingList(me.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="page-title">{t("follow.title")}</h1>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <Heart size={32} className="text-tomato" aria-hidden="true" />
          <h2 className="editorial text-2xl">{t("follow.emptyTitle")}</h2>
          <p className="text-sm text-muted">{t("follow.emptyBody")}</p>
          <Link href="/c" className="btn-primary mt-2">{t("common.findFood")}</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((f) => (
            <li key={f.vendorId} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold">{f.businessName}{f.verified && <VerifiedBadge />}</p>
                <p className="text-xs text-muted">{hoodLabel(t, f.neighbourhood)} · <Rating avg={f.ratingAvg} count={f.ratingCount} /> · {f.liveListings ? t("follow.live", { n: f.liveListings }) : t("follow.none")}</p>
              </div>
              <FollowButton vendorId={f.vendorId} initial />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
