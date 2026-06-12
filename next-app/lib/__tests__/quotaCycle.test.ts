import { describe, expect, it } from "vitest";
import {
  computeMonthlyCycleDates,
  isMonthlyQuotaExceededFromFields,
  monthlyCycleFieldsFromOnlineUser,
  monthlyCycleSummaryFromFields,
} from "@/lib/quotaCycle";

const GB = 1024 ** 3;

describe("isMonthlyQuotaExceededFromFields", () => {
  it("trusts the explicit exceeded flags first", () => {
    expect(isMonthlyQuotaExceededFromFields({ isMonthlyExceeded: 1 })).toBe(true);
    expect(isMonthlyQuotaExceededFromFields({ isMonthlyExceededComputed: true })).toBe(true);
  });

  it("compares usage to quota using big integers", () => {
    expect(
      isMonthlyQuotaExceededFromFields({ monthlyUsage: String(101 * GB), monthlyQuota: String(100 * GB) })
    ).toBe(true);
    expect(
      isMonthlyQuotaExceededFromFields({ monthlyUsage: String(99 * GB), monthlyQuota: String(100 * GB) })
    ).toBe(false);
  });

  it("treats zero/unlimited quota as never exceeded", () => {
    expect(isMonthlyQuotaExceededFromFields({ monthlyUsage: String(500 * GB), monthlyQuota: "0" })).toBe(false);
  });

  it("survives malformed values without throwing", () => {
    expect(isMonthlyQuotaExceededFromFields({ monthlyUsage: "not-a-number", monthlyQuota: "100" })).toBe(false);
  });
});

describe("computeMonthlyCycleDates", () => {
  it("uses the manual start date when present and adds one clamped month", () => {
    const r = computeMonthlyCycleDates(15, "2026-01-31");
    expect(r.cycleStart).toBe("2026-01-31");
    expect(r.cycleResetAt).toBe("2026-02-28"); // clamped: no Feb 31
  });

  it("starts this month when today is on/after the reset day", () => {
    const now = new Date("2026-06-20T10:00:00");
    const r = computeMonthlyCycleDates(15, null, now);
    expect(r.cycleStart).toBe("2026-06-15");
    expect(r.cycleResetAt).toBe("2026-07-15");
  });

  it("starts last month when today is before the reset day", () => {
    const now = new Date("2026-06-10T10:00:00");
    const r = computeMonthlyCycleDates(15, null, now);
    expect(r.cycleStart).toBe("2026-05-15");
    expect(r.cycleResetAt).toBe("2026-06-15");
  });

  it("rolls over year boundaries", () => {
    const now = new Date("2026-01-05T10:00:00");
    const r = computeMonthlyCycleDates(20, null, now);
    expect(r.cycleStart).toBe("2025-12-20");
    expect(r.cycleResetAt).toBe("2026-01-20");
  });

  it("clamps out-of-range reset days into 1..31", () => {
    const now = new Date("2026-06-10T10:00:00");
    expect(computeMonthlyCycleDates(0, null, now).cycleStart).toBe("2026-06-01");
    expect(computeMonthlyCycleDates(99, null, now).cycleStart).toBe("2026-05-31");
  });
});

describe("monthlyCycleSummaryFromFields", () => {
  it("computes pct from usage when no precomputed pct is given", () => {
    const s = monthlyCycleSummaryFromFields({
      monthlyUsage: String(50 * GB),
      monthlyQuota: String(100 * GB),
    });
    expect(s.pct).toBe(50);
    expect(s.exceeded).toBe(false);
  });

  it("caps pct at 100", () => {
    const s = monthlyCycleSummaryFromFields({
      monthlyUsage: String(250 * GB),
      monthlyQuota: String(100 * GB),
    });
    expect(s.pct).toBe(100);
    expect(s.exceeded).toBe(true);
  });

  it("prefers a precomputed pct", () => {
    const s = monthlyCycleSummaryFromFields({ monthlyUsage: "0", monthlyQuota: "0", monthlyUsagePct: 42 });
    expect(s.pct).toBe(42);
  });
});

describe("monthlyCycleFieldsFromOnlineUser", () => {
  it("maps snake_case accounting fields", () => {
    const f = monthlyCycleFieldsFromOnlineUser({
      monthly_usage: "123",
      profile_monthly_quota: "456",
      quota_reset_day: 10,
      is_monthly_exceeded: 0,
    });
    expect(f.monthlyUsage).toBe("123");
    expect(f.monthlyQuota).toBe("456");
    expect(f.quotaResetDay).toBe(10);
  });

  it("computes cycle dates as a fallback when API omits them", () => {
    const f = monthlyCycleFieldsFromOnlineUser({
      monthly_usage: "0",
      profile_monthly_quota: "0",
      quota_cycle_start_date: "2026-03-31",
    });
    expect(f.monthlyCycleStart).toBe("2026-03-31");
    expect(f.monthlyCycleResetAt).toBe("2026-04-30"); // clamped
  });
});
