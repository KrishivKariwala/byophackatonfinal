import { describe, expect, it } from "vitest";
import { buildSeed } from "../lib/seed";
import { ensureKitchen, KITCHEN_OWNER_NAME } from "../lib/seed-kitchen";
import { areaOf, restaurantOf, themeForRestaurant } from "../lib/kitchen-themes";

describe("restaurants are groups of outlets (test version)", () => {
  it("an outlet's restaurant and area come from its name", () => {
    expect(restaurantOf({ name: "Paris Panini · Indiranagar", address: "x" }, "Fallback")).toBe("Paris Panini");
    expect(areaOf({ name: "Paris Panini · Indiranagar", address: "x" })).toBe("Indiranagar");
    expect(restaurantOf({ name: "Koramangala", address: "x" }, "Crumb & Co.")).toBe("Crumb & Co.");
    expect(areaOf({ address: "12 Main Rd" })).toBe("12 Main Rd");
  });
  it("only Paris Panini has a look so far; the others are plain", () => {
    expect(themeForRestaurant("Paris Panini")?.id).toBe("paris-panini");
    expect(themeForRestaurant("Smash Guys")).toBeNull();
    expect(themeForRestaurant("The Pizza Bakery")).toBeNull();
  });
  it("the demo owner gets three restaurants with outlets, and running it again changes nothing", () => {
    const db = buildSeed(Date.now()); ensureKitchen(db, Date.now());
    const mine = db.outlets.filter((o) => o.vendorId === "v_paris");
    const restaurants = [...new Set(mine.map((o) => restaurantOf(o, "?")))];
    expect(restaurants).toEqual(["Paris Panini", "Smash Guys", "The Pizza Bakery"]);
    expect(mine.map((o) => o.id)).toEqual(["o_paris_1", "o_paris_2", "o_smash_1", "o_smash_2", "o_pita_1", "o_pita_2"]);
    expect(db.profiles.find((p) => p.id === "u_paris")?.name).toBe(KITCHEN_OWNER_NAME);
    const counts = [db.profiles.length, db.vendors.length, db.outlets.length, db.memberships.length];
    ensureKitchen(db, Date.now());
    expect([db.profiles.length, db.vendors.length, db.outlets.length, db.memberships.length]).toEqual(counts);
  });
  it("a store that still has the old name for the third restaurant is renamed, not duplicated", () => {
    const db = buildSeed(Date.now()); ensureKitchen(db, Date.now());
    for (const o of db.outlets.filter((x) => x.id.startsWith("o_pita_"))) o.name = o.name!.replace("The Pizza Bakery", "Pita Bakery");
    ensureKitchen(db, Date.now());
    const names = db.outlets.filter((o) => o.id.startsWith("o_pita_")).map((o) => o.name);
    expect(names).toEqual(["The Pizza Bakery · Jayanagar", "The Pizza Bakery · Whitefield"]);
    expect(db.outlets.filter((o) => o.vendorId === "v_paris")).toHaveLength(6);
  });
  it("a store written by the earlier version (one restaurant, old owner name) is topped up", () => {
    const db = buildSeed(Date.now()); ensureKitchen(db, Date.now());
    db.outlets = db.outlets.filter((o) => !/smash|pita/.test(o.id)); db.profiles.find((p) => p.id === "u_paris")!.name = "Marc (Demo vendor)";
    ensureKitchen(db, Date.now());
    expect(db.outlets.filter((o) => o.vendorId === "v_paris")).toHaveLength(6);
    expect(db.profiles.find((p) => p.id === "u_paris")?.name).toBe(KITCHEN_OWNER_NAME);
  });
});
