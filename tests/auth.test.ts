import { beforeEach, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const tmp = path.join(os.tmpdir(), `sap-auth-test-${process.pid}.json`);
process.env.DEMO_DB_PATH = tmp;

const store = await import("@/lib/store");
const auth = await import("@/lib/auth");
const { rateLimit, resetRateLimits } = await import("@/lib/ratelimit");
const { buildSeed } = await import("@/lib/seed");

beforeEach(async () => {
  if (fs.existsSync(tmp)) fs.rmSync(tmp);
  resetRateLimits();
  await store.resetStore(buildSeed(Date.now()));
});

const profiles = () => store.read().profiles;

describe("phone sign-in: find or create", () => {
  it("normalises phone numbers by their last 10 digits", () => {
    expect(auth.normalizePhone("+91 98765 43210")).toBe("9876543210");
    expect(auth.normalizePhone("098765-43210")).toBe("9876543210");
    expect(auth.normalizePhone("9876543210")).toBe("9876543210");
    expect(auth.normalizePhone("12345")).toBe("12345");
  });

  it("first time: creates the account; same number again signs into the SAME account", async () => {
    const before = profiles().length;
    const a = await auth.loginOrSignup({ name: "Asha Rao", phone: "+91 98765 43210", role: "customer" });
    expect(a.existing).toBe(false);
    expect(a.home).toBe("/c");
    expect(profiles()).toHaveLength(before + 1);
    // different formatting, no name needed the second time
    const b = await auth.loginOrSignup({ phone: "9876543210", role: "customer" });
    expect(b.existing).toBe(true);
    expect(b.profile.id).toBe(a.profile.id);
    expect(profiles()).toHaveLength(before + 1); // no duplicate account
  });

  it("a first-time number needs a name", async () => {
    await expect(auth.loginOrSignup({ phone: "+91 91111 22222", role: "customer" })).rejects.toMatchObject({ code: "name_required" });
    await expect(auth.loginOrSignup({ name: "A", phone: "+91 91111 22222", role: "customer" })).rejects.toMatchObject({ code: "name_required" });
  });

  it("one number = one account: another side is refused with a clear message", async () => {
    // Priya (seed) is a customer
    await expect(auth.loginOrSignup({ name: "Priya", phone: "+91 90000 00010", role: "vendor" })).rejects.toMatchObject({ code: "role_mismatch" });
    const ok = await auth.loginOrSignup({ phone: "+91 90000 00010", role: "customer" });
    expect(ok.profile.id).toBe("u_priya");
    expect(ok.existing).toBe(true);
  });

  it("validates the phone number and the side; admin can never be chosen", async () => {
    await expect(auth.loginOrSignup({ name: "Asha", phone: "12345", role: "customer" })).rejects.toMatchObject({ code: "phone_invalid" });
    await expect(auth.loginOrSignup({ name: "Asha", phone: "+91 98765 43210", role: "admin" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(auth.loginOrSignup({ name: "Asha", phone: "+91 98765 43210", role: "wizard" })).rejects.toMatchObject({ code: "role_invalid" });
  });

  it("lands vendors and NGOs without an application on onboarding, and existing ones on their dashboard", async () => {
    const v = await auth.loginOrSignup({ name: "New Vendor", phone: "+91 97000 11111", role: "vendor" });
    expect(v.home).toBe("/v/onboarding");
    const n = await auth.loginOrSignup({ name: "New NGO", phone: "+91 97000 22222", role: "ngo" });
    expect(n.home).toBe("/n/onboarding");
    const ravi = await auth.loginOrSignup({ phone: "+91 90000 01001", role: "vendor" }); // seeded Ravi
    expect(ravi.home).toBe("/v");
    expect(ravi.profile.id).toBe("u_ravi");
  });

  it("the account creation is audit-logged", async () => {
    const a = await auth.loginOrSignup({ name: "Asha Rao", phone: "+91 98765 43210", role: "customer" });
    expect(store.read().audit.some((x) => x.action === "account_created" && x.entityId === a.profile.id)).toBe(true);
  });
});

describe("demo Skip", () => {
  it("signs in as the approved demo account for each side and lands on the right home", async () => {
    const c = await auth.skipLogin("customer");
    expect(c.profile.id).toBe("u_priya");
    expect(c.home).toBe("/c");
    const v = await auth.skipLogin("vendor");
    expect(v.profile.id).toBe("u_ravi");
    expect(v.home).toBe("/v");
    const n = await auth.skipLogin("ngo");
    expect(n.profile.id).toBe("u_joseph");
    expect(n.home).toBe("/n");
    // the Skip personas must be approved, or the flow wouldn't work straight away
    const db = store.read();
    expect(db.vendors.find((x) => x.ownerId === "u_ravi")!.status).toBe("Approved");
    expect(db.ngos.find((x) => x.ownerId === "u_joseph")!.status).toBe("Approved");
  });

  it("is audit-logged, and refuses admin or unknown sides", async () => {
    await auth.skipLogin("customer");
    expect(store.read().audit.some((x) => x.action === "demo_skip_login" && x.entityId === "u_priya")).toBe(true);
    await expect(auth.skipLogin("admin")).rejects.toMatchObject({ code: "forbidden" });
    await expect(auth.skipLogin("nope")).rejects.toMatchObject({ code: "role_invalid" });
  });
});

describe("wrong-code guessing is rate-limited", () => {
  it("allows 8 attempts per phone number per 10 minutes, then blocks", () => {
    const key = `otp:${auth.normalizePhone("+91 98765 43210")}`;
    for (let i = 0; i < 8; i++) rateLimit(key, 8, 10 * 60_000);
    expect(() => rateLimit(key, 8, 10 * 60_000)).toThrowError(/Too many/);
    // another number is unaffected
    expect(() => rateLimit(`otp:${auth.normalizePhone("+91 90000 11111")}`, 8, 10 * 60_000)).not.toThrow();
  });
});
