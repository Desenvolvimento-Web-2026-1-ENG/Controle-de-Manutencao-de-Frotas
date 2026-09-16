/**
 * Service de Ordens de Serviço (O.S.) (Prisma ORM / SQLite)
 * Regras de negócio, cálculos financeiros de peças/mão de obra e transições de status com recálculo de revisões
 */

const prisma = require("../config/prisma");

function adicionarMesesSeguro(dataBase, meses) {
  const data = new Date(dataBase);
  const diaEsperado = data.getDate();
  data.setMonth(data.getMonth() + meses);
  if (data.getDate() !== diaEsperado) {
    data.setDate(0);
  }
  return data;
}

class OrdensServicoService {
  _formatarOS(os) {
    if (!os) return null;
    let pecas = [];
    let maoDeObra = { descricao: "Serviço mecânico", horas: 0, valorHora: 0, valorTotal: 0 };

    try {
      if (os.pecasJson) pecas = typeof os.pecasJson === "string" ? JSON.parse(os.pecasJson) : os.pecasJson;
    } catch {}

    try {
      if (os.maoDeObraJson) maoDeObra = typeof os.maoDeObraJson === "string" ? JSON.parse(os.maoDeObraJson) : os.maoDeObraJson;
    } catch {}

    return {
      id: os.id,
      codigoOS: os.codigoOS,
      veiculoId: os.veiculoId,
      tipo: os.tipo,
      status: os.status,
      mecanicoResponsavel: os.mecanicoResponsavel,
      kmNoMomento: os.kmNoMomento,
      dataAbertura: os.dataAbertura instanceof Date ? os.dataAbertura.toISOString() : os.dataAbertura,
      dataPrevisao: os.dataPrevisao ? (os.dataPrevisao instanceof Date ? os.dataPrevisao.toISOString() : os.dataPrevisao) : null,
      dataConclusao: os.dataConclusao ? (os.dataConclusao instanceof Date ? os.dataConclusao.toISOString() : os.dataConclusao) : null,
      descricao: os.descricao,
      pecas: pecas,
      maoDeObra: maoDeObra,
      valorTotalPecas: os.valorTotalPecas,
      valorTotalMaoDeObra: os.valorTotalMaoDeObra,
      valorTotalGeral: os.valorTotalGeral,
      observacoes: os.observacoes || "",
      criadoEm: os.criadoEm instanceof Date ? os.criadoEm.toISOString() : os.criadoEm,
      veiculo: os.veiculo
        ? {
            id: os.veiculo.id,
            placa: os.veiculo.placa,
            marca: os.veiculo.marca,
            modelo: os.veiculo.modelo,
            kmAtual: os.veiculo.kmAtual
          }
        : null
    };
  }

  async listar(filtros = {}) {
    const where = {};

    if (filtros.status) {
      where.status = filtros.status.toUpperCase();
    }
    if (filtros.tipo) {
      where.tipo = filtros.tipo.toUpperCase();
    }
    if (filtros.veiculoId) {
      where.veiculoId = Number(filtros.veiculoId);
    }
    if (filtros.mecanico) {
      where.mecanicoResponsavel = { contains: filtros.mecanico };
    }

    const ordens = await prisma.ordemServico.findMany({
      where,
      include: { veiculo: true },
      orderBy: { id: "desc" }
    });

    return ordens.map((os) => this._formatarOS(os));
  }

  async buscarPorId(id) {
    const os = await prisma.ordemServico.findUnique({
      where: { id: Number(id) },
      include: { veiculo: true }
    });

    if (!os) {
      const error = new Error(`Ordem de Serviço com ID ${id} não encontrada.`);
      error.statusCode = 404;
      throw error;
    }

    return this._formatarOS(os);
  }

  async criar(dados) {
    if (!dados.veiculoId || !dados.descricao) {
      const error = new Error("Campos obrigatórios ausentes: veiculoId e descricao.");
      error.statusCode = 400;
      throw error;
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: { id: Number(dados.veiculoId) }
    });

