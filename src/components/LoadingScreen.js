import React from "react";

export default function LoadingScreen() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--bg)",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{
        width: "60px",
        height: "60px",
        border: "3px solid rgba(251, 191, 36, 0.2)",
        borderTopColor: "#fbbf24",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "24px"
      }} />
      <div style={{
        fontSize: "18px",
        fontWeight: "600",
        color: "#fbbf24",
        letterSpacing: "2px",
        fontFamily: "var(--font-d)"
      }}>
        NAKLIYOL
      </div>
      <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "8px" }}>
        Yükleniyor...
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
