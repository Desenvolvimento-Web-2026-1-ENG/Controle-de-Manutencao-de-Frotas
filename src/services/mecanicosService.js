/**
 * Service de Mecânicos (Prisma ORM / SQLite)
 */

const prisma = require("../config/prisma");

class MecanicosService {
  async listar() {
    return prisma.mecanico.findMany({
      orderBy: { id: "asc" }
    });
  }

  async buscarPorId(id) {
    const mecanico = await prisma.mecanico.findUnique({
      where: { id: Number(id) }
    });
    if (!mecanico) {
      const error = new Error(`Mecânico com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return mecanico;
  }

  async criar(dados) {
    if (!dados.nome || typeof dados.nome !== "string" || dados.nome.trim().length < 2) {
      const error = new Error("O campo 'nome' é obrigatório e deve ter no mínimo 2 caracteres.");
      error.statusCode = 400;
      throw error;
    }

    return prisma.mecanico.create({
      data: {
        nome: dados.nome.trim(),
        cargo: dados.cargo || "Mecânico",
        especialidade: dados.especialidade || "Geral",
        telefone: dados.telefone || null,
        status: dados.status || "DISPONIVEL"
      }
    });
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id);

    if (dados.nome !== undefined && (typeof dados.nome !== "string" || dados.nome.trim().length < 2)) {
      const error = new Error("O campo 'nome' não pode ser vazio.");
      error.statusCode = 400;
      throw error;
    }

    const updateData = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome.trim();
    if (dados.cargo !== undefined) updateData.cargo = dados.cargo;
    if (dados.especialidade !== undefined) updateData.especialidade = dados.especialidade;
    if (dados.telefone !== undefined) updateData.telefone = dados.telefone;
    if (dados.status !== undefined) updateData.status = dados.status;

    return prisma.mecanico.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async deletar(id) {
    await this.buscarPorId(id);
    await prisma.mecanico.delete({
      where: { id: Number(id) }
    });
    return true;
  }
}

module.exports = new MecanicosService();
