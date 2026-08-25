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
    if (!dados.nome) {
      const error = new Error("O campo 'nome' é obrigatório para cadastrar o mecânico.");
      error.statusCode = 400;
      throw error;
    }
    return db.criarMecanico(dados);
  }
}

module.exports = new MecanicosService();
