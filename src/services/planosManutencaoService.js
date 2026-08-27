/**
 * Service de Planos de Manutenção (Prisma ORM / SQLite)
 * Regras de negócio e validações para os planos preventivos
 */

const prisma = require("../config/prisma");

class PlanosManutencaoService {
  _formatarPlano(plano) {
    if (!plano) return null;
    let itens = [];
    if (typeof plano.itensChecagem === "string") {
      try {
        itens = JSON.parse(plano.itensChecagem);
      } catch {
        itens = plano.itensChecagem.split(",").map((i) => i.trim());
      }
    } else if (Array.isArray(plano.itensChecagem)) {
      itens = plano.itensChecagem;
    }
    return {
      ...plano,
      itensChecagem: itens
    };
  }

  async listar() {
    const planos = await prisma.planoManutencao.findMany({
      orderBy: { id: "asc" }
    });
    return planos.map((p) => this._formatarPlano(p));
  }

  async buscarPorId(id) {
    const plano = await prisma.planoManutencao.findUnique({
      where: { id: Number(id) }
    });
    if (!plano) {
      const error = new Error(`Plano de manutenção com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return this._formatarPlano(plano);
  }

  async criar(dados) {
    if (!dados.nome || !dados.intervaloKm || !dados.intervaloMeses) {
      const error = new Error("Campos obrigatórios: nome, intervaloKm e intervaloMeses.");
      error.statusCode = 400;
      throw error;
    }

    const km = Number(dados.intervaloKm);
    const meses = Number(dados.intervaloMeses);

    if (isNaN(km) || km <= 0 || isNaN(meses) || meses <= 0) {
      const error = new Error("intervaloKm e intervaloMeses devem ser valores positivos.");
      error.statusCode = 400;
      throw error;
    }

    const novoPlano = await prisma.planoManutencao.create({
      data: {
        nome: dados.nome.trim(),
        descricao: dados.descricao || "",
        intervaloKm: km,
        intervaloMeses: meses,
        itensChecagem: JSON.stringify(dados.itensChecagem || [])
      }
    });

    return this._formatarPlano(novoPlano);
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id);

    const updateData = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome.trim();
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao;
    if (dados.itensChecagem !== undefined) updateData.itensChecagem = JSON.stringify(dados.itensChecagem);

    if (dados.intervaloKm !== undefined) {
      const km = Number(dados.intervaloKm);
      if (isNaN(km) || km <= 0) {
        const error = new Error("intervaloKm deve ser um valor positivo.");
        error.statusCode = 400;
        throw error;
      }
      updateData.intervaloKm = km;
    }

    if (dados.intervaloMeses !== undefined) {
      const meses = Number(dados.intervaloMeses);
      if (isNaN(meses) || meses <= 0) {
        const error = new Error("intervaloMeses deve ser um valor positivo.");
        error.statusCode = 400;
        throw error;
      }
      updateData.intervaloMeses = meses;
    }

    const planoAtualizado = await prisma.planoManutencao.update({
      where: { id: Number(id) },
      data: updateData
    });

    return this._formatarPlano(planoAtualizado);
  }

  async deletar(id) {
    await this.buscarPorId(id);

    // Verificar se há veículos vinculados a esse plano
    const veiculosCount = await prisma.veiculo.count({
      where: { planoManutencaoId: Number(id) }
    });

    if (veiculosCount > 0) {
      const error = new Error(`Não é possível excluir este plano pois existem ${veiculosCount} veículo(s) vinculado(s) a ele.`);
      error.statusCode = 400;
      throw error;
    }

    await prisma.planoManutencao.delete({
      where: { id: Number(id) }
    });

    return true;
  }
}

module.exports = new PlanosManutencaoService();
