import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
  FileText,
  Truck,
} from "lucide-react";
import { api } from "../../services/api";
import Modal from "../common/Modal";

export default function OrdensServicoView({
  onShowToast,
  abrirNovoInicial = false,
  veiculoPreSelecionadoId = null,
}) {
  const [ordens, setOrdens] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(abrirNovoInicial || !!veiculoPreSelecionadoId);
  const [osVisualizando, setOsVisualizando] = useState(null);
  const [osAlterarStatus, setOsAlterarStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState("EM_ANDAMENTO");
  const [observacaoStatus, setObservacaoStatus] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Formulário Nova O.S.
  const [formData, setFormData] = useState({
    veiculoId: veiculoPreSelecionadoId || "",
    tipo: "PREVENTIVA",
    mecanicoResponsavel: "",
    kmNoMomento: "",
    descricao: "",
    observacoes: "",
    pecas: [{ item: "", quantidade: 1, valorUnitario: "" }],
    maoDeObra: {
      descricao: "Mão de obra especializada de oficina",
      horas: 2,
      valorHora: 90,
    },
  });

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, tipoFiltro]);

  useEffect(() => {
    if (abrirNovoInicial || veiculoPreSelecionadoId) {
      abrirModalCriacao();
    }
  }, [abrirNovoInicial, veiculoPreSelecionadoId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resOS, resVeiculos, resMecanicos] = await Promise.all([
        api.getOrdensServico({
          status: statusFiltro,
          tipo: tipoFiltro,
        }),
        api.getVeiculos(),
        api.getMecanicos(),
      ]);

      if (resOS.success) setOrdens(resOS.data);
      if (resVeiculos.success) setVeiculos(resVeiculos.data);
      if (resMecanicos.success) {
        setMecanicos(resMecanicos.data);
        if (!formData.mecanicoResponsavel && resMecanicos.data.length > 0) {
          setFormData((prev) => ({ ...prev, mecanicoResponsavel: resMecanicos.data[0].nome }));
        }
      }
    } catch (err) {
      onShowToast("erro", "Falha ao carregar ordens de serviço", err.message);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalCriacao = () => {
    const vId = veiculoPreSelecionadoId || (veiculos.length > 0 ? veiculos[0].id : "");
    const vObj = veiculos.find((v) => v.id === Number(vId));
    setFormData({
      veiculoId: vId,
      tipo: "PREVENTIVA",
      mecanicoResponsavel: mecanicos.length > 0 ? mecanicos[0].nome : "Carlos Silva",
      kmNoMomento: vObj ? vObj.kmAtual : "",
      descricao: "Revisão preventiva periódica",
      observacoes: "",
      pecas: [{ item: "Filtro de Óleo e Lubrificante", quantidade: 1, valorUnitario: 150 }],
      maoDeObra: {
        descricao: "Serviço mecânico e checagem de freios",
        horas: 3,
        valorHora: 90,
      },
    });
    setModalNovoAberto(true);
  };

  // Manipuladores de itens de peças dinâmicas
  const adicionarPeca = () => {
    setFormData({
      ...formData,
      pecas: [...formData.pecas, { item: "", quantidade: 1, valorUnitario: "" }],
    });
  };

  const removerPeca = (index) => {
    const novas = formData.pecas.filter((_, i) => i !== index);
    setFormData({ ...formData, pecas: novas });
  };

  const atualizarPeca = (index, campo, valor) => {
    const novas = [...formData.pecas];
    novas[index][campo] = valor;
    setFormData({ ...formData, pecas: novas });
  };

  // Cálculos financeiros reativos
  const calcularTotalPecas = () => {
    return formData.pecas.reduce((acc, p) => {
      const qtd = Number(p.quantidade) || 0;
      const val = Number(p.valorUnitario) || 0;
      return acc + qtd * val;
    }, 0);
  };

  const calcularTotalMaoDeObra = () => {
    const h = Number(formData.maoDeObra?.horas) || 0;
    const v = Number(formData.maoDeObra?.valorHora) || 0;
    return h * v;
  };

  const handleSalvarOS = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const payload = {
        ...formData,
        veiculoId: Number(formData.veiculoId),
        kmNoMomento: Number(formData.kmNoMomento) || undefined,
        pecas: formData.pecas
          .filter((p) => p.item.trim() !== "")
          .map((p) => ({
            item: p.item,
            quantidade: Number(p.quantidade) || 1,
            valorUnitario: Number(p.valorUnitario) || 0,
          })),
        maoDeObra: {
          descricao: formData.maoDeObra.descricao,
          horas: Number(formData.maoDeObra.horas) || 0,
          valorHora: Number(formData.maoDeObra.valorHora) || 0,
          valorTotal: calcularTotalMaoDeObra(),
        },
      };

      const res = await api.criarOrdemServico(payload);
      onShowToast("sucesso", "Ordem de Serviço aberta", `${res.data.codigoOS} registrada com sucesso.`);
      setModalNovoAberto(false);
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Erro ao abrir O.S.", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarAlterarStatus = async (e) => {
    e.preventDefault();
    if (!osAlterarStatus) return;
    try {
      setSalvando(true);
      await api.alterarStatusOS(osAlterarStatus.id, novoStatus, observacaoStatus);
      onShowToast(
        "sucesso",
        "Status da O.S. atualizado",
        `O.S. ${osAlterarStatus.codigoOS} alterada para ${novoStatus}.`
      );
      setOsAlterarStatus(null);
      setObservacaoStatus("");
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Erro ao alterar status", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirOS = async (os) => {
    if (!window.confirm(`Tem certeza que deseja excluir a Ordem de Serviço ${os.codigoOS}?`)) {
      return;
    }
    try {
      await api.deletarOrdemServico(os.id);
      onShowToast("sucesso", "O.S. excluída", `Ordem de Serviço ${os.codigoOS} removida.`);
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Não foi possível excluir", err.message);
    }
  };

  const ordensFiltradas = ordens.filter((os) => {
    const termo = busca.toLowerCase();
    const placa = os.veiculo?.placa?.toLowerCase() || "";
    const modelo = os.veiculo?.modelo?.toLowerCase() || "";
    const codigo = os.codigoOS?.toLowerCase() || "";
    const mecanico = os.mecanicoResponsavel?.toLowerCase() || "";
    return (
      placa.includes(termo) ||
      modelo.includes(termo) ||
      codigo.includes(termo) ||
      mecanico.includes(termo)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Barra de Ações & Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código O.S., placa ou mecânico..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ABERTA">Aberta</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="PREVENTIVA">Preventiva</option>
              <option value="CORRETIVA">Corretiva</option>
            </select>
          </div>
        </div>

        <button
          onClick={abrirModalCriacao}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Abrir Nova O.S.</span>
        </button>
      </div>

      {/* 2. Tabela de Ordens de Serviço */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Carregando ordens de serviço...
          </div>
        ) : ordensFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Nenhuma Ordem de Serviço encontrada</p>
            <p className="text-xs text-slate-500 mt-1">Ajuste os filtros ou crie uma nova O.S.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Código & Veículo</th>
                  <th className="px-6 py-4">Tipo & Status</th>
                  <th className="px-6 py-4">Mecânico Responsável</th>
                  <th className="px-6 py-4">Total Geral</th>
                  <th className="px-6 py-4">Abertura / Previsão</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ordensFiltradas.map((os) => {
                  const isConcluida = os.status === "CONCLUIDA";
                  const isAndamento = os.status === "EM_ANDAMENTO";
                  const isAberta = os.status === "ABERTA";

                  return (
                    <tr key={os.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Código & Veículo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 shrink-0">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">
                                {os.codigoOS}
                              </span>
                              {os.veiculo?.placa && (
                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {os.veiculo.placa}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                              {os.descricao}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              KM no momento: {os.kmNoMomento?.toLocaleString() || "N/A"} km
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo & Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              os.tipo === "PREVENTIVA"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {os.tipo}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                              isConcluida
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isAndamento
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : isAberta
                                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConcluida
                                  ? "bg-emerald-400"
                                  : isAndamento
                                  ? "bg-amber-400"
                                  : isAberta
                                  ? "bg-sky-400"
                                  : "bg-slate-500"
                              }`}
                            ></span>
                            {os.status}
                          </span>
                        </div>
                      </td>

                      {/* Mecânico */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-200 font-medium">
                          {os.mecanicoResponsavel}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Peças: {os.pecas?.length || 0} item(ns)
                        </div>
                      </td>

                      {/* Total Geral */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-bold text-slate-100">
                          R$ {Number(os.valorTotalGeral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Peças: R$ {Number(os.valorTotalPecas || 0).toFixed(0)} | M.O: R$ {Number(os.valorTotalMaoDeObra || 0).toFixed(0)}
                        </div>
                      </td>

                      {/* Abertura / Conclusão */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-300">
                          {new Date(os.dataAbertura).toLocaleDateString("pt-BR")}
                        </div>
                        {os.dataConclusao ? (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3" />
                            {new Date(os.dataConclusao).toLocaleDateString("pt-BR")}
                          </div>
                        ) : os.dataPrevisao ? (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Prev: {new Date(os.dataPrevisao).toLocaleDateString("pt-BR")}
                          </div>
                        ) : null}
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setOsVisualizando(os)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Ver detalhes da O.S."
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setOsAlterarStatus(os);
                              setNovoStatus(
                                os.status === "ABERTA"
                                  ? "EM_ANDAMENTO"
                                  : os.status === "EM_ANDAMENTO"
                                  ? "CONCLUIDA"
                                  : "CONCLUIDA"
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                            title="Alterar status"
                          >
                            Status
                          </button>

                          <button
                            onClick={() => handleExcluirOS(os)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Excluir O.S."
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Abertura de Nova O.S. */}
      <Modal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        title="Abertura de Ordem de Serviço (O.S.)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSalvarOS} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Veículo da Frota *</label>
              <select
                required
                value={formData.veiculoId}
                onChange={(e) => {
                  const vId = e.target.value;
                  const vObj = veiculos.find((v) => v.id === Number(vId));
                  setFormData({
                    ...formData,
                    veiculoId: vId,
                    kmNoMomento: vObj ? vObj.kmAtual : formData.kmNoMomento,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Selecione o veículo...</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.marca} {v.modelo} ({v.kmAtual.toLocaleString()} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Manutenção *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="PREVENTIVA">Preventiva (Recalcula próxima revisão ao concluir)</option>
                <option value="CORRETIVA">Corretiva (Reparo emergencial ou corretivo)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mecânico / Técnico Responsável *</label>
              <select
                required
                value={formData.mecanicoResponsavel}
                onChange={(e) => setFormData({ ...formData, mecanicoResponsavel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.nome}>
                    {m.nome} ({m.especialidade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">KM do Veículo na Entrada *</label>
              <input
                type="number"
                required
                min={0}
                placeholder="Ex: 92400"
                value={formData.kmNoMomento}
                onChange={(e) => setFormData({ ...formData, kmNoMomento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição do Serviço / Diagnóstico *</label>
            <input
              type="text"
              required
              placeholder="Ex: Revisão periódica dos 90.000 km com troca de óleo e filtros"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Peças Substituídas */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                Peças e Componentes Aplicados
              </h4>
              <button
                type="button"
                onClick={adicionarPeca}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar Peça
              </button>
            </div>

            {formData.pecas.map((peca, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do componente / peça..."
                  value={peca.item}
                  onChange={(e) => atualizarPeca(idx, "item", e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qtd"
                  value={peca.quantidade}
                  onChange={(e) => atualizarPeca(idx, "quantidade", e.target.value)}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-center text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="R$ Unit."
                  value={peca.valorUnitario}
                  onChange={(e) => atualizarPeca(idx, "valorUnitario", e.target.value)}
                  className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-right text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="w-20 text-right font-mono text-xs text-slate-300">
                  R$ {((Number(peca.quantidade) || 0) * (Number(peca.valorUnitario) || 0)).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removerPeca(idx)}
                  className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Mão de Obra */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Mão de Obra Técnica
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Horas de Trabalho</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={formData.maoDeObra.horas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maoDeObra: { ...formData.maoDeObra, horas: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Valor da Hora (R$)</label>
                <input
                  type="number"
                  min={0}
                  step="5"
                  value={formData.maoDeObra.valorHora}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maoDeObra: { ...formData.maoDeObra, valorHora: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col justify-center text-right">
                <span className="text-[11px] text-slate-400">Total Mão de Obra</span>
                <span className="font-mono text-sm font-bold text-slate-200">
                  R$ {calcularTotalMaoDeObra().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro da O.S. */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200">Custo Total Projetado da O.S.:</span>
            <span className="text-lg font-bold font-mono text-white">
              R$ {(calcularTotalPecas() + calcularTotalMaoDeObra()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalNovoAberto(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {salvando ? "Emitindo..." : "Abrir Ordem de Serviço"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Alteração de Status da O.S. */}
      <Modal
        isOpen={!!osAlterarStatus}
        onClose={() => setOsAlterarStatus(null)}
        title={`Alterar Status — ${osAlterarStatus?.codigoOS}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmarAlterarStatus} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Selecione o novo status da Ordem de Serviço. Caso selecione{" "}
            <strong className="text-emerald-400">CONCLUÍDA</strong>, o sistema atualizará a quilometragem do veículo e
            recalculará automaticamente a data e KM da próxima revisão.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Novo Status *</label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ABERTA">ABERTA (Em fila de espera)</option>
              <option value="EM_ANDAMENTO">EM ANDAMENTO (Veículo em box na oficina)</option>
              <option value="CONCLUIDA">CONCLUÍDA (Finalizada com sucesso)</option>
              <option value="CANCELADA">CANCELADA (Serviço suspenso)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observações da Transição</label>
            <textarea
              rows={3}
              placeholder="Ex: Revisão finalizada. Freios sangrados e óleo trocado."
              value={observacaoStatus}
              onChange={(e) => setObservacaoStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setOsAlterarStatus(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {salvando ? "Processando..." : "Confirmar Alteração"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Detalhes Completos da O.S. */}
      <Modal
        isOpen={!!osVisualizando}
        onClose={() => setOsVisualizando(null)}
        title={`Detalhes — ${osVisualizando?.codigoOS}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block">Veículo</span>
              <strong className="text-slate-100">{osVisualizando?.veiculo?.placa}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Tipo</span>
              <strong className="text-indigo-400">{osVisualizando?.tipo}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Status</span>
              <strong className="text-emerald-400">{osVisualizando?.status}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Total Geral</span>
              <strong className="font-mono text-slate-100">
                R$ {Number(osVisualizando?.valorTotalGeral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-300 mb-1">Descrição dos Serviços</h4>
            <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
              {osVisualizando?.descricao}
            </p>
          </div>

          {osVisualizando?.pecas && osVisualizando.pecas.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-300 mb-1.5">Peças Aplicadas</h4>
              <div className="rounded-xl border border-slate-800 divide-y divide-slate-800/80 bg-slate-950 overflow-hidden">
                {osVisualizando.pecas.map((p, i) => (
                  <div key={i} className="p-2.5 flex justify-between items-center text-slate-300">
                    <span>{p.item} (x{p.quantidade})</span>
                    <span className="font-mono font-semibold text-slate-100">
                      R$ {Number(p.valorTotal || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {osVisualizando?.observacoes && (
            <div>
              <h4 className="font-semibold text-slate-300 mb-1">Observações Técnicas</h4>
              <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 whitespace-pre-line">
                {osVisualizando.observacoes}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
