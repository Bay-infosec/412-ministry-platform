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
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#FF4D00",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "2rem", fontFamily: "system-ui, sans-serif", color: "#fff", textAlign: "center",
        }}>
          <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "1rem" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {this.state.error.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ background: "#fff", color: "#FF4D00", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}
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
