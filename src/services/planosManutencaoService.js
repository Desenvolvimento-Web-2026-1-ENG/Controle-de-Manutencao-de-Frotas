/**
 * Service de Planos de Manutenção
 * Regras de negócio e validações para os planos preventivos
 */

const db = require("../data/database");

class PlanosManutencaoService {
  listar() {
    return db.listarPlanos();
  }

  buscarPorId(id) {
    const plano = db.buscarPlanoPorId(id);
    if (!plano) {
      const error = new Error(`Plano de manutenção com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return plano;
  }

  criar(dados) {
    if (!dados.nome || !dados.intervaloKm || !dados.intervaloMeses) {
      const error = new Error("Campos obrigatórios: nome, intervaloKm e intervaloMeses.");
      error.statusCode = 400;
      throw error;
    }

    if (Number(dados.intervaloKm) <= 0 || Number(dados.intervaloMeses) <= 0) {
      const error = new Error("intervaloKm e intervaloMeses devem ser valores positivos.");
      error.statusCode = 400;
      throw error;
    }

    return db.criarPlano(dados);
  }

  atualizar(id, dados) {
    this.buscarPorId(id);

    if (dados.intervaloKm !== undefined && Number(dados.intervaloKm) <= 0) {
      const error = new Error("intervaloKm deve ser um valor positivo.");
      error.statusCode = 400;
      throw error;
    }

    if (dados.intervaloMeses !== undefined && Number(dados.intervaloMeses) <= 0) {
      const error = new Error("intervaloMeses deve ser um valor positivo.");
      error.statusCode = 400;
      throw error;
    }

    return db.atualizarPlano(id, dados);
  }

  deletar(id) {
    this.buscarPorId(id);

    // Verificar se há veículos vinculados a esse plano
    const veiculosComPlano = db.listarVeiculos().filter((v) => v.planoManutencaoId === Number(id));
    if (veiculosComPlano.length > 0) {
      const error = new Error(`Não é possível excluir este plano pois existem ${veiculosComPlano.length} veículo(s) vinculado(s) a ele.`);
      error.statusCode = 400;
      throw error;
    }

    return db.deletarPlano(id);
  }
}

module.exports = new PlanosManutencaoService();
