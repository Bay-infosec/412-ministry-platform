import { useState, useEffect } from "react";
import { NAVY, GOLD, TSEC, SERIF, SANS } from "../../lib/constants.js";

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

  if (loading) return null;
  if (!verse?.text) return null;

  return (
    <div
      style={{
        background: NAVY,
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: GOLD,
          textTransform: "uppercase",
          marginBottom: "0.75rem",
          fontFamily: SANS,
        }}
      >
        Daily Verse
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: "15px",
          fontStyle: "italic",
          color: "#fff",
          lineHeight: 1.75,
          marginBottom: "0.75rem",
        }}
      >
        "{verse.text}"
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: GOLD,
          fontFamily: SANS,
        }}
      >
        {verse.reference}
      </div>
    </div>
  );
}
