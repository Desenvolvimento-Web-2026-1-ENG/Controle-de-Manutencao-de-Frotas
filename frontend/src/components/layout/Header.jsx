import React, { useState, useEffect } from "react";
import { Menu, Plus, Activity, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

export default function Header({
  telaAtiva,
  setIsOpenSidebar,
  onAbrirNovaOS,
  onAbrirNovoVeiculo,
  onRecarregar,
  recarregando,
}) {
  const [statusApi, setStatusApi] = useState({ online: true, projeto: "WEBDEV FROTAS" });

  useEffect(() => {
    let montado = true;
    api
      .getStatus()
      .then((res) => {
        if (montado && res.success) {
          setStatusApi({ online: true, projeto: res.projeto || "WEBDEV FROTAS" });
        }
      })
      .catch(() => {
        if (montado) setStatusApi({ online: false, projeto: "Offline" });
      });
    return () => {
      montado = false;
    };
  }, []);

  const titulos = {
    dashboard: { titulo: "Painel de Controle & Alertas", subtitulo: "Monitoramento em tempo real de manutenções e custos" },
    veiculos: { titulo: "Gestão da Frota", subtitulo: "Cadastro, quilometragem e previsão de revisões" },
    ordens: { titulo: "Ordens de Serviço (O.S.)", subtitulo: "Abertura, peças, mão de obra e conclusão" },
    planos: { titulo: "Planos Preventivos", subtitulo: "Políticas periódicas por quilometragem e meses" },
    mecanicos: { titulo: "Quadro de Mecânicos", subtitulo: "Especialistas da oficina e disponibilidade" },
  };

  const infoAtual = titulos[telaAtiva] || titulos.dashboard;

  return (
    <header className="h-16 px-4 sm:px-8 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpenSidebar(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
            {infoAtual.titulo}
          </h2>
          <p className="text-[11px] text-slate-400 font-normal hidden sm:block mt-0.5">
            {infoAtual.subtitulo}
          </p>
        </div>
      </div>

      {/* Right side: Status Badge, Refresh and Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                statusApi.online ? "bg-emerald-400" : "bg-rose-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                statusApi.online ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
          </span>
          <span className="text-slate-300 font-mono text-[11px]">
            API {statusApi.online ? "Online" : "Desconectada"}
          </span>
        </div>

        {/* Refresh Button */}
        {onRecarregar && (
          <button
            onClick={onRecarregar}
            disabled={recarregando}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${recarregando ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        )}

        {/* Action Button: Nova OS */}
        {telaAtiva === "ordens" && (
          <button
            onClick={onAbrirNovaOS}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova O.S.</span>
          </button>
        )}

        {/* Action Button: Novo Veículo */}
        {telaAtiva === "veiculos" && (
          <button
            onClick={onAbrirNovoVeiculo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Veículo</span>
          </button>
        )}
      </div>
    </header>
  );
}
