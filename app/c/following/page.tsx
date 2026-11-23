import Link from "next/link";
import { Heart } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { followingList } from "@/lib/p1";
import { S } from "@/lib/strings";
import { FollowButton, Rating, VerifiedBadge } from "@/components/p1";

export const dynamic = "force-dynamic";
export const metadata = { title: "Following" };

export default async function Following() {
  const me = await requirePage("customer");
  const list = followingList(me.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="display text-4xl text-tomato">FOLLOWING</h1>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <Heart size={32} className="text-tomato" aria-hidden="true" />
          <h2 className="editorial text-2xl">{S.follow.emptyTitle}</h2>
          <p className="text-sm text-muted">{S.follow.emptyBody}</p>
          <Link href="/c" className="btn-primary mt-2">Find food nearby</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((f) => (
            <li key={f.vendorId} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold">{f.businessName}{f.verified && <VerifiedBadge />}</p>
                <p className="text-xs text-muted">{f.neighbourhood} · <Rating avg={f.ratingAvg} count={f.ratingCount} /> · {f.liveListings ? `${f.liveListings} live now` : "nothing live right now"}</p>
              </div>
              <FollowButton vendorId={f.vendorId} initial />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
