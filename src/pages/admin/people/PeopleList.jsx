import { useState } from "react";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Avatar } from "../../../components/ui/index.js";

const ROLE_FILTERS = [
  { value: "all",       label: "All" },
  { value: "admin",     label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "member",    label: "Member" },
];

const TAG_FILTERS = [
  { value: "board_member", label: "412 Board" },
  { value: "pastor",       label: "Pastor" },
];

const ROLE_BADGE = {
  admin:     { bg: "#111", color: "#FF4D00" },
  moderator: { bg: "#F0F0F0", color: "#111" },
  member:    { bg: "#F0F0F0", color: "#888" },
};

export default function PeopleList({ data, onSelect }) {
  const { allProfiles } = data;
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tagFilters, setTagFilters] = useState(new Set());

  function toggleTag(tag) {
    setTagFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) { next.delete(tag); } else { next.add(tag); }
      return next;
    });
  }

  const filtered = (allProfiles || []).filter((p) => {
    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      const church = p.churches?.name || "";
      const match = p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || church.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Role filter
    if (roleFilter !== "all" && p.platform_role !== roleFilter) return false;
    // Tag filters
    if (tagFilters.size > 0) {
      const pTags = new Set(p.tags || []);
      for (const t of tagFilters) {
        if (!pTags.has(t)) return false;
      }
    }
    return true;
  });

  const hasFilters = roleFilter !== "all" || tagFilters.size > 0 || query.trim();

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "0.75rem", position: "relative" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or church…"
          style={{
            width: "100%", padding: "11px 14px 11px 40px",
            border: `1px solid ${BORDER}`, borderRadius: 12,
            fontSize: "14px", fontFamily: SANS, color: "#111",
            background: "#fff", outline: "none", boxSizing: "border-box",
          }}
        />
        <svg
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Role filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: "0.625rem", flexWrap: "wrap" }}>
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            style={{
              background: roleFilter === r.value ? "#111" : "#F0F0F0",
              color: roleFilter === r.value ? "#fff" : "#555",
              border: "none", borderRadius: 20, padding: "5px 13px",
              fontSize: "12px", fontWeight: 700, fontFamily: SANS, cursor: "pointer",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: "0.875rem", flexWrap: "wrap" }}>
        {TAG_FILTERS.map((t) => {
          const active = tagFilters.has(t.value);
          return (
            <button
              key={t.value}
              onClick={() => toggleTag(t.value)}
              style={{
                background: active ? "#FF4D00" : "#F0F0F0",
                color: active ? "#fff" : "#555",
                border: "none", borderRadius: 20, padding: "5px 13px",
                fontSize: "12px", fontWeight: 700, fontFamily: SANS, cursor: "pointer",
              }}
            >
              {active ? "✓ " : ""}{t.label}
            </button>
          );
        })}
        {hasFilters && (
          <button
            onClick={() => { setQuery(""); setRoleFilter("all"); setTagFilters(new Set()); }}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "5px 13px", fontSize: "12px", color: TSEC, fontFamily: SANS, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: "0.625rem" }}>
        {filtered.length} {filtered.length === 1 ? "user" : "users"}
        {query ? ` matching "${query}"` : ""}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {filtered.map((p) => {
          const badgeStyle = ROLE_BADGE[p.platform_role] || ROLE_BADGE.member;
          const tags = p.tags || [];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: "0.625rem 0.875rem", cursor: "pointer", width: "100%", textAlign: "left",
              }}
            >
              <Avatar url={p.photo_url} name={p.full_name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#111", fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.full_name}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 800, background: badgeStyle.bg, color: badgeStyle.color, borderRadius: 99, padding: "2px 7px", fontFamily: SANS, flexShrink: 0, letterSpacing: "0.04em" }}>
                    {p.platform_role || "member"}
                  </span>
                  {tags.map((tag) => (
                    <span key={tag} style={{ fontSize: "9px", fontWeight: 800, background: "#FF4D00", color: "#fff", borderRadius: 99, padding: "2px 7px", fontFamily: SANS, flexShrink: 0, letterSpacing: "0.04em" }}>
                      {tag === "board_member" ? "Board" : tag}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.email}{p.churches?.name ? ` · ${p.churches.name}` : ""}
                </div>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
