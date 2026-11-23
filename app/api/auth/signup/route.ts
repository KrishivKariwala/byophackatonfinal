import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { createAccount } from "@/lib/services";
import { setSession } from "@/lib/session";
import type { Role } from "@/lib/types";

/**
 * Phone OTP sign-up. In demo mode no SMS is sent: the OTP is simulated and shown on screen (123456).
 * With Supabase configured this is replaced by supabase.auth.signInWithOtp / verifyOtp.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ name: string; phone: string; otp: string; role: Role }>(req);
    if (!/^\+?\d[\d\s]{9,14}$/.test(b.phone || "")) throw new RuleError("phone_invalid", "Enter a valid phone number.");
    if (b.otp !== "123456") throw new RuleError("otp_invalid", "Incorrect OTP. In demo mode the OTP is 123456.");
    const p = await createAccount({ name: b.name, phone: b.phone, role: b.role });
    await setSession(p.id);
    return { id: p.id, role: p.role };
  });
}
