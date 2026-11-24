import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getActor } from "@/lib/session";
import { HOME, SELF_ROLES, SKIP_PERSONA, type SelfRole } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { RoleSignIn } from "@/components/RoleSignIn";
import { SignInClient } from "./SignInClient";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.signin") };
}

export default async function SignIn({ searchParams }: { searchParams: Promise<{ role?: string; all?: string; switch?: string; next?: string; ref?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  const db = read();
  const label = (id: string) => {
    const p = db.profiles.find((x) => x.id === id);
    const v = db.vendors.find((x) => x.ownerId === id);
    const n = db.ngos.find((x) => x.ownerId === id);
    return { id, name: p?.name ?? id, role: p?.role ?? "customer", org: v?.businessName ?? n?.orgName, status: v?.status ?? n?.status };
  };

  // A plate slice sends ?role=customer|vendor|ngo: show that side's own sign-in.
  const role = SELF_ROLES.includes(sp.role as SelfRole) && !sp.all ? (sp.role as SelfRole) : null;
  if (role) {
    const actor = await getActor();
    const next = /^\/join\/[\w-]{10,}$/.test(sp.next ?? "") ? sp.next! : undefined; // only invite links may be returned to
    if (actor && actor.role === role && !sp.switch) redirect(next ?? HOME[role]); // already signed in on this side: go straight there
    const skip = label(SKIP_PERSONA[role]);
    const skipName = skip.org ? `${skip.name.split(" (")[0]} · ${skip.org}` : skip.name.split(" (")[0];
    return <RoleSignIn role={role} actor={actor ? { name: actor.name, role: actor.role } : null} skipName={skipName} next={next} refCode={/^[A-Za-z0-9]{4,16}$/.test(sp.ref ?? "") ? sp.ref!.toUpperCase() : undefined} />;
  }

  const personas = ["u_priya", "u_arjun", "u_sana", "u_ravi", "u_mgr1", "u_staff1", "u_staff2", "u_vendor2", "u_vendor3", "u_joseph", "u_ngo2", "u_ngo4", "u_admin"]
    .filter((id) => db.profiles.some((p) => p.id === id))
    .map(label);
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Logo width={220} priority />
        <h1 className="display text-5xl text-tomato">{t("signin.title")}</h1>
        <p className="text-sm text-muted">
          {t("signin.intro1")} <b>123456</b>{t("signin.intro2")}
        </p>
      </div>
      <SignInClient personas={personas} />
    </div>
  );
}
