export const EVENT_TYPES = [
  { key: "youth_conference",  label: "Youth Conference",  color: "#EA580C", bg: "#FFF7ED" },
  { key: "annual_conference", label: "Annual Conference", color: "#7C3AED", bg: "#F5F3FF" },
  { key: "open_mic",          label: "Open Mic",          color: "#DB2777", bg: "#FDF2F8" },
  { key: "mission",           label: "Mission",           color: "#059669", bg: "#ECFDF5" },
  { key: "zoom_meeting",      label: "Zoom Meeting",      color: "#2563EB", bg: "#EFF6FF" },
  { key: "board_meeting",     label: "Board Meeting",     color: "#374151", bg: "#F3F4F6" },
];

export function getTypeConfig(type) {
  if (!type) return { label: "Event", color: "#8A8498", bg: "#F7F4EF" };
  const found = EVENT_TYPES.find((t) => t.key === type || t.label === type);
  return found || { label: type, color: "#8A8498", bg: "#F7F4EF" };
}
