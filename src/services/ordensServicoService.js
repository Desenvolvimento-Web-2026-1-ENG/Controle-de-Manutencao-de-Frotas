/**
 * Service de Ordens de Serviço (O.S.)
 * Regras de negócio, cálculos financeiros de peças/mão de obra e transições de status
 */

const db = require("../data/database");

class OrdensServicoService {
  listar(filtros) {
    return db.listarOrdensServico(filtros);
  }

  buscarPorId(id) {
    const os = db.buscarOSPorId(id);
    if (!os) {
      const error = new Error(`Ordem de Serviço com ID ${id} não encontrada.`);
      error.statusCode = 404;
      throw error;
    }
    return os;
  }

  criar(dados) {
    if (!dados.veiculoId || !dados.descricao) {
      const error = new Error("Campos obrigatórios ausentes: veiculoId e descricao.");
      error.statusCode = 400;
      throw error;
    }

    const veiculo = db.buscarVeiculoPorId(dados.veiculoId);
    if (!veiculo) {
      const error = new Error(`Veículo com ID ${dados.veiculoId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    // Se kmNoMomento não for informado, assume o kmAtual do veículo
    if (dados.kmNoMomento === undefined || dados.kmNoMomento === null) {
      dados.kmNoMomento = veiculo.kmAtual;
    }

    return db.criarOS(dados);
  }

  atualizar(id, dados) {
    this.buscarPorId(id);

    if (dados.veiculoId) {
      const veiculo = db.buscarVeiculoPorId(dados.veiculoId);
      if (!veiculo) {
        const error = new Error(`Veículo com ID ${dados.veiculoId} não encontrado.`);
        error.statusCode = 404;
        throw error;
      }
    }

    return db.atualizarOS(id, dados);
  }

  alterarStatus(id, novoStatus, observacoes) {
    this.buscarPorId(id);

    const statusValidos = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];
    if (!novoStatus || !statusValidos.includes(novoStatus.toUpperCase())) {
      const error = new Error(`Status inválido. Status permitidos: ${statusValidos.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    return db.alterarStatusOS(id, novoStatus, observacoes);
  }

  deletar(id) {
    const os = this.buscarPorId(id);

    if (os.status === "EM_ANDAMENTO") {
      const error = new Error("Não é possível excluir uma Ordem de Serviço em andamento. Altere o status para CANCELADA antes de excluir.");
      error.statusCode = 400;
      throw error;
    }

    return db.deletarOS(id);
  }
}

module.exports = new OrdensServicoService();
