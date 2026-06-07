export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: "1px solid #E5E5E5",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
