import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { loginOrSignup, normalizePhone } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { setSession } from "@/lib/session";
import { redeemReferralCode } from "@/lib/p2/credits";
import { deviceId } from "@/lib/p2/device";

/**
 * Phone OTP sign-in / sign-up (find or create by phone). In demo mode no SMS is sent: the OTP is simulated and
 * shown on screen (123456). With Supabase configured this becomes supabase.auth.signInWithOtp / verifyOtp.
 * Wrong-code guessing is rate-limited per phone number.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ name?: string; phone: string; otp: string; role: string; referralCode?: string }>(req);
    if (!/^\+?\d[\d\s]{9,14}$/.test(b.phone || "")) throw new RuleError("phone_invalid", "Enter a valid phone number.");
    rateLimit(`otp:${normalizePhone(b.phone)}`, 8, 10 * 60_000);
    if (b.otp !== "123456") throw new RuleError("otp_invalid", "Incorrect code. In demo mode the code is 123456.");
    const { profile, existing, home } = await loginOrSignup({ name: b.name, phone: b.phone, role: b.role });
    await setSession(profile.id);
    // A referral code typed at sign-up applies to a brand-new customer. A bad code never blocks the sign-up: the reason is returned instead.
    let referral: { ok: boolean; error?: string } | undefined;
    if (!existing && profile.role === "customer" && b.referralCode?.trim()) {
      try { await redeemReferralCode(profile, { code: b.referralCode, deviceId: await deviceId() }); referral = { ok: true }; }
      catch (e) { referral = { ok: false, error: (e as Error).message }; }
    } else await deviceId(); // remember this browser (anonymous id) so a later redeem can detect a reused device
    return { id: profile.id, role: profile.role, existing, home, referral };
  });
}
