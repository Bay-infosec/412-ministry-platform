import { NAVY, ORANGE, BORDER, TSEC, SANS, SERIF } from "../../lib/constants.js";
import Button from "./Button.jsx";

export default function Modal({
  title,
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  requireType,
  busy,
}) {
  const [typed, setTyped] = window.React
    ? window.React.useState("")
    : [null, null];

  const canConfirm = requireType ? typed === requireType : true;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,32,56,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "2rem 1.75rem",
          maxWidth: 360,
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: "22px",
            fontWeight: 600,
            color: variant === "danger" ? "#DC2626" : NAVY,
            marginBottom: "0.75rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: TSEC,
            lineHeight: 1.65,
            marginBottom: detail ? "0.5rem" : "1.5rem",
          }}
        >
          {message}
        </div>
        {detail && (
          <div
            style={{
              fontSize: "13px",
              color: "#DC2626",
              background: "#FEF2F2",
              borderRadius: 8,
              padding: "0.75rem",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            {detail}
          </div>
        )}
        {requireType && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "12px",
                color: TSEC,
                marginBottom: 6,
                fontFamily: SANS,
              }}
            >
              Type <strong style={{ color: NAVY }}>{requireType}</strong> to confirm
            </div>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                fontSize: "15px",
                fontFamily: SANS,
                color: NAVY,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            label={cancelLabel}
            onClick={onCancel}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <Button
            label={busy ? "Working..." : confirmLabel}
            onClick={onConfirm}
            disabled={!canConfirm || busy}
            variant={variant === "danger" ? "danger" : "primary"}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
