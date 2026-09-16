import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Gauge,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { api } from "../../services/api";
import Modal from "../common/Modal";

export default function VeiculosView({ onShowToast, abrirNovoInicial = false, filtroAlertasInicial = false }) {
  const [veiculos, setVeiculos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [apenasAlertas, setApenasAlertas] = useState(filtroAlertasInicial);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(abrirNovoInicial);
  const [veiculoEditando, setVeiculoEditando] = useState(null);
  const [veiculoAtualizarKm, setVeiculoAtualizarKm] = useState(null);
  const [veiculoHistorico, setVeiculoHistorico] = useState(null);
  const [historicoOS, setHistoricoOS] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Formulário Veículo (Criação / Edição)
  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    ano: new Date().getFullYear(),
    categoria: "Pesado",
    kmAtual: "",
    planoManutencaoId: "",
    motoristaResponsavel: "",
  });
  const [novoKmValor, setNovoKmValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, apenasAlertas]);

  useEffect(() => {
    if (abrirNovoInicial) {
      abrirModalCriacao();
    }
  }, [abrirNovoInicial]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resVeiculos, resPlanos] = await Promise.all([
        api.getVeiculos({
          status: statusFiltro,
          apenasAlertas: apenasAlertas ? "true" : undefined,
        }),
        api.getPlanosManutencao(),
      ]);

      if (resVeiculos.success) setVeiculos(resVeiculos.data);
      if (resPlanos.success) setPlanos(resPlanos.data);
    } catch (err) {
      onShowToast("erro", "Falha ao carregar veículos", err.message);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalCriacao = () => {
    setVeiculoEditando(null);
    setFormData({
      placa: "",
      marca: "",
      modelo: "",
      ano: new Date().getFullYear(),
      categoria: "Pesado",
      kmAtual: "",
      planoManutencaoId: planos.length > 0 ? planos[0].id : "",
      motoristaResponsavel: "",
    });
    setModalNovoAberto(true);
  };

  const abrirModalEdicao = (veiculo) => {
    setVeiculoEditando(veiculo);
    setFormData({
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      categoria: veiculo.categoria || "Pesado",
      kmAtual: veiculo.kmAtual,
      planoManutencaoId: veiculo.planoManutencaoId || "",
      motoristaResponsavel: veiculo.motoristaResponsavel || "",
    });
    setModalNovoAberto(true);
  };

  const handleSalvarVeiculo = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      if (veiculoEditando) {
        await api.atualizarVeiculo(veiculoEditando.id, formData);
        onShowToast("sucesso", "Veículo atualizado", `Dados do veículo ${formData.placa} foram salvos com sucesso.`);
      } else {
        await api.criarVeiculo(formData);
        onShowToast("sucesso", "Veículo cadastrado", `Veículo ${formData.placa} registrado na frota.`);
      }
      setModalNovoAberto(false);
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Erro ao salvar veículo", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarKm = async (e) => {
    e.preventDefault();
    if (!veiculoAtualizarKm) return;
    try {
      setSalvando(true);
      await api.atualizarKmVeiculo(veiculoAtualizarKm.id, novoKmValor);
      onShowToast("sucesso", "Quilometragem atualizada", `Odômetro do veículo ${veiculoAtualizarKm.placa} atualizado para ${Number(novoKmValor).toLocaleString()} km.`);
      setVeiculoAtualizarKm(null);
      setNovoKmValor("");
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Erro ao atualizar KM", err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirHistorico = async (veiculo) => {
    setVeiculoHistorico(veiculo);
    setCarregandoHistorico(true);
    try {
      const res = await api.getVeiculoHistorico(veiculo.id);
      if (res.success) setHistoricoOS(res.data);
    } catch (err) {
      onShowToast("erro", "Falha ao carregar histórico", err.message);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleExcluirVeiculo = async (veiculo) => {
    if (!window.confirm(`Tem certeza que deseja remover o veículo ${veiculo.placa} (${veiculo.modelo}) da frota?`)) {
      return;
    }
    try {
      await api.deletarVeiculo(veiculo.id);
      onShowToast("sucesso", "Veículo excluído", `Veículo ${veiculo.placa} foi removido com sucesso.`);
      carregarDados();
    } catch (err) {
      onShowToast("erro", "Impedimento de exclusão", err.message);
    }
  };

  // Filtro de busca local
  const veiculosFiltrados = veiculos.filter((v) => {
    const termo = busca.toLowerCase();
    return (
      v.placa.toLowerCase().includes(termo) ||
      v.marca.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo) ||
      (v.motoristaResponsavel && v.motoristaResponsavel.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Barra de Ações & Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, marca ou motorista..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="EM_OPERACAO">Em Operação</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="ALERTA_REVISAO">Alerta Revisão</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700">
            <input
              type="checkbox"
              checked={apenasAlertas}
              onChange={(e) => setApenasAlertas(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Apenas Alertas</span>
          </label>

          <button
            onClick={abrirModalCriacao}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Veículo</span>
          </button>
        </div>
      </div>

      {/* 2. Tabela Responsiva de Veículos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {carregando ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Carregando frota de veículos...
          </div>
        ) : veiculosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Nenhum veículo encontrado</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros ou a busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Veículo & Placa</th>
                  <th className="px-6 py-4">Odômetro (KM)</th>
                  <th className="px-6 py-4">Próxima Revisão</th>
                  <th className="px-6 py-4">Status & Alerta</th>
                  <th className="px-6 py-4">Plano Vinculado</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {veiculosFiltrados.map((v) => {
                  const nivelAlerta = v.alertaRevisao?.nivelAlerta || "NORMAL";
                  const isCritico = nivelAlerta === "CRITICO";
                  const isAtencao = nivelAlerta === "ATENCAO";

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Veículo & Placa */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 shrink-0">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700">
                                {v.placa}
                              </span>
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
                                {v.categoria || "Geral"}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-100 mt-1">
                              {v.marca} {v.modelo} ({v.ano})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Motorista: {v.motoristaResponsavel || "Não informado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Odômetro */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-semibold text-slate-100">
                          {v.kmAtual.toLocaleString()} km
                        </div>
                        <button
                          onClick={() => {
                            setVeiculoAtualizarKm(v);
                            setNovoKmValor(v.kmAtual);
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Gauge className="w-3 h-3" /> Atualizar KM
                        </button>
                      </td>

                      {/* Próxima Revisão */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-200">
                          Alvo: <strong className="font-mono">{v.kmProximaRevisao ? `${v.kmProximaRevisao.toLocaleString()} km` : "N/D"}</strong>
                        </div>
                        {v.dataProximaRevisao && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(v.dataProximaRevisao).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>

                      {/* Status & Alerta */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                              v.status === "EM_OPERACAO"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : v.status === "EM_MANUTENCAO"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                v.status === "EM_OPERACAO" ? "bg-emerald-400" : "bg-amber-400"
                              }`}
                            ></span>
                            {v.status.replace("_", " ")}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCritico
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : isAtencao
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {nivelAlerta}
                          </span>
                        </div>
                      </td>

                      {/* Plano */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300 line-clamp-1">
                          {v.planoManutencao?.nome || "Sem plano vinculado"}
                        </span>
                        {v.planoManutencao && (
                          <span className="text-[11px] text-slate-500">
                            A cada {v.planoManutencao.intervaloKm.toLocaleString()} km
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAbrirHistorico(v)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Ver histórico de manutenções"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirModalEdicao(v)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            title="Editar veículo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluirVeiculo(v)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Excluir veículo"
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

      {/* MODAL 1: Cadastro / Edição de Veículo */}
      <Modal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        title={veiculoEditando ? `Editar Veículo — ${veiculoEditando.placa}` : "Cadastrar Novo Veículo na Frota"}
      >
        <form onSubmit={handleSalvarVeiculo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Placa (Mercosul ou Padrão) *</label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="Ex: BRA2E19"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 uppercase font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Pesado">Pesado (Caminhão/Carreta)</option>
                <option value="Médio">Médio (Caminhão 3/4)</option>
                <option value="Leve">Leve (Van/Furgão)</option>
                <option value="Utilitário">Utilitário Geral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
              <input
                type="text"
                required
                placeholder="Ex: Volvo, Scania, Mercedes"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo *</label>
              <input
                type="text"
                required
                placeholder="Ex: FH 540 6x4"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ano *</label>
              <input
                type="number"
                required
                min={1990}
                max={new Date().getFullYear() + 1}
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quilometragem Atual (KM) *</label>
              <input
                type="number"
                required
                min={0}
                placeholder="Ex: 85000"
                value={formData.kmAtual}
                onChange={(e) => setFormData({ ...formData, kmAtual: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Plano Preventivo Vinculado</label>
              <select
                value={formData.planoManutencaoId}
                onChange={(e) => setFormData({ ...formData, planoManutencaoId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Nenhum plano</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (a cada {p.intervaloKm.toLocaleString()} km)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Motorista Responsável</label>
            <input
              type="text"
              placeholder="Ex: Marcos Oliveira"
              value={formData.motoristaResponsavel}
              onChange={(e) => setFormData({ ...formData, motoristaResponsavel: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              {salvando ? "Salvando..." : veiculoEditando ? "Salvar Alterações" : "Cadastrar Veículo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Atualização Rápida de Odômetro (KM) */}
      <Modal
        isOpen={!!veiculoAtualizarKm}
        onClose={() => setVeiculoAtualizarKm(null)}
        title={`Atualizar Odômetro — ${veiculoAtualizarKm?.placa}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAtualizarKm} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Informe a nova leitura do odômetro registrada para o veículo{" "}
            <strong>{veiculoAtualizarKm?.modelo}</strong>. A regra de negócio não permite retrocesso de quilometragem.
          </p>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Leitura Atual:</span>
            <span className="font-mono font-bold text-slate-200">
              {veiculoAtualizarKm?.kmAtual.toLocaleString()} km
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Novo KM Lido no Painel *</label>
            <input
              type="number"
              required
              min={veiculoAtualizarKm?.kmAtual || 0}
              placeholder="Ex: 95000"
              value={novoKmValor}
              onChange={(e) => setNovoKmValor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setVeiculoAtualizarKm(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Confirmar Leitura"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Histórico de Manutenções do Veículo */}
      <Modal
        isOpen={!!veiculoHistorico}
        onClose={() => setVeiculoHistorico(null)}
        title={`Histórico de Manutenções — ${veiculoHistorico?.placa}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-200">{veiculoHistorico?.marca} {veiculoHistorico?.modelo}</span>
              <p className="text-slate-500">KM Atual: {veiculoHistorico?.kmAtual.toLocaleString()} km</p>
            </div>
            <div>
              <span className="text-slate-400">Total de O.S.: </span>
              <strong className="text-indigo-400">{historicoOS.length}</strong>
            </div>
          </div>

          {carregandoHistorico ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Buscando histórico de Ordens de Serviço...
            </div>
          ) : historicoOS.length === 0 ? (
            <div className="py-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">Nenhuma Ordem de Serviço registrada para este veículo.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {historicoOS.map((os) => (
                <div key={os.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{os.codigoOS}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {os.tipo}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        os.status === "CONCLUIDA"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : os.status === "EM_ANDAMENTO"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {os.status}
                    </span>
                  </div>

                  <p className="text-slate-200">{os.descricao}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Mecânico: {os.mecanicoResponsavel}</span>
                    <span className="font-mono font-bold text-slate-200">
                      R$ {Number(os.valorTotalGeral || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
