// ============================================================
// ComponentErrorBoundary.jsx — Scoped Panel Recovery Boundary
// Isolates crashes inside lazy 3D/Chart modules without resetting the Pit Wall.
// ============================================================
import React, { Component } from "react";

export default class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected rendering fault in telemetry panel.",
    };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name || "Panel"}] ComponentErrorBoundary caught:`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            background: "linear-gradient(180deg, rgba(18, 22, 34, 0.96) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255, 59, 48, 0.45)",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            minHeight: "180px",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "1.6rem" }}>⚠️</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.86rem", fontWeight: "900", color: "#ff6b6b" }}>
            {this.props.name || "MODULE"} TEMPORARILY UNAVAILABLE
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: "460px" }}>
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              background: "rgba(0, 210, 190, 0.16)",
              border: "1px solid var(--neon-cyan)",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.68rem",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            ↻ RELOAD MODULE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
