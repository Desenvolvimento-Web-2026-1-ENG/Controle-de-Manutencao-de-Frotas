/**
 * Service de Mecânicos
 */

const db = require("../data/database");

class MecanicosService {
  listar() {
    return db.listarMecanicos();
  }

  buscarPorId(id) {
    const mecanico = db.buscarMecanicoPorId(id);
    if (!mecanico) {
      const error = new Error(`Mecânico com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return mecanico;
  }

  criar(dados) {
    if (!dados.nome || typeof dados.nome !== "string" || dados.nome.trim().length < 2) {
      const error = new Error("O campo 'nome' é obrigatório e deve ter no mínimo 2 caracteres.");
      error.statusCode = 400;
      throw error;
    }
    return db.criarMecanico(dados);
  }

  atualizar(id, dados) {
    this.buscarPorId(id); // Garante 404 se não existir

    if (dados.nome !== undefined && (typeof dados.nome !== "string" || dados.nome.trim().length < 2)) {
      const error = new Error("O campo 'nome' não pode ser vazio.");
      error.statusCode = 400;
      throw error;
    }

    return db.atualizarMecanico(id, dados);
  }

  deletar(id) {
    this.buscarPorId(id); // Garante 404 se não existir
    return db.deletarMecanico(id);
  }
}

module.exports = new MecanicosService();
