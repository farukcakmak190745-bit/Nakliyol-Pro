import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console (can be replaced with Sentry or similar in production)
    console.error("Error Boundary catch:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg)",
          padding: "20px",
          textAlign: "center",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
          <div style={{ fontSize: "24px", fontWeight: "600", color: "#f59e0b", marginBottom: "12px" }}>
            Bir Hata Oluştu
          </div>
          <div style={{
            fontSize: "14px",
            color: "var(--text2)",
            maxWidth: "500px",
            marginBottom: "16px",
            textAlign: "left",
            background: "#faf8f5",
            padding: "12px",
            borderRadius: "8px",
            fontFamily: "monospace",
            maxHeight: "200px",
            overflow: "auto"
          }}>
            <div style={{ color: "#ff6b6b", marginBottom: "8px" }}>
              <strong>Error:</strong> {this.state.error?.toString()}
            </div>
            <div style={{ color: "#ffd93d" }}>
              <strong>Stack:</strong>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "var(--text2)", maxWidth: "400px", marginBottom: "24px" }}>
            Uygulamada bir sorun oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: "12px 24px",
              background: "var(--guldum-gradient)",
              color: "#0a0a0a",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              border: "none"
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
