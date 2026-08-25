/**
 * Service de Veículos
 * Contém as regras de negócio para a gestão da frota de veículos
 */

const db = require("../data/database");

class VeiculosService {
  listar(filtros) {
    return db.listarVeiculos(filtros);
  }

  buscarPorId(id) {
    const veiculo = db.buscarVeiculoPorId(id);
    if (!veiculo) {
      const error = new Error(`Veículo com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return veiculo;
  }

  buscarPorPlaca(placa) {
    return db.buscarVeiculoPorPlaca(placa);
  }

  criar(dados) {
    if (!dados.placa || !dados.marca || !dados.modelo || !dados.ano || dados.kmAtual === undefined) {
      const error = new Error("Campos obrigatórios ausentes: placa, marca, modelo, ano e kmAtual.");
      error.statusCode = 400;
      throw error;
    }

    // Validar duplicidade de placa
    const veiculoExistente = db.buscarVeiculoPorPlaca(dados.placa);
    if (veiculoExistente) {
      const error = new Error(`Já existe um veículo cadastrado com a placa ${dados.placa.toUpperCase()}.`);
      error.statusCode = 409;
      throw error;
    }

    // Validar existência do plano se informado
    if (dados.planoManutencaoId) {
      const plano = db.buscarPlanoPorId(dados.planoManutencaoId);
      if (!plano) {
        const error = new Error(`Plano de manutenção com ID ${dados.planoManutencaoId} não encontrado.`);
        error.statusCode = 400;
        throw error;
      }
    }

    return db.criarVeiculo(dados);
  }

  atualizar(id, dados) {
    this.buscarPorId(id); // Garante que existe ou lança 404

    if (dados.placa) {
      const veiculoComMesmaPlaca = db.buscarVeiculoPorPlaca(dados.placa);
      if (veiculoComMesmaPlaca && veiculoComMesmaPlaca.id !== Number(id)) {
        const error = new Error(`A placa ${dados.placa.toUpperCase()} já pertence a outro veículo.`);
        error.statusCode = 409;
        throw error;
      }
    }

    if (dados.planoManutencaoId) {
      const plano = db.buscarPlanoPorId(dados.planoManutencaoId);
      if (!plano) {
        const error = new Error(`Plano de manutenção com ID ${dados.planoManutencaoId} não encontrado.`);
        error.statusCode = 400;
        throw error;
      }
    }

    return db.atualizarVeiculo(id, dados);
  }

  atualizarKm(id, novoKm) {
    const veiculo = this.buscarPorId(id);

    if (novoKm === undefined || isNaN(Number(novoKm)) || Number(novoKm) < 0) {
      const error = new Error("Quilometragem (KM) inválida.");
      error.statusCode = 400;
      throw error;
    }

    if (Number(novoKm) < veiculo.kmAtual) {
      const error = new Error(`O novo KM (${novoKm}) não pode ser inferior ao KM atual registrado (${veiculo.kmAtual}).`);
      error.statusCode = 400;
      throw error;
    }

    return db.atualizarKmVeiculo(id, novoKm);
  }

  deletar(id) {
    this.buscarPorId(id);

    // Verificar se o veículo possui ordens de serviço ativas
    const osAtivas = db.listarOrdensServico({ veiculoId: id }).filter(
      (os) => os.status === "ABERTA" || os.status === "EM_ANDAMENTO"
    );

    if (osAtivas.length > 0) {
      const error = new Error("Não é possível excluir o veículo pois existem Ordens de Serviço abertas ou em andamento vinculadas a ele.");
      error.statusCode = 400;
      throw error;
    }

    return db.deletarVeiculo(id);
  }

  listarRevisaoImediata() {
    const veiculos = db.listarVeiculos();
    return veiculos.filter((v) => v.alertaRevisao.nivelAlerta === "CRITICO");
  }

  buscarHistorico(veiculoId) {
    this.buscarPorId(veiculoId);
    return db.listarHistoricoPorVeiculo(veiculoId);
  }
}

module.exports = new VeiculosService();
