import { describe, it, expect } from "vitest";
import { getTypeConfig, EVENT_TYPES } from "../lib/eventTypes.js";

describe("getTypeConfig", () => {
  it("returns correct config for known type key", () => {
    const cfg = getTypeConfig("mission");
    expect(cfg.label).toBe("Mission");
    expect(cfg.color).toBeTruthy();
    expect(cfg.bg).toBeTruthy();
  });

  it("returns correct config for every defined type", () => {
    for (const t of EVENT_TYPES) {
      const cfg = getTypeConfig(t.key);
      expect(cfg.label).toBe(t.label);
      expect(cfg.color).toBe(t.color);
    }
  });

  it("returns fallback for unknown type", () => {
    const cfg = getTypeConfig("unknown_event");
    expect(cfg.label).toBe("unknown_event");
    expect(cfg.color).toBeTruthy();
  });

  it("returns fallback for null/undefined type", () => {
    const cfg = getTypeConfig(null);
    expect(cfg.label).toBe("Event");
    const cfg2 = getTypeConfig(undefined);
    expect(cfg2.label).toBe("Event");
  });
});
