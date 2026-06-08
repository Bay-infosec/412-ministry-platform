import { BORDER, TSEC, NAVY, SANS } from "../../lib/constants.js";

export default function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  readonly,
  multiline,
  rows = 4,
  hint,
}) {
  const style = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    fontSize: "15px",
    fontFamily: SANS,
    color: readonly ? "#6B7280" : NAVY,
    outline: "none",
    boxSizing: "border-box",
    background: readonly ? "#F3F4F6" : "#fff",
    resize: "vertical",
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: TSEC,
            marginBottom: 6,
            fontFamily: SANS,
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          readOnly={readonly}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readonly}
          style={style}
        />
      )}
      {hint && (
        <div style={{ fontSize: "11px", color: TSEC, marginTop: 4, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
