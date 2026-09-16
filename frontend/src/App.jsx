import React, { useState, useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Toast from "./components/common/Toast";
import DashboardView from "./components/dashboard/DashboardView";
import VeiculosView from "./components/veiculos/VeiculosView";
import OrdensServicoView from "./components/ordens/OrdensServicoView";
import PlanosView from "./components/planos/PlanosView";
import MecanicosView from "./components/mecanicos/MecanicosView";

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["dashboard", "veiculos", "ordens", "planos", "mecanicos"].includes(hash)
      ? hash
      : "dashboard";
  });

  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recarregando, setRecarregando] = useState(false);

  // Parâmetros de navegação cruzada entre telas
  const [veiculoPreSelecionadoOS, setVeiculoPreSelecionadoOS] = useState(null);
  const [filtroAlertasVeiculos, setFiltroAlertasVeiculos] = useState(false);
  const [abrirNovaOSGatilho, setAbrirNovaOSGatilho] = useState(false);
  const [abrirNovoVeiculoGatilho, setAbrirNovoVeiculoGatilho] = useState(false);

  // Atualizar hash na URL para histórico do navegador sem recarregar a página
  useEffect(() => {
    window.location.hash = telaAtiva;
  }, [telaAtiva]);

  // Sistema de Notificações (Toasts) com auto-dismiss
  const showToast = (tipo, titulo, mensagem) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, tipo, titulo, mensagem }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navegação cruzada inteligente (ex: do Dashboard para a tela de O.S. ou Veículos)
  const navegarPara = (tela, opcoes = {}) => {
    if (opcoes.veiculoId) {
      setVeiculoPreSelecionadoOS(opcoes.veiculoId);
    }
    if (opcoes.apenasAlertas !== undefined) {
      setFiltroAlertasVeiculos(opcoes.apenasAlertas);
    }
    if (opcoes.abrirNovo) {
      if (tela === "ordens") setAbrirNovaOSGatilho(true);
      if (tela === "veiculos") setAbrirNovoVeiculoGatilho(true);
    }
    setTelaAtiva(tela);
  };

  const handleRecarregarGlobal = () => {
    setRecarregando(true);
    // Força re-render simulando atualização
    setTimeout(() => {
      setRecarregando(false);
      showToast("sucesso", "Sincronizado", "Dados atualizados com o banco de dados.");
    }, 400);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar de Navegação */}
      <Sidebar
        telaAtiva={telaAtiva}
        setTelaAtiva={(t) => {
          setFiltroAlertasVeiculos(false);
          setVeiculoPreSelecionadoOS(null);
          setTelaAtiva(t);
        }}
        isOpen={isOpenSidebar}
        setIsOpen={setIsOpenSidebar}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          telaAtiva={telaAtiva}
          setIsOpenSidebar={setIsOpenSidebar}
          onAbrirNovaOS={() => setAbrirNovaOSGatilho(true)}
          onAbrirNovoVeiculo={() => setAbrirNovoVeiculoGatilho(true)}
          onRecarregar={handleRecarregarGlobal}
          recarregando={recarregando}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {telaAtiva === "dashboard" && (
              <DashboardView
                onNavegar={navegarPara}
                onAbrirOSComVeiculo={(vId) =>
                  navegarPara("ordens", { veiculoId: vId, abrirNovo: true })
                }
              />
            )}

            {telaAtiva === "veiculos" && (
              <VeiculosView
                key={`veiculos-${recarregando}-${filtroAlertasVeiculos}`}
                onShowToast={showToast}
                abrirNovoInicial={abrirNovoVeiculoGatilho}
                filtroAlertasInicial={filtroAlertasVeiculos}
              />
            )}

            {telaAtiva === "ordens" && (
              <OrdensServicoView
                key={`ordens-${recarregando}-${veiculoPreSelecionadoOS}`}
                onShowToast={showToast}
                abrirNovoInicial={abrirNovaOSGatilho}
                veiculoPreSelecionadoId={veiculoPreSelecionadoOS}
              />
            )}

            {telaAtiva === "planos" && (
              <PlanosView key={`planos-${recarregando}`} onShowToast={showToast} />
            )}

            {telaAtiva === "mecanicos" && (
              <MecanicosView key={`mecanicos-${recarregando}`} onShowToast={showToast} />
            )}
          </div>
        </main>
      </div>

      {/* Sistema Flutuante de Toasts */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
