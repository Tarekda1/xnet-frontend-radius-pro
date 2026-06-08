/** Display helpers for monthly quota cycle fields on users. */
import { formatBytes, parseMysqlBool } from "@/lib/utils";
import type { User } from "@/types/api";

export function formatQuotaUsage(used: string | number | bigint | undefined, limit: string | number | bigint | undefined): string {
  const usedN = BigInt(String(used ?? "0"));
  const limitN = BigInt(String(limit ?? "0"));
  return `${formatBytes(Number(usedN))} / ${formatBytes(Number(limitN))}`;
}

export function isMonthlyQuotaExceeded(user: User): boolean {
  if (parseMysqlBool(user.isMonthlyExceeded)) return true;
  if (user.isMonthlyExceededComputed) return true;
  try {
    const used = BigInt(String(user.monthlyUsage ?? "0"));
    const limit = BigInt(String(user.profile?.monthlyQuota ?? "0"));
    return limit > BigInt(0) && used > limit;
  } catch {
    return false;
  }
}

export function formatCycleResetDate(isoDate: string | Date | null | undefined): string {
  if (isoDate == null) return "—";
  if (isoDate instanceof Date) {
    if (Number.isNaN(isoDate.getTime())) return "—";
    return isoDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  const s = String(isoDate).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(`${s.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function normalizeDateOnly(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function safeIntDayOfMonth(input: unknown): number {
  const n = typeof input === "number" ? input : parseInt(String(input ?? ""), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(31, Math.max(1, Math.floor(n)));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatYyyyMmDd(year: number, month: number, day: number): string {
  const d = Math.min(day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addMonthsClamped(yyyyMmDd: string, months: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map((x) => parseInt(x, 10));
  let month = m - 1 + months;
  const year = y + Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;
  const day = Math.min(d, daysInMonth(year, month + 1));
  return formatYyyyMmDd(year, month + 1, day);
}

/** Client-side fallback when API omits cycle dates (matches backend quotaCycle.ts). */
export function computeMonthlyCycleDates(
  resetDay: number | null | undefined,
  manualStartDate: string | Date | null | undefined,
  now = new Date()
): { cycleStart: string; cycleResetAt: string } {
  if (manualStartDate) {
    const start = normalizeDateOnly(manualStartDate)!;
    return { cycleStart: start, cycleResetAt: addMonthsClamped(start, 1) };
  }

  const day = safeIntDayOfMonth(resetDay ?? 1);
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const todayDay = now.getDate();

  let startYear = yyyy;
  let startMonth = mm;
  if (todayDay < day) {
    startMonth -= 1;
    if (startMonth < 1) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  const cycleStart = formatYyyyMmDd(startYear, startMonth, day);
  return { cycleStart, cycleResetAt: addMonthsClamped(cycleStart, 1) };
}

export type MonthlyCycleFields = {
  monthlyUsage?: string | number | null;
  monthlyQuota?: string | number | null;
  monthlyCycleStart?: string | null;
  monthlyCycleResetAt?: string | null;
  quotaResetDay?: number | null;
  quotaCycleStartDate?: string | null;
  isMonthlyExceeded?: number | boolean | null;
  isMonthlyExceededComputed?: boolean;
  monthlyUsagePct?: number;
};

function computePct(used: string | number | bigint | undefined, limit: string | number | bigint | undefined): number {
  try {
    const usedN = BigInt(String(used ?? "0"));
    const limitN = BigInt(String(limit ?? "0"));
    if (limitN <= BigInt(0)) return 0;
    return Math.min(100, Number((usedN * BigInt(100)) / limitN));
  } catch {
    return 0;
  }
}

export function isMonthlyQuotaExceededFromFields(fields: MonthlyCycleFields): boolean {
  if (parseMysqlBool(fields.isMonthlyExceeded)) return true;
  if (fields.isMonthlyExceededComputed) return true;
  try {
    const used = BigInt(String(fields.monthlyUsage ?? "0"));
    const limit = BigInt(String(fields.monthlyQuota ?? "0"));
    return limit > BigInt(0) && used > limit;
  } catch {
    return false;
  }
}

export function monthlyCycleSummaryFromFields(fields: MonthlyCycleFields): {
  usageLabel: string;
  resetLabel: string;
  exceeded: boolean;
  pct: number;
} {
  const exceeded = isMonthlyQuotaExceededFromFields(fields);
  const pct =
    typeof fields.monthlyUsagePct === "number"
      ? fields.monthlyUsagePct
      : computePct(fields.monthlyUsage ?? "0", fields.monthlyQuota ?? "0");
  return {
    usageLabel: formatQuotaUsage(fields.monthlyUsage ?? "0", fields.monthlyQuota ?? "0"),
    resetLabel: formatCycleResetDate(fields.monthlyCycleResetAt),
    exceeded,
    pct,
  };
}

type MonthlyCycleUserSource = Partial<{
  monthly_usage: string;
  monthlyUsage: string;
  profile_monthly_quota: string;
  profileMonthlyQuota: string;
  monthly_cycle_start: string | null;
  monthlyCycleStart: string | null;
  monthly_cycle_reset_at: string | null;
  monthlyCycleResetAt: string | null;
  quota_reset_day: number | null;
  quotaResetDay: number | null;
  quota_cycle_start_date: string | null;
  quotaCycleStartDate: string | null;
  is_monthly_exceeded: number | boolean | null;
  isMonthlyExceeded: number | boolean | null;
  monthly_usage_pct: number;
  monthlyUsagePct: number;
}>;

export function monthlyCycleFieldsFromOnlineUser(u: MonthlyCycleUserSource): MonthlyCycleFields {
  const monthlyUsage = (u.monthly_usage ?? u.monthlyUsage) as string | undefined;
  const monthlyQuota = (u.profile_monthly_quota ?? u.profileMonthlyQuota) as string | undefined;
  const quotaResetDayRaw = u.quota_reset_day ?? u.quotaResetDay;
  const quotaResetDay =
    quotaResetDayRaw == null || String(quotaResetDayRaw).trim() === ""
      ? null
      : Number(quotaResetDayRaw);
  const manualStart = normalizeDateOnly(u.quota_cycle_start_date ?? u.quotaCycleStartDate);
  let monthlyCycleStart = normalizeDateOnly(u.monthly_cycle_start ?? u.monthlyCycleStart);
  let monthlyCycleResetAt = normalizeDateOnly(u.monthly_cycle_reset_at ?? u.monthlyCycleResetAt);

  if (!monthlyCycleResetAt && (manualStart || quotaResetDay != null)) {
    const computed = computeMonthlyCycleDates(quotaResetDay, manualStart);
    monthlyCycleStart = monthlyCycleStart ?? computed.cycleStart;
    monthlyCycleResetAt = computed.cycleResetAt;
  }

  const monthlyUsagePctRaw = u.monthly_usage_pct ?? u.monthlyUsagePct;

  return {
    monthlyUsage,
    monthlyQuota,
    monthlyCycleStart,
    monthlyCycleResetAt,
    quotaResetDay: Number.isFinite(quotaResetDay) ? quotaResetDay : null,
    quotaCycleStartDate: manualStart,
    isMonthlyExceeded: (u.is_monthly_exceeded ?? u.isMonthlyExceeded) as number | boolean | null,
    monthlyUsagePct:
      typeof monthlyUsagePctRaw === "number"
        ? monthlyUsagePctRaw
        : monthlyUsagePctRaw != null
          ? Number(monthlyUsagePctRaw)
          : undefined,
  };
}

export function monthlyCycleSummary(user: User): {
  usageLabel: string;
  resetLabel: string;
  exceeded: boolean;
  pct: number;
} {
  return monthlyCycleSummaryFromFields({
    monthlyUsage: user.monthlyUsage,
    monthlyQuota: user.profile?.monthlyQuota,
    monthlyCycleStart: user.monthlyCycleStart,
    monthlyCycleResetAt: user.monthlyCycleResetAt,
    quotaResetDay: user.quotaResetDay,
    quotaCycleStartDate: user.quotaCycleStartDate,
    isMonthlyExceeded: user.isMonthlyExceeded,
    isMonthlyExceededComputed: user.isMonthlyExceededComputed,
    monthlyUsagePct: user.monthlyUsagePct,
  });
}
