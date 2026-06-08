import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      const stack = (err.stack || "").split("\n").slice(0, 8).join("\n");
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#111",
          display: "flex", flexDirection: "column",
          padding: "2rem", fontFamily: "monospace", color: "#fff", overflowY: "auto",
        }}>
          <div style={{ fontSize: "18px", fontWeight: 900, marginBottom: "0.75rem", color: "#FF4D00" }}>
            App crashed — share this with dev
          </div>
          <div style={{ fontSize: "13px", color: "#FFB896", marginBottom: "0.75rem", wordBreak: "break-word" }}>
            {err.message}
          </div>
          <pre style={{ fontSize: "11px", color: "#8A9BB0", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, flex: 1 }}>
            {stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ background: "#FF4D00", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "1.5rem", flexShrink: 0 }}
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
