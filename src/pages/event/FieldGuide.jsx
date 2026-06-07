import { useState } from "react";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card } from "../../components/ui/index.js";

const FILE_ID = "1VVARCRm2Rl9NkH7i0wzDot5KwJbN-dF7";
const FIELD_GUIDE_URL = `https://drive.google.com/file/d/${FILE_ID}/preview`;
const FIELD_GUIDE_DOWNLOAD = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

export default function FieldGuide({ data, onBack }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Shell withNav>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: TSEC,
        fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
        fontFamily: SANS, display: "block",
      }}>
        ‹ Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Field Guide
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          Your leader reference.
        </div>
      </div>

      {/* PDF viewer */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, marginBottom: "1rem" }}>
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0, background: BG,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
          }}>
            <div style={{
              width: 28, height: 28, border: `2.5px solid ${BORDER}`,
              borderTopColor: NAVY, borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
            <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Loading Field Guide...</span>
          </div>
        )}
        <iframe
          src={FIELD_GUIDE_URL}
          width="100%"
          height="600"
          allow="autoplay"
          style={{ display: "block", border: "none" }}
          onLoad={() => setLoaded(true)}
          title="Field Guide"
        />
      </div>

      {/* Open in Drive / Download */}
      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "0.75rem" }}>
          Save a copy to read offline anytime, even without internet.
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <a
            href={FIELD_GUIDE_DOWNLOAD}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: "block", padding: "11px", textAlign: "center",
              background: ORANGE, color: "#fff", borderRadius: 8,
              textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: SANS,
            }}
          >
            Download PDF
          </a>
          <a
            href={FIELD_GUIDE_URL.replace("/preview", "/view")}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: "block", padding: "11px", textAlign: "center",
              background: NAVY, color: "#fff", borderRadius: 8,
              textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: SANS,
            }}
          >
            Open in Drive
          </a>
        </div>
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
