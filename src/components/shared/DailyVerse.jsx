import { useState, useEffect } from "react";
import { SANS } from "../../lib/constants.js";

export default function DailyVerse() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerse();
  }, []);

  const fetchVerse = async () => {
    try {
      const res = await fetch(
        "https://beta.ourmanna.com/api/v1/get?format=json&order=daily"
      );
      const data = await res.json();
      setVerse({
        text: data.verse?.details?.text,
        reference: data.verse?.details?.reference,
      });
    } catch {
      setVerse({
        text: "Set an example for the believers in speech, in conduct, in love, in faith and in purity.",
        reference: "1 Timothy 4:12",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: 16, marginBottom: "1rem", minHeight: 80 }} />
    );
  }

  if (!verse?.text) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.14em",
          color: "#FF4D00",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
          fontFamily: SANS,
        }}
      >
        Daily Verse
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: "14px",
          fontStyle: "italic",
          color: "#1B2A4A",
          lineHeight: 1.75,
          marginBottom: "0.625rem",
        }}
      >
        "{verse.text}"
      </div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.06em",
          color: "#FF4D00",
          textTransform: "uppercase",
          fontFamily: SANS,
        }}
      >
        {verse.reference}
      </div>
    </div>
  );
}
