import { Logo } from "@/components/Logo";
import { JoinClient } from "@/components/p2";
import { getActor } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { previewInvite } from "@/lib/p2/team";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.join") };
}

export default async function Join({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();
  const inv = previewInvite(token);
  const actor = await getActor();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
      <Logo width={140} />
      {!inv ? (
        <div className="card p-6"><h1 className="editorial text-2xl">{t("org.joinInvalid")}</h1></div>
      ) : inv.state !== "open" ? (
        <div className="card p-6"><h1 className="editorial text-2xl">{inv.business}</h1><p role="status" className="mt-2 text-sm text-muted">{t(`org.joinState.${inv.state}`)}</p></div>
      ) : (
        <div className="card flex flex-col gap-4 p-6">
          <h1 className="editorial text-3xl">{t("org.joinTitle", { business: inv.business })}</h1>
          <p className="text-sm text-muted">{t("org.joinAs", { role: t(`org.role.${inv.role}`), outlet: inv.outlet ? ` · ${inv.outlet}` : "" })}</p>
          <JoinClient token={token} signedIn={!!actor && actor.role === "vendor"} business={inv.business} />
          {actor && actor.role !== "vendor" && <p role="alert" className="text-xs font-semibold text-tomato">{t("org.joinNeedVendor")}</p>}
        </div>
      )}
    </div>
  );
}
