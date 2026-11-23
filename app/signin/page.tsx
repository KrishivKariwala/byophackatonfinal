import { read } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { SignInClient } from "./SignInClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default function SignIn() {
  const db = read();
  const label = (id: string) => {
    const p = db.profiles.find((x) => x.id === id);
    const v = db.vendors.find((x) => x.ownerId === id);
    const n = db.ngos.find((x) => x.ownerId === id);
    return { id, name: p?.name ?? id, role: p?.role ?? "customer", org: v?.businessName ?? n?.orgName, status: v?.status ?? n?.status };
  };
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
