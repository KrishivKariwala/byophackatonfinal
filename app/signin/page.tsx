import { redirect } from "next/navigation";
import { read } from "@/lib/store";
import { getActor } from "@/lib/session";
import { HOME, SELF_ROLES, SKIP_PERSONA, type SelfRole } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { RoleSignIn } from "@/components/RoleSignIn";
import { SignInClient } from "./SignInClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ role?: string; all?: string; switch?: string }> }) {
  const sp = await searchParams;
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
    if (actor && actor.role === role && !sp.switch) redirect(HOME[role]); // already signed in on this side: go straight there
    const skip = label(SKIP_PERSONA[role]);
    const skipName = skip.org ? `${skip.name.split(" (")[0]} · ${skip.org}` : skip.name.split(" (")[0];
    return <RoleSignIn role={role} actor={actor ? { name: actor.name, role: actor.role } : null} skipName={skipName} />;
  }

  const personas = ["u_priya", "u_arjun", "u_ravi", "u_vendor2", "u_vendor3", "u_joseph", "u_ngo2", "u_ngo4", "u_admin"]
    .filter((id) => db.profiles.some((p) => p.id === id))
    .map(label);
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Logo width={220} priority />
        <h1 className="display text-5xl text-tomato">SIGN IN</h1>
        <p className="text-sm text-muted">
          Phone OTP or Google sign-in. In this demo build, SMS and Google are not connected: the OTP is simulated (use <b>123456</b>) and the
          Google button explains the missing credentials rather than pretending to work.
        </p>
      </div>
      <SignInClient personas={personas} />
    </div>
  );
}
