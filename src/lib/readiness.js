import { CHECKLIST_ITEMS } from "./checklist.js";

export function getChecklistProgress(member) {
  const items = Array.isArray(member?.event_checklist)
    ? member.event_checklist[0]?.items
    : member?.event_checklist?.items;
  const values = items || {};

  return {
    done: CHECKLIST_ITEMS.filter((item) => values[item.id] === true).length,
    total: CHECKLIST_ITEMS.length,
  };
}

export function getMemberReadiness(member) {
  const progress = getChecklistProgress(member);
  const onboardingStep = Number(member?.onboarding_step || 0);
  const hasStarted = progress.done > 0
    || member?.onboarding_visited === true
    || member?.onboarding_completed === true
    || onboardingStep > 1;

  if (progress.total > 0 && progress.done === progress.total) {
    return { key: "ready", label: "Ready", progress };
  }
  if (hasStarted) {
    return { key: "in_progress", label: "In progress", progress };
  }
  if (!member?.profiles?.last_seen_at) {
    return { key: "no_login", label: "No login", progress };
  }
  return { key: "not_started", label: "Not started", progress };
}
