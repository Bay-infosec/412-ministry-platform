import { describe, expect, it } from "vitest";
import { getChecklistProgress, getMemberReadiness } from "../lib/readiness.js";

function member(overrides = {}) {
  return {
    profiles: { last_seen_at: null },
    onboarding_visited: false,
    onboarding_completed: false,
    onboarding_step: 0,
    event_checklist: { items: {} },
    ...overrides,
  };
}

describe("getChecklistProgress", () => {
  it("counts only completed checklist items", () => {
    const progress = getChecklistProgress(member({
      event_checklist: {
        items: {
          finished_onboarding: true,
          read_field_guide: true,
          connected_with_coleader: false,
        },
      },
    }));

    expect(progress).toEqual({ done: 2, total: 4 });
  });

  it("supports the array shape returned by a joined Supabase relation", () => {
    const progress = getChecklistProgress(member({
      event_checklist: [{ items: { finished_onboarding: true } }],
    }));

    expect(progress.done).toBe(1);
  });
});

describe("getMemberReadiness", () => {
  it("shows no login when there is no activity", () => {
    expect(getMemberReadiness(member()).key).toBe("no_login");
  });

  it("shows not started after login but before onboarding activity", () => {
    expect(getMemberReadiness(member({
      profiles: { last_seen_at: "2026-06-10T12:00:00Z" },
    })).key).toBe("not_started");
  });

  it("shows saved checklist progress even when onboarding_visited is stale", () => {
    const state = getMemberReadiness(member({
      profiles: { last_seen_at: "2026-06-10T12:00:00Z" },
      event_checklist: {
        items: {
          finished_onboarding: true,
          read_field_guide: true,
        },
      },
    }));

    expect(state.key).toBe("in_progress");
    expect(state.progress.done).toBe(2);
  });

  it("treats later onboarding steps and completed onboarding as started", () => {
    expect(getMemberReadiness(member({ onboarding_step: 3 })).key).toBe("in_progress");
    expect(getMemberReadiness(member({ onboarding_completed: true })).key).toBe("in_progress");
  });

  it("shows ready only when all checklist items are complete", () => {
    const state = getMemberReadiness(member({
      event_checklist: {
        items: {
          finished_onboarding: true,
          read_field_guide: true,
          connected_with_coleader: true,
          ready_for_zoom: true,
        },
      },
    }));

    expect(state.key).toBe("ready");
  });
});
