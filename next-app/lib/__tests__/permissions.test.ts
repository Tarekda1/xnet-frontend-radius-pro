import { describe, expect, it } from "vitest";
import { can, canAll, canAny, getPermissions } from "@/lib/permissions";
import type { AuthUser } from "@/types/api";

const userWith = (permissions?: string[]): AuthUser =>
  ({ id: 1, username: "test", permissions } as unknown as AuthUser);

describe("getPermissions", () => {
  it("returns [] for null/undefined user", () => {
    expect(getPermissions(null)).toEqual([]);
    expect(getPermissions(undefined)).toEqual([]);
  });

  it("returns [] when permissions is missing or not an array", () => {
    expect(getPermissions(userWith(undefined))).toEqual([]);
    expect(getPermissions({ permissions: "users.view" } as unknown as AuthUser)).toEqual([]);
  });
});

describe("can", () => {
  it("matches exact permission strings only", () => {
    const u = userWith(["users.view", "invoices.pay"]);
    expect(can(u, "users.view")).toBe(true);
    expect(can(u, "users.manage")).toBe(false);
    expect(can(null, "users.view")).toBe(false);
  });
});

describe("canAny", () => {
  it("returns true for an empty requirement list (public)", () => {
    expect(canAny(null, [])).toBe(true);
    expect(canAny(userWith([]), [])).toBe(true);
  });

  it("returns true when at least one permission matches", () => {
    const u = userWith(["reseller.users.manage"]);
    expect(canAny(u, ["users.view", "reseller.users.manage"])).toBe(true);
    expect(canAny(u, ["users.view", "users.manage"])).toBe(false);
  });
});

describe("canAll", () => {
  it("requires every permission", () => {
    const u = userWith(["a", "b"]);
    expect(canAll(u, ["a", "b"])).toBe(true);
    expect(canAll(u, ["a", "b", "c"])).toBe(false);
  });

  it("is vacuously true for an empty list", () => {
    expect(canAll(null, [])).toBe(true);
  });
});
