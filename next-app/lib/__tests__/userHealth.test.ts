import { describe, expect, it } from "vitest";
import { getUserHealth, isUserAtRisk } from "@/lib/userHealth";
import type { User } from "@/types/api";

const baseUser = (overrides: Record<string, unknown> = {}): User =>
  ({
    accountStatus: "active",
    isOnline: true,
    isMonthlyExceeded: false,
    macAddress: { macAddress: "AA:BB:CC:DD:EE:FF" },
    userDetails: { email: "x@y.z", phoneNumber: "123" },
    ...overrides,
  } as unknown as User);

describe("getUserHealth", () => {
  it("is healthy when active, online, bound MAC and contact info present", () => {
    const h = getUserHealth(baseUser());
    expect(h.level).toBe("healthy");
  });

  it("flags suspended accounts as risk", () => {
    const h = getUserHealth(baseUser({ accountStatus: "Suspended" }));
    expect(h.level).toBe("risk");
    expect(h.reason).toMatch(/suspended/i);
  });

  it("flags monthly quota exceeded as risk even when active", () => {
    const h = getUserHealth(baseUser({ isMonthlyExceeded: true }));
    expect(h.level).toBe("risk");
    expect(h.reason).toMatch(/quota/i);
  });

  it("warns for inactive accounts", () => {
    expect(getUserHealth(baseUser({ accountStatus: "inactive" })).level).toBe("warning");
  });

  it("warns when no MAC address is bound", () => {
    const h = getUserHealth(baseUser({ macAddress: { macAddress: "  " } }));
    expect(h.level).toBe("warning");
    expect(h.reason).toMatch(/mac/i);
  });

  it("warns when contact info is missing", () => {
    const h = getUserHealth(baseUser({ userDetails: { email: "", phoneNumber: "" } }));
    expect(h.level).toBe("warning");
    expect(h.reason).toMatch(/contact/i);
  });

  it("accepts phone-only contact info", () => {
    const h = getUserHealth(baseUser({ userDetails: { email: "", phoneNumber: "70123456" } }));
    expect(h.level).toBe("healthy");
  });

  it("warns when offline", () => {
    const h = getUserHealth(baseUser({ isOnline: false }));
    expect(h.level).toBe("warning");
    expect(h.reason).toMatch(/offline/i);
  });
});

describe("isUserAtRisk", () => {
  it("treats anything non-healthy as at risk", () => {
    expect(isUserAtRisk(baseUser())).toBe(false);
    expect(isUserAtRisk(baseUser({ isOnline: false }))).toBe(true);
    expect(isUserAtRisk(baseUser({ accountStatus: "suspended" }))).toBe(true);
  });
});