    if (!veiculo) {
      const error = new Error(`Veículo com ID ${dados.veiculoId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    const anoAtual = new Date().getFullYear();
    const prefixo = `OS-${anoAtual}-`;
    const todasOS = await prisma.ordemServico.findMany({
      where: {
        codigoOS: {
          startsWith: prefixo
        }
      },
      select: { codigoOS: true }
    });

    let maiorNum = 0;
    for (const item of todasOS) {
      const parteNum = item.codigoOS.replace(prefixo, "");
      const n = parseInt(parteNum, 10);
      if (!isNaN(n) && n > maiorNum) {
        maiorNum = n;
      }
    }
    const codigoOS = `${prefixo}${String(maiorNum + 1).padStart(3, "0")}`;

    const pecasProcessadas = (dados.pecas || []).map((p) => {
      const qtd = Math.max(1, Number(p.quantidade) || 1);
      const unit = Math.max(0, Number(p.valorUnitario) || 0);
      return {
        item: p.item || p.descricao || "Item",
        quantidade: qtd,
        valorUnitario: unit,
        valorTotal: qtd * unit
      };
    });
    const valorTotalPecas = pecasProcessadas.reduce((acc, p) => acc + p.valorTotal, 0);

    let maoDeObra = { descricao: "Serviço mecânico", horas: 0, valorHora: 0, valorTotal: 0 };
    if (dados.maoDeObra) {
      const horas = Math.max(0, Number(dados.maoDeObra.horas) || 0);
      const valorHora = Math.max(0, Number(dados.maoDeObra.valorHora) || 0);
      const valorFixo = Math.max(0, Number(dados.maoDeObra.valorTotal) || 0);
      const totalMo = valorFixo > 0 ? valorFixo : horas * valorHora;

      maoDeObra = {
        descricao: dados.maoDeObra.descricao || "Mão de obra",
        horas: horas,
        valorHora: valorHora,
        valorTotal: totalMo
      };
    }
    const valorTotalMaoDeObra = maoDeObra.valorTotal;
    const valorTotalGeral = valorTotalPecas + valorTotalMaoDeObra;

    const kmNoMomento = dados.kmNoMomento !== undefined && dados.kmNoMomento !== null
      ? Number(dados.kmNoMomento)
      : veiculo.kmAtual;

    const statusInicial = dados.status ? dados.status.toUpperCase() : "ABERTA";

    const novaOS = await prisma.$transaction(async (tx) => {
      const osCriada = await tx.ordemServico.create({
        data: {
          codigoOS: codigoOS,
          veiculoId: Number(dados.veiculoId),
          tipo: dados.tipo ? dados.tipo.toUpperCase() : "PREVENTIVA",
          status: statusInicial,
          mecanicoResponsavel: dados.mecanicoResponsavel || "Carlos Silva (Mecânico Chefe)",
          kmNoMomento: kmNoMomento,
          dataAbertura: dados.dataAbertura ? new Date(dados.dataAbertura) : new Date(),
          dataPrevisao: dados.dataPrevisao ? new Date(dados.dataPrevisao) : null,
          dataConclusao: statusInicial === "CONCLUIDA" ? new Date() : null,
          descricao: dados.descricao,
          pecasJson: JSON.stringify(pecasProcessadas),
          maoDeObraJson: JSON.stringify(maoDeObra),
          valorTotalPecas: valorTotalPecas,
          valorTotalMaoDeObra: valorTotalMaoDeObra,
          valorTotalGeral: valorTotalGeral,
          observacoes: dados.observacoes || ""
        },
        include: { veiculo: true }
      });

      if (statusInicial === "EM_ANDAMENTO") {
        await tx.veiculo.update({
          where: { id: Number(dados.veiculoId) },
          data: { status: "EM_MANUTENCAO" }
        });
      }

      return osCriada;
    });

    return this._formatarOS(novaOS);
  }

  async atualizar(id, dados) {
    const osAtual = await this.buscarPorId(id);

    if (dados.veiculoId) {
      const veiculo = await prisma.veiculo.findUnique({
        where: { id: Number(dados.veiculoId) }
      });
      if (!veiculo) {
        const error = new Error(`Veículo com ID ${dados.veiculoId} não encontrado.`);
        error.statusCode = 404;
        throw error;
      }
    }

    let pecasProcessadas = osAtual.pecas;
    let valorTotalPecas = osAtual.valorTotalPecas;
    if (dados.pecas) {
      pecasProcessadas = dados.pecas.map((p) => {
        const qtd = Number(p.quantidade) || 1;
        const unit = Number(p.valorUnitario) || 0;
        return {
          item: p.item,
          quantidade: qtd,
          valorUnitario: unit,
          valorTotal: qtd * unit
        };
      });
      valorTotalPecas = pecasProcessadas.reduce((acc, p) => acc + p.valorTotal, 0);
    }

    let maoDeObra = osAtual.maoDeObra;
    let valorTotalMaoDeObra = osAtual.valorTotalMaoDeObra;
    if (dados.maoDeObra) {
      const horas = Number(dados.maoDeObra.horas) || 0;
      const valorHora = Number(dados.maoDeObra.valorHora) || 0;
      const valorFixo = Number(dados.maoDeObra.valorTotal) || 0;
      const totalMo = valorFixo > 0 ? valorFixo : horas * valorHora;
      maoDeObra = {
        descricao: dados.maoDeObra.descricao || maoDeObra.descricao,
        horas: horas,
        valorHora: valorHora,
        valorTotal: totalMo
      };
      valorTotalMaoDeObra = maoDeObra.valorTotal;
    }

    const valorTotalGeral = valorTotalPecas + valorTotalMaoDeObra;

    const updateData = {};
    if (dados.veiculoId !== undefined) updateData.veiculoId = Number(dados.veiculoId);
    if (dados.tipo !== undefined) updateData.tipo = dados.tipo.toUpperCase();
    if (dados.mecanicoResponsavel !== undefined) updateData.mecanicoResponsavel = dados.mecanicoResponsavel;
    if (dados.kmNoMomento !== undefined) updateData.kmNoMomento = Number(dados.kmNoMomento);
    if (dados.dataPrevisao !== undefined) updateData.dataPrevisao = dados.dataPrevisao ? new Date(dados.dataPrevisao) : null;
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao;
    if (dados.observacoes !== undefined) updateData.observacoes = dados.observacoes;

    updateData.pecasJson = JSON.stringify(pecasProcessadas);
    updateData.maoDeObraJson = JSON.stringify(maoDeObra);
    updateData.valorTotalPecas = valorTotalPecas;
    updateData.valorTotalMaoDeObra = valorTotalMaoDeObra;
    updateData.valorTotalGeral = valorTotalGeral;

    const osAtualizada = await prisma.ordemServico.update({
      where: { id: Number(id) },
      data: updateData,
      include: { veiculo: true }
    });

    return this._formatarOS(osAtualizada);
  }

  async alterarStatus(id, novoStatus, observacoes) {
    const os = await this.buscarPorId(id);

    const statusValidos = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];
    const statusNormalizado = novoStatus ? novoStatus.toUpperCase().trim() : "";

    if (!statusNormalizado || !statusValidos.includes(statusNormalizado)) {
      const error = new Error(`Status inválido. Status permitidos: ${statusValidos.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    const statusAnterior = os.status;
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: os.veiculoId },
      include: { planoManutencao: true }
    });

