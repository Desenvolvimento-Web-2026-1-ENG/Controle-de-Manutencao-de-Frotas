import React, { useState, useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Toast from "./components/common/Toast";
import DashboardView from "./components/dashboard/DashboardView";
import VeiculosView from "./components/veiculos/VeiculosView";
import OrdensServicoView from "./components/ordens/OrdensServicoView";
import PlanosView from "./components/planos/PlanosView";
import MecanicosView from "./components/mecanicos/MecanicosView";

// ==============================================================================
// [REQUISITO P2: SPA & GESTÃO DE ESTADO COM REACT HOOKS]
// - useState: Controla a aba ativa, fila de notificações Toast e parâmetros de navegação cruzada.
// - useEffect: Sincroniza o histórico e URL com window.location.hash (Zero Page Reload).
// ==============================================================================
const TELAS_VALIDAS = ["dashboard", "veiculos", "ordens", "planos", "mecanicos"];
const TOAST_DURATION_MS = 4500;

export default function App() {
  // Estado local da tela ativa inicializado a partir da URL (Hash Routing)
  const [telaAtiva, setTelaAtiva] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return TELAS_VALIDAS.includes(hash) ? hash : "dashboard";
  });

  // Estados de controle de dados reativos e gatilhos de modais
  const [toasts, setToasts] = useState([]);
  const [veiculoPreSelecionadoOS, setVeiculoPreSelecionadoOS] = useState(null);
  const [filtroAlertasVeiculos, setFiltroAlertasVeiculos] = useState(false);
  const [abrirNovaOSGatilho, setAbrirNovaOSGatilho] = useState(false);
  const [abrirNovoVeiculoGatilho, setAbrirNovoVeiculoGatilho] = useState(false);

  // Efeito para sincronizar a URL com a tela ativa sem recarregar o navegador
  useEffect(() => {
    window.location.hash = telaAtiva;
  }, [telaAtiva]);

  // Efeito para escutar o evento nativo de 'hashchange' (botões Voltar/Avançar do navegador)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (TELAS_VALIDAS.includes(hash)) {
        setTelaAtiva(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const showToast = (tipo, titulo, mensagem) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, tipo, titulo, mensagem }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navegarParaAba = (tela, opcoes = {}) => {
    if (opcoes.veiculoId) {
      setVeiculoPreSelecionadoOS(opcoes.veiculoId);
    } else {
      setVeiculoPreSelecionadoOS(null);
    }

    if (opcoes.apenasAlertas !== undefined) {
      setFiltroAlertasVeiculos(opcoes.apenasAlertas);
    } else {
      setFiltroAlertasVeiculos(false);
    }

    setAbrirNovaOSGatilho(Boolean(opcoes.abrirNovo && tela === "ordens"));
    setAbrirNovoVeiculoGatilho(Boolean(opcoes.abrirNovo && tela === "veiculos"));

    setTelaAtiva(tela);
  };

  return (
    <div className="app-wrapper">
      {/* 1. Sidebar de Navegação Lateral */}
      <Sidebar
        telaAtiva={telaAtiva}
        setTelaAtiva={(t) => navegarParaAba(t)}
        onShowToast={showToast}
      />

      {/* 2. Conteúdo Principal */}
      <div className="main-wrapper">
        <Header
          telaAtiva={telaAtiva}
          onNavegar={navegarParaAba}
          onShowToast={showToast}
        />

        <main className="content-body">
          {telaAtiva === "dashboard" && (
            <DashboardView
              onNavegar={navegarParaAba}
              onAbrirOSComVeiculo={(vId) =>
                navegarParaAba("ordens", { veiculoId: vId, abrirNovo: true })
              }
            />
          )}

          {telaAtiva === "veiculos" && (
            <VeiculosView
              key={`veiculos-${filtroAlertasVeiculos}-${abrirNovoVeiculoGatilho}`}
              onShowToast={showToast}
              abrirNovoInicial={abrirNovoVeiculoGatilho}
              filtroAlertasInicial={filtroAlertasVeiculos}
            />
          )}

          {telaAtiva === "ordens" && (
            <OrdensServicoView
              key={`ordens-${veiculoPreSelecionadoOS}-${abrirNovaOSGatilho}`}
              onShowToast={showToast}
              abrirNovoInicial={abrirNovaOSGatilho}
              veiculoPreSelecionadoId={veiculoPreSelecionadoOS}
            />
          )}

          {telaAtiva === "planos" && (
            <PlanosView onShowToast={showToast} />
          )}

          {telaAtiva === "mecanicos" && (
            <MecanicosView onShowToast={showToast} />
          )}
        </main>

        {/* 3. Rodapé Corporativo */}
        <footer className="app-footer">
          WEBDEV FROTAS &copy; 2026 — Sistema de Logística &amp; Controle de Manutenção | Gestor: Gabriel Nunes
        </footer>
      </div>

      {/* 4. Sistema Flutuante de Notificações */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
