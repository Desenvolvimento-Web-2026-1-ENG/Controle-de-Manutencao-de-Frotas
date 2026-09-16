import React from "react";

export default function Sidebar({ telaAtiva, setTelaAtiva, onShowToast }) {
  const handleLogout = () => {
    if (onShowToast) {
      onShowToast("info", "Sessão Encerrada", "Sessão de Gabriel Nunes encerrada com segurança.");
    }
  };

  return (
    <aside className="sidebar" aria-label="Navegação Lateral">
      <div className="sidebar-logo">
        <svg className="logo-icon-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="logo-text">WEBDEV FROTAS</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-link ${telaAtiva === "dashboard" ? "active" : ""}`}
          onClick={() => setTelaAtiva("dashboard")}
        >
          <span className="nav-link-icon">📊</span>
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-link ${telaAtiva === "veiculos" ? "active" : ""}`}
          onClick={() => setTelaAtiva("veiculos")}
        >
          <span className="nav-link-icon">🚗</span>
          <span>Veículos</span>
        </button>

        <button
          className={`nav-link ${telaAtiva === "planos" ? "active" : ""}`}
          onClick={() => setTelaAtiva("planos")}
        >
          <span className="nav-link-icon">📅</span>
          <span>Planos de Manutenção</span>
        </button>

        <button
          className={`nav-link ${telaAtiva === "ordens" ? "active" : ""}`}
          onClick={() => setTelaAtiva("ordens")}
        >
          <span className="nav-link-icon">📋</span>
          <span>Ordens de Serviço (O.S.)</span>
        </button>

        <button
          className={`nav-link ${telaAtiva === "mecanicos" ? "active" : ""}`}
          onClick={() => setTelaAtiva("mecanicos")}
        >
          <span className="nav-link-icon">👥</span>
          <span>Mecânicos</span>
        </button>

        <button
          className="nav-link"
          onClick={() => {
            setTelaAtiva("dashboard");
            if (onShowToast) onShowToast("info", "Relatórios", "Métricas consolidadas exibidas no Dashboard.");
          }}
        >
          <span className="nav-link-icon">📈</span>
          <span>Relatórios</span>
        </button>

        <a
          href="/wireframes.html"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
          style={{ color: "#0284c7" }}
        >
          <span className="nav-link-icon">🎨</span>
          <span>Wireframes P1</span>
        </a>

        <a
          href="/api-docs"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
          style={{ color: "#16a34a" }}
        >
          <span className="nav-link-icon">📄</span>
          <span>Swagger OpenAPI</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-link"
          style={{ color: "#ef4444" }}
          onClick={handleLogout}
        >
          <span className="nav-link-icon">🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
