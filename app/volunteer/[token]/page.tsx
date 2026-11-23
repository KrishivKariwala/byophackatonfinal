import { MapPin, Phone, Clock, KeyRound } from "lucide-react";
import { volunteerView } from "@/lib/charity";
import { fmtDateTime, fmtTime } from "@/components/bits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteer pickup", robots: { index: false, follow: false } };

export default async function Volunteer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = volunteerView(token);
  if (v.state !== "ok") {
    const msg = v.state === "collected" ? ["All done", "This pickup has already been collected. Thank you!"] : v.state === "expired" ? ["Link expired", "The pickup deadline has passed, so this link no longer works."] : ["Not found", "We couldn't find this pickup link. Check it with your organisation."];
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="display text-4xl text-tomato">{msg[0].toUpperCase()}</h1><p className="mt-2 text-sm text-muted">{msg[1]}</p></div>;
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-burgundy p-6 text-center text-cream">
        <p className="eyebrow text-peach">Volunteer pickup · {v.ref}</p>
        <h1 className="display text-3xl">{v.qty} × {v.title.toUpperCase()}</h1>
        {v.volunteerName && <p className="text-sm text-peach">For {v.volunteerName}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-peach"><KeyRound size={14} aria-hidden="true" />Show this code to the vendor</p>
        <p className="display text-6xl tracking-[0.3em]" aria-label={`Pickup code ${v.code.split("").join(" ")}`}>{v.code}</p>
      </div>
      <div className="card flex flex-col gap-3 p-4 text-sm">
        <p className="flex items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-tomato" aria-hidden="true" /><span><b>{v.vendorName}</b><br />{v.address}</span></p>
        <p className="flex items-center gap-2"><Clock size={18} className="shrink-0 text-tomato" aria-hidden="true" /><span>{v.slot ? <>Pickup time <b>{fmtDateTime(v.slot)}</b> · </> : null}collect by <b>{fmtTime(v.collectBy)}</b></span></p>
        <p className="flex items-center gap-2"><Phone size={18} className="shrink-0 text-tomato" aria-hidden="true" /><a className="font-semibold underline" href={`tel:${v.vendorPhone.replace(/\s/g, "")}`}>Call the vendor: {v.vendorPhone}</a></p>
        <a className="btn-primary" href={v.directions} target="_blank" rel="noreferrer">Directions in Google Maps</a>
      </div>
      <p className="text-center text-[11px] text-muted">No login needed. This link stops working after the pickup deadline. Demo data, fictional vendor.</p>
    </div>
  );
}
