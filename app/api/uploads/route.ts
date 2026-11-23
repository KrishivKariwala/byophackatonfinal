import { handle } from "@/lib/api";
import { getActor } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import { RuleError } from "@/lib/rules";

/** POST multipart "file": stores a private upload (JPG/PNG/WebP/PDF, 3 MB max) and returns its URL. Used for onboarding documents and logos. */
export async function POST(req: Request) {
  return handle(async () => {
    const a = await getActor();
    if (!a) throw new RuleError("unauthenticated", "Please sign in.", 401);
    const f = (await req.formData()).get("file");
    if (!(f instanceof File) || f.size === 0) throw new RuleError("file_required", "Choose a file.");
    return { url: await saveUpload(a.id, f) };
  });
}
