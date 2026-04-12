import type { User } from "@/types/api";

export type UserHealthLevel = "healthy" | "warning" | "risk";

export type UserHealthState = {
  level: UserHealthLevel;
  label: string;
  reason: string;
};

export function getUserHealth(user: User): UserHealthState {
  const status = String(user.accountStatus ?? "").toLowerCase();
  const hasMacAddress = Boolean(String(user.macAddress?.macAddress ?? "").trim());
  const hasContactInfo = Boolean(
    String(user.userDetails?.email ?? "").trim() ||
      String(user.userDetails?.phoneNumber ?? "").trim()
  );
  const monthlyExceeded = Boolean(user.isMonthlyExceeded);

  if (status === "suspended" || monthlyExceeded) {
    const reason = status === "suspended" ? "Account is suspended" : "Monthly quota exceeded";
    return { level: "risk", label: "Risk", reason };
  }

  if (status === "inactive" || !hasMacAddress || !hasContactInfo || !user.isOnline) {
    if (status === "inactive") return { level: "warning", label: "Warning", reason: "Account is inactive" };
    if (!hasMacAddress) return { level: "warning", label: "Warning", reason: "No MAC address bound" };
    if (!hasContactInfo) return { level: "warning", label: "Warning", reason: "Missing contact info" };
    return { level: "warning", label: "Warning", reason: "Currently offline" };
  }

  return { level: "healthy", label: "Healthy", reason: "No immediate issues detected" };
}

export function isUserAtRisk(user: User): boolean {
  return getUserHealth(user).level !== "healthy";
}
