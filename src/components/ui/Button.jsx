import { ORANGE, NAVY, BORDER, TSEC, SANS } from "../../lib/constants.js";

export default function Button({
  label,
  onClick,
  disabled,
  variant = "primary",
  small,
  full = true,
  icon
}) {
  const styles = {
    primary: {
      background: disabled ? "#C9B7A8" : ORANGE,
      color: "#fff",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: NAVY,
      border: `1.5px solid ${BORDER}`,
    },
    navy: {
      background: disabled ? "#C9B7A8" : NAVY,
      color: "#fff",
      border: "none",
    },
    danger: {
      background: "transparent",
      color: "#DC2626",
      border: "1px solid #FECACA",
    },
    ghost: {
      background: "none",
      color: TSEC,
      border: "none",
    },
  };

  const s = styles[variant] || styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : "auto",
        ...s,
        padding: small ? "9px 14px" : "13px 18px",
        borderRadius: 10,
        cursor: disabled ? "default" : "pointer",
        fontWeight: 600,
        fontSize: small ? "13px" : "15px",
        fontFamily: SANS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: icon ? 8 : 0,
        marginTop: "0.5rem",
        opacity: disabled ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {icon && icon}
      {label}
    </button>
  );
}
