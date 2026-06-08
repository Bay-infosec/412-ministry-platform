import { supabase } from "../../lib/supabase.js";
import { fmtDateStr } from "../../lib/utils.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel } from "../../components/ui/index.js";

export default function Updates({ data, readIds, onMarkRead, onOpenAdmin }) {
  const { announcements } = data;

  const markRead = async (annId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase
        .from("announcement_reads")
        .insert({ announcement_id: annId, profile_id: user.id });
      onMarkRead(annId);
    } catch {}
  };

  return (
    <Shell withNav>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <SectionLabel>412 Ministry</SectionLabel>
          <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em" }}>
            Updates
          </div>
        </div>
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            style={{
              background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 14px", fontSize: "13px", fontWeight: 700,
              fontFamily: SANS, cursor: "pointer", flexShrink: 0,
            }}
          >
            Manage
          </button>
        )}
      </div>

      {(announcements || []).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: TSEC,
            fontSize: "14px",
            marginTop: "3rem",
            fontFamily: SANS,
          }}
        >
          No announcements yet. Check back soon.
        </div>
      ) : (
        (announcements || []).map((a) => {
          const isUnread = !(readIds || []).includes(a.id);
          return (
            <Card
              key={a.id}
              style={{
                marginBottom: "1rem",
                border: `1px solid ${isUnread ? "#FF4D00" : BORDER}`,
                borderLeft: isUnread ? "3px solid #FF4D00" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
                  {fmtDateStr(a.created_at)}
                </div>
                {isUnread && (
                  <div
                    style={{
                      background: "#FF4D00",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: 99,
                      padding: "2px 8px",
                      fontFamily: SANS,
                    }}
                  >
                    NEW
                  </div>
                )}
              </div>
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    marginBottom: "0.75rem",
                    objectFit: "cover",
                    maxHeight: 200,
                  }}
                />
              )}
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#1B2A4A",
                  marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#3A3A3A",
                  lineHeight: 1.65,
                  whiteSpace: "pre-line",
                  marginBottom: isUnread ? "1rem" : 0,
                  fontFamily: SANS,
                }}
              >
                {a.body}
              </div>
              {isUnread && (
                <button
                  onClick={() => markRead(a.id)}
                  style={{
                    background: "none",
                    border: `1px solid ${BORDER}`,
                    color: TSEC,
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: SANS,
                  }}
                >
                  Mark as read
                </button>
              )}
            </Card>
          );
        })
      )}
    </Shell>
  );
}
