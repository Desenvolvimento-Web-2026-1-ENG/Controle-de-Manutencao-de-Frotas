import React, { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../services/api";

export default function DashboardView({ onNavegar, onAbrirOSComVeiculo }) {
  const [resumo, setResumo] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [resumoData, alertasData] = await Promise.all([
        api.getDashboardResumo(),
        api.getDashboardAlertas(),
      ]);

      if (resumoData.success) setResumo(resumoData.data);
      if (alertasData.success) setAlertas(alertasData.data);
    } catch (err) {
      setErro(err.message || "Falha ao carregar indicadores do dashboard.");
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Consolidando métricas da frota e ordens de serviço...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold">Erro ao carregar Dashboard</h3>
        </div>
        <p className="text-sm">{erro}</p>
        <button
          onClick={carregarDados}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { frota, ordensServico, financeiro } = resumo || {
    frota: {},
    ordensServico: {},
    financeiro: {},
  };

  const listaCriticos = alertas?.alertasCriticos || [];
  const listaAtencao = alertas?.alertasAtencao || [];

  return (
    <div className="space-y-6">
      {/* 1. Alerta Crítico Banner (se houver veículos críticos) */}
      {listaCriticos.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border border-rose-500/30 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wider">
                  Atenção Imediata: {listaCriticos.length} Veículo(s) com Revisão Vencida
                </h3>
                <button
                  onClick={() => onNavegar("veiculos", { apenasAlertas: true })}
                  className="text-xs text-rose-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
                >
                  Ver todos na frota <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Veículos ultrapassaram o limite de quilometragem ou a data estipulada pelo plano preventivo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {listaCriticos.slice(0, 2).map((item) => (
                  <div
                    key={item.veiculoId}
                    className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                          {item.placa}
                        </span>
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {item.modelo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        KM Atual: <strong className="text-slate-200">{item.kmAtual.toLocaleString()}</strong> |
                        Rev: <strong className="text-rose-400">{item.kmProximaRevisao.toLocaleString()}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => onAbrirOSComVeiculo(item.veiculoId)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs whitespace-nowrap shadow-md shadow-rose-600/20 transition-all"
                    >
                      Abrir O.S.
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total da Frota */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total da Frota
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {frota.totalVeiculos || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">veículos cadastrados</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {frota.emOperacao || 0} em operação
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {frota.emManutencao || 0} em manutenção
            </span>
          </div>
        </div>

        {/* Status Preventivo da Frota */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Revisões Preventivas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 tracking-tight">
              {frota.revisaoEmDia || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">veículos em conformidade</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="text-rose-400 font-semibold">
              {frota.revisaoCritica || 0} críticos
            </span>
            <span className="text-amber-400 font-semibold">
              {frota.revisaoAtencao || 0} em atenção
            </span>
          </div>
        </div>

        {/* Ordens de Serviço Ativas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ordens de Serviço
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {(ordensServico.abertas || 0) + (ordensServico.emAndamento || 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">em oficina ou abertas</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{ordensServico.concluidas || 0} concluídas</span>
            <span>Total: {ordensServico.total || 0}</span>
          </div>
        </div>

        {/* Investimento Total em Manutenção */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Custo Total Concluído
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              R$ {(financeiro.totalGastoGeral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Peças: R$ {(financeiro.totalGastoPecas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
            <span>Mão de Obra: R$ {(financeiro.totalGastoMaoDeObra || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* 3. Seção Detalhada: Alertas de Manutenção e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Lista Completa de Alertas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Central de Alertas Preventivos</h3>
              <p className="text-xs text-slate-400">
                Veículos que exigem intervenção baseada em odômetro ou tempo decorrido
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
              {alertas?.totalAlertas || 0} pendências
            </span>
          </div>

          <div className="space-y-3">
            {[...listaCriticos, ...listaAtencao].length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-200">
                  Toda a frota está em dia com os planos de revisão!
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Nenhum veículo atingiu o limite de quilometragem ou prazo.
                </p>
              </div>
            ) : (
              [...listaCriticos, ...listaAtencao].map((alerta) => {
                const isCritico = alerta.gravidade.includes("CRÍTICA");
                return (
                  <div
                    key={alerta.veiculoId}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      isCritico
                        ? "bg-rose-950/30 border-rose-500/30 hover:border-rose-500/50"
                        : "bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isCritico ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {alerta.placa}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {alerta.modelo}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {alerta.motorista || "Sem motorista"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {alerta.motivos.join(" | ")}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {alerta.acaoRecomendada}
                      </p>
                    </div>

                    <button
                      onClick={() => onAbrirOSComVeiculo(alerta.veiculoId)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs whitespace-nowrap shadow-md shadow-indigo-600/20 transition-all shrink-0"
                    >
                      Criar O.S.
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 3: Atalhos Operacionais & Parâmetros */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-1">Ações Rápidas</h3>
            <p className="text-xs text-slate-400 mb-4">Gestão direta dos registros operacionais</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavegar("ordens", { abrirNovo: true })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Abrir Nova O.S.</h4>
                    <p className="text-[11px] text-slate-400">Registrar manutenção com peças</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => onNavegar("veiculos", { abrirNovo: true })}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Cadastrar Veículo</h4>
                    <p className="text-[11px] text-slate-400">Adicionar caminhão ou van à frota</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => onNavegar("mecanicos")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Equipe & Disponibilidade</h4>
                    <p className="text-[11px] text-slate-400">Consultar mecânicos em serviço</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Critérios de Alerta</h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                <span><strong>Crítico:</strong> KM atual ultrapassou a revisão OU data ultrapassou o vencimento.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                <span><strong>Atenção:</strong> Faltando &le; 1.000 km OU faltam &le; 15 dias para o prazo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <span><strong>Normal:</strong> Dentro da margem de quilometragem e tempo.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
