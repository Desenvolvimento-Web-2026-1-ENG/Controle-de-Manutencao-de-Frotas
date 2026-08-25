/**
 * Service de Dashboard e Alertas
 * Fornece métricas consolidadas e relatórios analíticos de manutenção
 */

const db = require("../data/database");

class DashboardService {
  obterResumo() {
    const veiculos = db.listarVeiculos();
    const ordensServico = db.listarOrdensServico();
    const planos = db.listarPlanos();

    const totalVeiculos = veiculos.length;
    const veiculosEmOperacao = veiculos.filter((v) => v.status === "EM_OPERACAO").length;
    const veiculosEmManutencao = veiculos.filter((v) => v.status === "EM_MANUTENCAO").length;

    const veiculosRevisaoCritica = veiculos.filter((v) => v.alertaRevisao.nivelAlerta === "CRITICO");
    const veiculosRevisaoAtencao = veiculos.filter((v) => v.alertaRevisao.nivelAlerta === "ATENCAO");
    const veiculosRevisaoEmDia = veiculos.filter((v) => v.alertaRevisao.nivelAlerta === "NORMAL");

    const osAbertas = ordensServico.filter((os) => os.status === "ABERTA").length;
    const osEmAndamento = ordensServico.filter((os) => os.status === "EM_ANDAMENTO").length;
    const osConcluidas = ordensServico.filter((os) => os.status === "CONCLUIDA").length;
    const osCanceladas = ordensServico.filter((os) => os.status === "CANCELADA").length;

    // Métricas financeiras
    const totalGastoManutencoes = ordensServico
      .filter((os) => os.status === "CONCLUIDA")
      .reduce((acc, os) => acc + (os.valorTotalGeral || 0), 0);

    const totalGastoPecas = ordensServico
      .filter((os) => os.status === "CONCLUIDA")
      .reduce((acc, os) => acc + (os.valorTotalPecas || 0), 0);

    const totalGastoMaoDeObra = ordensServico
      .filter((os) => os.status === "CONCLUIDA")
      .reduce((acc, os) => acc + (os.valorTotalMaoDeObra || 0), 0);

    return {
      frota: {
        totalVeiculos,
        emOperacao: veiculosEmOperacao,
        emManutencao: veiculosEmManutencao,
        revisaoCritica: veiculosRevisaoCritica.length,
        revisaoAtencao: veiculosRevisaoAtencao.length,
        revisaoEmDia: veiculosRevisaoEmDia.length,
        totalPlanosAtivos: planos.length
      },
      ordensServico: {
        total: ordensServico.length,
        abertas: osAbertas,
        emAndamento: osEmAndamento,
        concluidas: osConcluidas,
        canceladas: osCanceladas
      },
      financeiro: {
        totalGastoGeral: Number(totalGastoManutencoes.toFixed(2)),
        totalGastoPecas: Number(totalGastoPecas.toFixed(2)),
        totalGastoMaoDeObra: Number(totalGastoMaoDeObra.toFixed(2)),
        custoMedioPorOS: osConcluidas > 0 ? Number((totalGastoManutencoes / osConcluidas).toFixed(2)) : 0
      }
    };
  }

  obterAlertas() {
    const veiculos = db.listarVeiculos();

    const criticos = veiculos
      .filter((v) => v.alertaRevisao.nivelAlerta === "CRITICO")
      .map((v) => ({
        veiculoId: v.id,
        placa: v.placa,
        modelo: `${v.marca} ${v.modelo}`,
        motorista: v.motoristaResponsavel,
        kmAtual: v.kmAtual,
        kmProximaRevisao: v.kmProximaRevisao,
        dataProximaRevisao: v.dataProximaRevisao,
        plano: v.planoManutencao ? v.planoManutencao.nome : "Sem plano",
        gravidade: "CRÍTICA (Revisão Imediata)",
        motivos: v.alertaRevisao.motivos,
        acaoRecomendada: "Abrir Ordem de Serviço Preventiva imediatamente e retirar veículo de rotas longas."
      }));

    const atencao = veiculos
      .filter((v) => v.alertaRevisao.nivelAlerta === "ATENCAO")
      .map((v) => ({
        veiculoId: v.id,
        placa: v.placa,
        modelo: `${v.marca} ${v.modelo}`,
        motorista: v.motoristaResponsavel,
        kmAtual: v.kmAtual,
        kmProximaRevisao: v.kmProximaRevisao,
        dataProximaRevisao: v.dataProximaRevisao,
        plano: v.planoManutencao ? v.planoManutencao.nome : "Sem plano",
        gravidade: "ATENÇÃO (Revisão Próxima)",
        motivos: v.alertaRevisao.motivos,
        acaoRecomendada: "Programar agendamento de manutenção para os próximos dias."
      }));

    return {
      totalAlertas: criticos.length + atencao.length,
      alertasCriticos: criticos,
      alertasAtencao: atencao
    };
  }
}

module.exports = new DashboardService();
