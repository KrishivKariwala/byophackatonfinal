import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read } from "@/lib/store";
import { ScanClient } from "./ScanClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scan & hand over" };

export default async function Scan() {
  const me = await requirePage("vendor");
  const v = read().vendors.find((x) => x.ownerId === me.id);
  if (!v || v.status !== "Approved")
    return <div className="mx-auto max-w-xl px-4 py-12"><p className="text-sm">Only approved vendors can hand over orders. <Link className="font-semibold text-tomato underline" href="/v/onboarding">Onboarding</Link></p></div>;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <p className="eyebrow text-burgundy">{v.businessName}</p>
      <h1 className="display text-4xl text-tomato">SCAN &amp; HAND OVER</h1>
      <ScanClient />
    </div>
  );
}