    const updateData = { status: statusNormalizado };
    if (observacoes) {
      updateData.observacoes = os.observacoes ? `${os.observacoes}\n${observacoes}` : observacoes;
    }

    const osResultado = await prisma.$transaction(async (tx) => {
      if (statusNormalizado === "EM_ANDAMENTO" && veiculo) {
        await tx.veiculo.update({
          where: { id: veiculo.id },
          data: { status: "EM_MANUTENCAO" }
        });
      }

      if (statusNormalizado === "CONCLUIDA") {
        updateData.dataConclusao = new Date();

        if (veiculo) {
          let novoKm = veiculo.kmAtual;
          if (os.kmNoMomento && os.kmNoMomento > veiculo.kmAtual) {
            novoKm = os.kmNoMomento;
          }

          const veiculoUpdate = {
            kmAtual: novoKm,
            status: "EM_OPERACAO"
          };

          if (os.tipo === "PREVENTIVA" && veiculo.planoManutencaoId && veiculo.planoManutencao) {
            const plano = veiculo.planoManutencao;
            veiculoUpdate.kmProximaRevisao = novoKm + plano.intervaloKm;
            veiculoUpdate.dataProximaRevisao = adicionarMesesSeguro(new Date(), plano.intervaloMeses);
          }

          await tx.veiculo.update({
            where: { id: veiculo.id },
            data: veiculoUpdate
          });
        }
      }

      if (statusNormalizado === "CANCELADA" && veiculo && statusAnterior === "EM_ANDAMENTO") {
        await tx.veiculo.update({
          where: { id: veiculo.id },
          data: { status: "EM_OPERACAO" }
        });
      }

      return tx.ordemServico.update({
        where: { id: Number(id) },
        data: updateData,
        include: { veiculo: true }
      });
    });

    return this._formatarOS(osResultado);
  }

  async deletar(id) {
    const os = await this.buscarPorId(id);

    if (os.status === "EM_ANDAMENTO") {
      const error = new Error("Não é possível excluir uma Ordem de Serviço em andamento. Altere o status para CANCELADA antes de excluir.");
      error.statusCode = 400;
      throw error;
    }

    await prisma.ordemServico.delete({
      where: { id: Number(id) }
    });

    return true;
  }
}

module.exports = new OrdensServicoService();
