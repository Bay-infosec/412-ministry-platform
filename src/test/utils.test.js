import { describe, it, expect } from "vitest";
import {
  fmtPhone,
  formatPhoneInput,
  validatePassword,
  matchesAudience,
  generateTempPassword,
  fmtDateStr,
} from "../lib/utils.js";

// ── fmtPhone ──────────────────────────────────────────────────────────────────

describe("fmtPhone", () => {
  it("formats a 10-digit number", () => {
    expect(fmtPhone("6265551234")).toBe("(626)555-1234");
  });

  it("strips leading country code 1 from 11-digit number", () => {
    expect(fmtPhone("16265551234")).toBe("(626)555-1234");
  });

  it("returns raw value when number cannot be formatted", () => {
    expect(fmtPhone("12345")).toBe("12345");
  });

  it("handles null/undefined gracefully", () => {
    expect(fmtPhone(null)).toBe("");
    expect(fmtPhone(undefined)).toBe("");
  });
});

// ── formatPhoneInput ──────────────────────────────────────────────────────────

describe("formatPhoneInput", () => {
  it("formats as user types — area code only", () => {
    expect(formatPhoneInput("626")).toBe("(626");
  });

  it("formats as user types — area + prefix", () => {
    expect(formatPhoneInput("626555")).toBe("(626)555");
  });

  it("formats complete 10-digit input", () => {
    expect(formatPhoneInput("6265551234")).toBe("(626)555-1234");
  });

  it("strips non-numeric characters", () => {
    expect(formatPhoneInput("(626) 555-1234")).toBe("(626)555-1234");
  });

  it("strips leading country code 1", () => {
    expect(formatPhoneInput("16265551234")).toBe("(626)555-1234");
  });

  it("caps at 10 digits", () => {
    expect(formatPhoneInput("62655512349999")).toBe("(626)555-1234");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhoneInput("")).toBe("");
  });
});

// ── validatePassword ──────────────────────────────────────────────────────────

describe("validatePassword", () => {
  it("accepts a valid password", () => {
    expect(validatePassword("Grace742!")).toBeNull();
  });

  it("rejects password under 8 characters", () => {
    expect(validatePassword("Ab1!")).toMatch(/at least 8/);
  });

  it("rejects password with no uppercase letter", () => {
    expect(validatePassword("grace742!")).toMatch(/capital/);
  });

  it("rejects password with no number", () => {
    expect(validatePassword("GraceFaith!")).toMatch(/number/);
  });

  it("rejects password with no special character", () => {
    expect(validatePassword("Grace7421")).toMatch(/special/);
  });
});

// ── matchesAudience ───────────────────────────────────────────────────────────

describe("matchesAudience", () => {
  const ctx = { id: "u1", ministry: "EM", team_number: 3, event_role: "leader" };

  it("returns true for empty/null audience (broadcast)", () => {
    expect(matchesAudience(null, ctx)).toBe(true);
    expect(matchesAudience([], ctx)).toBe(true);
  });

  it("matches 'all' rule", () => {
    expect(matchesAudience([{ type: "all" }], ctx)).toBe(true);
  });

  it("matches correct ministry", () => {
    expect(matchesAudience([{ type: "ministry", value: "EM" }], ctx)).toBe(true);
  });

  it("does not match wrong ministry", () => {
    expect(matchesAudience([{ type: "ministry", value: "MM" }], ctx)).toBe(false);
  });

  it("matches correct team number (string comparison)", () => {
    expect(matchesAudience([{ type: "team", value: "3" }], ctx)).toBe(true);
    expect(matchesAudience([{ type: "team", value: 3 }], ctx)).toBe(true);
  });

  it("does not match wrong team", () => {
    expect(matchesAudience([{ type: "team", value: "5" }], ctx)).toBe(false);
  });

  it("matches correct event role", () => {
    expect(matchesAudience([{ type: "role", value: "leader" }], ctx)).toBe(true);
  });

  it("matches specific person by id", () => {
    expect(matchesAudience([{ type: "person", value: "u1" }], ctx)).toBe(true);
    expect(matchesAudience([{ type: "person", value: "u2" }], ctx)).toBe(false);
  });

  it("returns false for unknown rule type", () => {
    expect(matchesAudience([{ type: "unknown", value: "x" }], ctx)).toBe(false);
  });

  it("returns true when any rule in list matches (OR logic)", () => {
    expect(matchesAudience(
      [{ type: "ministry", value: "MM" }, { type: "ministry", value: "EM" }],
      ctx
    )).toBe(true);
  });
});

// ── generateTempPassword ──────────────────────────────────────────────────────

describe("generateTempPassword", () => {
  it("generates a password that passes validatePassword", () => {
    for (let i = 0; i < 20; i++) {
      expect(validatePassword(generateTempPassword())).toBeNull();
    }
  });

  it("generates different passwords each time (probabilistic)", () => {
    const passwords = new Set(Array.from({ length: 10 }, generateTempPassword));
    expect(passwords.size).toBeGreaterThan(1);
  });
});

// ── fmtDateStr ────────────────────────────────────────────────────────────────

describe("fmtDateStr", () => {
  it("formats an ISO date string", () => {
    expect(fmtDateStr("2026-08-05")).toMatch(/Aug 5, 2026/);
  });

  it("returns empty string for invalid input", () => {
    expect(fmtDateStr("not-a-date")).toBe("");
  });
});
