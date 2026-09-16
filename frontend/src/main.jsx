import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", color: "#b91c1c", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", margin: "2rem" }}>
          <h2>⚠️ Ocorreu um erro na renderização da interface</h2>
          <pre style={{ fontSize: "0.85rem", marginTop: "1rem", whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer", borderRadius: "6px", border: "1px solid #b91c1c", background: "#ffffff" }}
            onClick={() => window.location.reload()}
          >
            Recarregar Aplicação
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
