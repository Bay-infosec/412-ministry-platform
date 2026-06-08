import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { SectionLabel } from "../../components/ui/index.js";

function splitZoomDisplay(zoomStr) {
  if (!zoomStr) return { main: zoomStr, sub: null };
  const parts = zoomStr.split("·").map((s) => s.trim());
  if (parts.length <= 1) return { main: zoomStr, sub: null };
  return { main: parts[0], sub: parts.slice(1).join(" · ") };
}

const AGENDA = [
  { title: "Case scenarios", body: "We will walk through real situations you are likely to face during the conference and practice how to respond." },
  { title: "Getting to know each other", body: "You will meet your fellow leaders before the event. Arriving knowing each other makes everything easier." },
  { title: "Deeper preparation", body: "We will go beyond the handbook — talking through what it actually feels like to lead, and how to stay grounded when things get hard." },
  { title: "God's word", body: "Our speaker will open the scripture with us. This is not just a training session — it is a time of spiritual preparation together." },
  { title: "Coordinator testimonies", body: "Our coordinators will share from their own experience — what they have learned from leading, and practical insights on each section of the handbook." },
  { title: "Open Q&A", body: "Anything on your mind — bring it. This is a space to ask, talk, and be heard before the conference begins." },
];

export default function ZoomTraining({ data, onBack }) {
  const { activeEvent } = data;
  const zoom = activeEvent?.zoom_training_dates ? splitZoomDisplay(activeEvent.zoom_training_dates) : null;

  return (
    <Shell>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", color: TSEC, fontSize: "14px", fontFamily: SANS, padding: "0 0 1.25rem", display: "flex", alignItems: "center", gap: 4 }}
      >
        ← Back
      </button>

      <div style={{ fontFamily: SANS, fontSize: "24px", fontWeight: 900, color: "#111111", letterSpacing: "-0.03em", marginBottom: 4 }}>
        Leader Zoom Training
      </div>
      <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1.5rem" }}>
        Mandatory for all team leaders before {activeEvent?.name || "the conference"}.
      </div>

      {zoom ? (
        <div style={{ background: "#111111", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>
            Scheduled Date & Time
          </div>
          <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: zoom.sub ? 4 : 0 }}>
            {zoom.main}
          </div>
          {zoom.sub && (
            <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, marginBottom: "0.75rem" }}>{zoom.sub}</div>
          )}
          <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS, lineHeight: 1.6 }}>
            Mark the last checklist item once you have attended. Your coordinator will also confirm attendance.
          </div>
        </div>
      ) : (
        <div style={{ background: "#FAFAFA", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS }}>
            Zoom training dates will be posted here when confirmed.
          </div>
        </div>
      )}

      <SectionLabel>What to Expect</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
        {AGENDA.map(({ title, body }, i) => (
          <div key={title} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: "#111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS }}>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#111111", fontFamily: SANS, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FFF5F0", border: "1px solid #FFD5C0", borderRadius: 12, padding: "1rem 1.25rem" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS, marginBottom: 4 }}>
          Mandatory attendance
        </div>
        <div style={{ fontSize: "12px", color: "#111111", fontFamily: SANS, lineHeight: 1.6 }}>
          The zoom training is required for all team leaders. If you cannot attend, please contact a coordinator as soon as possible.
        </div>
      </div>

      <div style={{ height: "2rem" }} />
    </Shell>
  );
}
