import { handle } from "@/lib/api";
import { createReport } from "@/lib/p1";
import { getActor } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import { RuleError } from "@/lib/rules";
import type { ReportReason, ReportTarget } from "@/lib/types";

/** Accepts multipart/form-data (with an optional photo) or JSON. */
export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    if (!actor) throw new RuleError("unauthenticated", "Please sign in.", 401);
    const ct = req.headers.get("content-type") || "";
    let f: { targetType: string; targetId: string; reason: string; text?: string };
    let photoUrl: string | undefined;
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      f = { targetType: String(fd.get("targetType")), targetId: String(fd.get("targetId")), reason: String(fd.get("reason")), text: String(fd.get("text") ?? "") };
      const file = fd.get("photo");
      if (file instanceof File && file.size > 0) photoUrl = await saveUpload(actor.id, file);
    } else {
      f = await req.json();
    }
    return createReport(actor, { targetType: f.targetType as ReportTarget, targetId: f.targetId, reason: f.reason as ReportReason, text: f.text, photoUrl });
  });
}
