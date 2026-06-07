import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card } from "../../components/ui/index.js";

const FOUR = [
  {
    symbol: "♥",
    title: "God Loves You",
    body: "God loves you and created you for a relationship with Him. His love goes deeper than anything, no matter where you have been.",
    color: ORANGE,
  },
  {
    symbol: "÷",
    title: "Sin Has Separated Us",
    body: "The top dot is God. The bottom dot is us. The line between them is sin — the reality that we have all gone our own way.",
    color: NAVY,
  },
  {
    symbol: "✝",
    title: "Jesus Is the Bridge",
    body: "God did not leave us there. Jesus came, paid the price we could not pay, died on the cross, and rose again.",
    color: NAVY,
  },
  {
    symbol: "?",
    title: "Each Person Must Respond",
    body: "Jesus gave everything, but the response belongs to each person. Will you choose to follow Him?",
    color: ORANGE,
  },
];

const PRAYER = `Lord Jesus, thank you that you died for me.

I am sorry for the things in my life that have gone wrong. Please forgive me and make me clean. I turn away from everything I know is wrong.

Thank you that you rose again so I could know you. Please come into my life. I want to follow you.

Amen.`;

export default function TheFour({ data, onBack }) {
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
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          The Four
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Sharing the gospel.
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          When the moment feels right, The Four gives you a simple way to walk someone through the gospel. Study it before the conference so it feels natural when the moment comes.
        </div>
      </div>

      {/* The four cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {FOUR.map((item, i) => (
          <Card key={i} style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: item.color === ORANGE ? "#FEF0E7" : BG,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", color: item.color,
              }}>
                {item.symbol}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: NAVY, fontFamily: SANS, marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
                  {item.body}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Prayer of response */}
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.75rem" }}>
        A Prayer of Response
      </div>
      <Card style={{ padding: "1.25rem", marginBottom: "1rem", background: NAVY }}>
        <div style={{
          fontFamily: SERIF, fontSize: "16px", color: "#f0ece4",
          lineHeight: 1.85, whiteSpace: "pre-wrap", textAlign: "center", fontStyle: "italic",
        }}>
          {PRAYER}
        </div>
      </Card>

      {/* Note */}
      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>
          Important
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          Do not rush the moment. Remind them gently that this prayer is not what saves them — Jesus is. But it is their way of responding to what He has already done. It needs to come from their own heart.
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginTop: 8 }}>
          After they respond — tell your co-leader that same day and follow up personally with them the next morning.
        </div>
      </Card>

      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
