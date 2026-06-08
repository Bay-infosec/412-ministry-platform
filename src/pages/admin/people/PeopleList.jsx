import { useState } from "react";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Avatar, Badge } from "../../../components/ui/index.js";

export default function PeopleList({ data, onSelect }) {
  const { allProfiles } = data;
  const [query, setQuery] = useState("");

  const filtered = (allProfiles || []).filter((p) => {
    const q = query.toLowerCase();
    if (!q) return true;
    const church = p.churches?.name || "";
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      church.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or church…"
          style={{
            width: "100%", padding: "12px 14px 12px 40px",
            border: `1px solid ${BORDER}`, borderRadius: 12,
            fontSize: "15px", fontFamily: SANS, color: "#1B2A4A",
            background: "#fff", outline: "none", boxSizing: "border-box",
          }}
        />
        <svg
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: "0.75rem" }}>
        {filtered.length} {filtered.length === 1 ? "person" : "people"}
        {query ? ` matching "${query}"` : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: "0.875rem 1rem", cursor: "pointer", width: "100%", textAlign: "left",
            }}
          >
            <Avatar url={p.photo_url} name={p.full_name} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "15px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {p.full_name}
              </div>
              <div style={{
                fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {p.email}{p.churches?.name ? ` · ${p.churches.name}` : ""}
              </div>
            </div>
            <Badge variant={p.platform_role} />
          </button>
        ))}
      </div>
    </div>
  );
}
