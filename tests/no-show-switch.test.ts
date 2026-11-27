import { describe, expect, it } from "vitest";
import { noShowSuspensionOn } from "../lib/rules";

describe("automatic no-show suspension switch", () => {
  it("is off on the live demo site, on in tests, and can be turned on", () => {
    expect(noShowSuspensionOn({ NODE_ENV: "production" })).toBe(false);
    expect(noShowSuspensionOn({ NODE_ENV: "development" })).toBe(false);
    expect(noShowSuspensionOn({ NODE_ENV: "test" })).toBe(true);
    expect(noShowSuspensionOn({ NODE_ENV: "production", NO_SHOW_SUSPENSION: "on" })).toBe(true);
  });
});
