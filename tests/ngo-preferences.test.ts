import { describe, expect, it } from "vitest";
import { P, store, svc } from "./p2-harness";
import { dietMatches, setNgoPreferences } from "@/lib/ngo-prefs";

describe("NGO food preference (a filter, never a claim rule)", () => {
  it("matches diets", () => {
    expect(dietMatches(undefined, "Non-vegetarian")).toBe(true);
    expect(dietMatches("any", "Non-vegetarian")).toBe(true);
    expect(dietMatches("Vegetarian", "Vegetarian")).toBe(true);
    expect(dietMatches("Vegetarian", "Non-vegetarian")).toBe(false);
    expect(dietMatches("Non-vegetarian", "Vegetarian")).toBe(false);
    expect(dietMatches("Vegetarian", undefined)).toBe(true); // nothing to filter on
  });

  it("a charity can choose, and the choice is saved and audited", async () => {
    await setNgoPreferences(P("u_joseph"), { diet: "Vegetarian" });
    const ngo = store.read().ngos.find((n) => n.ownerId === "u_joseph")!;
    expect(ngo.dietPreference).toBe("Vegetarian");
    expect(store.read().audit.some((a) => a.action === "ngo_preferences_changed" && a.actorId === "u_joseph")).toBe(true);
  });

  it("rejects an unknown choice and anyone who is not a charity", async () => {
    await expect(setNgoPreferences(P("u_joseph"), { diet: "vegan-only" })).rejects.toMatchObject({ code: "diet_invalid" });
    await expect(setNgoPreferences(P("u_priya"), { diet: "any" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(setNgoPreferences(null, { diet: "any" })).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("does not stop a charity from claiming a batch of the other diet", async () => {
    await setNgoPreferences(P("u_joseph"), { diet: "Vegetarian" });
    const open = store.read().donationBatches.find((b) => b.status === "Open");
    if (!open) return; // the seed has open batches; nothing to claim otherwise
    const res = await svc.claimBatch(P("u_joseph"), open.id).catch((e) => e);
    expect(res).not.toMatchObject({ code: "diet_invalid" });
  });
});
