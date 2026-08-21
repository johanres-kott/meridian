import { describe, it, expect } from "vitest";
import {
  ME_ID, getMembers, memberName, ownerShare, normalizeOwners, withOwners,
  defaultOwnersFor, isSharedRow,
} from "../household.js";

const lotten = { id: "p1", name: "Lotten" };

describe("getMembers", () => {
  it("puts the account owner first with the display name", () => {
    const members = getMembers({ display_name: "Johan", household: { members: [lotten] } });
    expect(members).toEqual([{ id: "me", name: "Johan" }, lotten]);
  });

  it("falls back to 'Du' without a display name and to just me without a household", () => {
    expect(getMembers({})).toEqual([{ id: "me", name: "Du" }]);
    expect(getMembers(undefined)).toEqual([{ id: "me", name: "Du" }]);
  });

  it("drops malformed entries and a stray 'me' in the member list", () => {
    const members = getMembers({ household: { members: [null, { name: "utan id" }, { id: "me", name: "dubblett" }, lotten] } });
    expect(members).toEqual([{ id: "me", name: "Du" }, lotten]);
  });
});

describe("memberName", () => {
  const members = [{ id: ME_ID, name: "Johan" }, lotten];
  it("resolves names and labels unknown ids", () => {
    expect(memberName(members, "p1")).toBe("Lotten");
    expect(memberName(members, "me")).toBe("Johan");
    expect(memberName(members, "raderad")).toBe("Okänd person");
  });
});

describe("ownerShare", () => {
  it("reads the owners map when present", () => {
    const row = { metadata: { owners: { me: 60, p1: 40 } } };
    expect(ownerShare(row, "me")).toBe(60);
    expect(ownerShare(row, "p1")).toBe(40);
  });

  it("falls back to ownershipShare ?? 100 for me on rows without owners", () => {
    expect(ownerShare({ metadata: { ownershipShare: 50 } }, "me")).toBe(50);
    expect(ownerShare({ metadata: {} }, "me")).toBe(100);
    expect(ownerShare({}, "me")).toBe(100);
  });

  it("falls back to 0 for other members", () => {
    expect(ownerShare({ metadata: { ownershipShare: 50 } }, "p1")).toBe(0);
    expect(ownerShare({ metadata: { owners: { me: 50 } } }, "p1")).toBe(0);
  });

  it("clamps shares to 0–100", () => {
    expect(ownerShare({ metadata: { owners: { me: 150 } } }, "me")).toBe(100);
    expect(ownerShare({ metadata: { owners: { p1: -5 } } }, "p1")).toBe(0);
  });
});

describe("normalizeOwners", () => {
  it("clamps each share to 0–100 and drops non-numbers", () => {
    expect(normalizeOwners({ me: 120, p1: -10, p2: "abc" })).toEqual({ me: 100, p1: 0 });
  });

  it("scales an excess sum down proportionally to 100", () => {
    const out = normalizeOwners({ me: 80, p1: 80 });
    expect(out.me).toBe(50);
    expect(out.p1).toBe(50);
    const uneven = normalizeOwners({ me: 90, p1: 60 });
    expect(uneven.me).toBe(60);
    expect(uneven.p1).toBe(40);
  });

  it("leaves a sum below 100 untouched", () => {
    expect(normalizeOwners({ me: 30, p1: 20 })).toEqual({ me: 30, p1: 20 });
    expect(normalizeOwners()).toEqual({});
  });
});

describe("withOwners (dual-write)", () => {
  it("sets owners AND mirrors ownershipShare = owners.me", () => {
    const meta = withOwners({ address: "Storgatan 1" }, { me: 50, p1: 50 });
    expect(meta.owners).toEqual({ me: 50, p1: 50 });
    expect(meta.ownershipShare).toBe(50);
    expect(meta.address).toBe("Storgatan 1"); // övrig metadata orörd
  });

  it("mirrors 100 when me is missing from the map", () => {
    const meta = withOwners({}, { p1: 40 });
    expect(meta.ownershipShare).toBe(100);
  });

  it("mirrors the normalized value, not the raw input", () => {
    const meta = withOwners({}, { me: 80, p1: 80 });
    expect(meta.owners.me).toBe(50);
    expect(meta.ownershipShare).toBe(50);
  });

  it("overwrites a stale ownershipShare in the incoming metadata", () => {
    const meta = withOwners({ ownershipShare: 75 }, { me: 60, p1: 40 });
    expect(meta.ownershipShare).toBe(60);
  });
});

describe("defaultOwnersFor", () => {
  const members = [{ id: ME_ID, name: "Du" }, lotten];
  it("splits evenly across me + members for 'gemensam'", () => {
    expect(defaultOwnersFor("gemensam", members)).toEqual({ me: 50, p1: 50 });
  });

  it("uses whole percent with the remainder on the first members for three people", () => {
    const three = [...members, { id: "p2", name: "Barnet" }];
    const out = defaultOwnersFor("gemensam", three);
    expect(out).toEqual({ me: 34, p1: 33, p2: 33 });
    expect(Object.values(out).reduce((s, v) => s + v, 0)).toBe(100);
  });

  it("gives me 100 for 'enskild' and 'blandad' (blandad väljs per tillgång)", () => {
    expect(defaultOwnersFor("enskild", members)).toEqual({ me: 100 });
    expect(defaultOwnersFor("blandad", members)).toEqual({ me: 100 });
  });

  it("gives me 100 for gemensam when there is no one to share with", () => {
    expect(defaultOwnersFor("gemensam", [{ id: ME_ID, name: "Du" }])).toEqual({ me: 100 });
  });
});

describe("isSharedRow", () => {
  it("is true when my share is below 100 via owners or legacy ownershipShare", () => {
    expect(isSharedRow({ metadata: { owners: { me: 50, p1: 50 } } })).toBe(true);
    expect(isSharedRow({ metadata: { ownershipShare: 50 } })).toBe(true);
  });

  it("is false for full ownership and rows without any share data", () => {
    expect(isSharedRow({ metadata: { owners: { me: 100 } } })).toBe(false);
    expect(isSharedRow({ metadata: {} })).toBe(false);
    expect(isSharedRow({})).toBe(false);
  });
});
