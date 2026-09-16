import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

const TITULOS = {
  dashboard: "Dashboard de Manutenção",
  veiculos: "Gestão da Frota de Veículos",
  ordens: "Ordens de Serviço (O.S.)",
  planos: "Planos de Manutenção Preventiva",
  mecanicos: "Quadro de Mecânicos & Especialistas",
};

export default function Header({ telaAtiva, onNavegar, onShowToast }) {
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    let ativo = true;
    api.getStatus()
      .then((res) => {
        if (ativo && res.success) setApiOnline(true);
      })
      .catch(() => {
        if (ativo) setApiOnline(false);
      });
    return () => { ativo = false; };
  }, []);

  return (
    <header className="top-header">
      <h1 className="header-page-title" id="top-bar-title">
        {TITULOS[telaAtiva] || "Dashboard de Manutenção"}
      </h1>

      <div className="header-user-menu">
        {/* Status API indicator */}
        <div id="api-status-container" className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: apiOnline ? "#22c55e" : "#ef4444" }}
          ></span>
          <span>{apiOnline ? "API Online" : "API Offline"}</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="header-btn-icon"
          title="Notificações de Alertas"
          aria-label="Notificações de Alertas"
          onClick={() => onNavegar && onNavegar("dashboard")}
        >
          🔔
          <span className="badge-notification"></span>
        </button>

        {/* User Profile: Gabriel Nunes */}
        <div className="user-profile">
          <div className="user-avatar">
            GN
          </div>
          <div className="user-info">
            <span className="user-name">Gabriel Nunes</span>
            <span className="user-role">(Gestor)</span>
          </div>
        </div>

        {/* Settings Gear */}
        <button
          type="button"
          className="header-btn-icon"
          title="Configurações"
          aria-label="Configurações"
          onClick={() => onShowToast && onShowToast("info", "Configurações", "Painel de configurações da frota.")}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
