/**
 * Service de Veículos (Prisma ORM / SQLite)
 * Contém as regras de negócio e cálculo inteligente de alertas de revisão
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

class VeiculosService {
  // ==============================================================================
  // [REGRA DE NEGÓCIO PRINCIPAL: MOTOR PROATIVO DE ALERTAS DE REVISÃO]
  // Avalia o odômetro e calendário preventivo em tempo real:
  // - CRÍTICO: KM atual >= KM próxima revisão OU Data atual >= Data próxima revisão.
  // - ATENÇÃO: Faltam <= 1.000 KM OU <= 15 dias para o vencimento preventivo.
  // - NORMAL: Veículo operando dentro dos parâmetros de conformidade da fábrica.
  // ==============================================================================
  _calcularAlertaRevisao(veiculo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const kmAtual = Number(veiculo.kmAtual) || 0;
    const kmRevisao = Number(veiculo.kmProximaRevisao) || 0;
    const kmDiferenca = kmRevisao > 0 ? kmRevisao - kmAtual : null;

    let dataRevisaoObj = null;
    let diasRestantes = null;

    if (veiculo.dataProximaRevisao) {
      dataRevisaoObj = new Date(veiculo.dataProximaRevisao);
      dataRevisaoObj.setHours(0, 0, 0, 0);
      const diffTime = dataRevisaoObj.getTime() - hoje.getTime();
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const kmVencido = kmDiferenca !== null && kmDiferenca <= 0;
    const dataVencida = diasRestantes !== null && diasRestantes <= 0;
    const kmProximo = kmDiferenca !== null && kmDiferenca > 0 && kmDiferenca <= 1000;
    const dataProxima = diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 15;

    let nivelAlerta = "NORMAL";
    let necessitaAtencao = false;
    let motivos = [];

    if (kmVencido || dataVencida) {
      nivelAlerta = "CRITICO";
      necessitaAtencao = true;
      if (kmVencido) motivos.push(`KM de revisão ultrapassado em ${Math.abs(kmDiferenca)} km`);
      if (dataVencida) motivos.push(`Data de revisão vencida há ${Math.abs(diasRestantes)} dias`);
    } else if (kmProximo || dataProxima) {
      nivelAlerta = "ATENCAO";
      necessitaAtencao = true;
      if (kmProximo) motivos.push(`Faltam apenas ${kmDiferenca} km para a revisão preventiva`);
      if (dataProxima) motivos.push(`Revisão prevista para daqui a ${diasRestantes} dias`);
    }

    return {
      nivelAlerta,
      necessitaAtencao,
      kmDiferenca,
      diasRestantes,
      kmVencido,
      dataVencida,
      motivos: motivos.length > 0 ? motivos : ["Veículo com plano de manutenção em dia"]
    };
  }

  _enriquecerVeiculo(veiculo) {
    if (!veiculo) return null;
    const dataRevisaoStr = veiculo.dataProximaRevisao instanceof Date
      ? veiculo.dataProximaRevisao.toISOString().split("T")[0]
      : veiculo.dataProximaRevisao;

    const vNorm = {
      ...veiculo,
      dataProximaRevisao: dataRevisaoStr,
      planoManutencao: veiculo.planoManutencao
        ? {
            id: veiculo.planoManutencao.id,
            nome: veiculo.planoManutencao.nome,
            intervaloKm: veiculo.planoManutencao.intervaloKm,
            intervaloMeses: veiculo.planoManutencao.intervaloMeses
          }
        : null
    };

    return {
      ...vNorm,
      alertaRevisao: this._calcularAlertaRevisao(vNorm)
    };
  }

  async listar(filtros = {}) {
    const where = {};

    if (filtros.status) {
      where.status = filtros.status;
    }
    if (filtros.marca) {
      where.marca = { contains: filtros.marca };
    }
    if (filtros.modelo) {
      where.modelo = { contains: filtros.modelo };
    }
    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }

    const veiculos = await prisma.veiculo.findMany({
      where,
      include: { planoManutencao: true },
      orderBy: { id: "asc" }
    });

    let resultado = veiculos.map((v) => this._enriquecerVeiculo(v));

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.placa.toLowerCase().includes(termo) ||
          v.marca.toLowerCase().includes(termo) ||
          v.modelo.toLowerCase().includes(termo) ||
          (v.motoristaResponsavel && v.motoristaResponsavel.toLowerCase().includes(termo))
      );
    }

    if (filtros.apenasAlertas === "true" || filtros.apenasAlertas === true) {
      resultado = resultado.filter((v) => v.alertaRevisao.necessitaAtencao);
    }

    return resultado;
  }

  async buscarPorId(id) {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: Number(id) },
      include: { planoManutencao: true }
    });

    if (!veiculo) {
      const error = new Error(`Veículo com ID ${id} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    return this._enriquecerVeiculo(veiculo);
  }

  async buscarPorPlaca(placa) {
    const veiculo = await prisma.veiculo.findUnique({
      where: { placa: placa.toUpperCase().trim() },
      include: { planoManutencao: true }
    });
    return this._enriquecerVeiculo(veiculo);
  }

  async criar(dados) {
    if (!dados.placa || !dados.marca || !dados.modelo || !dados.ano || dados.kmAtual === undefined) {
      const error = new Error("Campos obrigatórios ausentes: placa, marca, modelo, ano e kmAtual.");
      error.statusCode = 400;
      throw error;
    }

    const placaFormatada = dados.placa.toUpperCase().trim();
    const veiculoExistente = await prisma.veiculo.findUnique({
      where: { placa: placaFormatada }
    });

    if (veiculoExistente) {
      const error = new Error(`Já existe um veículo cadastrado com a placa ${placaFormatada}.`);
      error.statusCode = 409;
      throw error;
    }

    let plano = null;
    let planoId = dados.planoManutencaoId ? Number(dados.planoManutencaoId) : null;
    if (planoId) {
      plano = await prisma.planoManutencao.findUnique({ where: { id: planoId } });
      if (!plano) {
        const error = new Error(`Plano de manutenção com ID ${planoId} não encontrado.`);
        error.statusCode = 400;
        throw error;
      }
    }

    const kmAtual = Number(dados.kmAtual) || 0;
    let kmProximaRevisao = dados.kmProximaRevisao ? Number(dados.kmProximaRevisao) : null;
    let dataProximaRevisao = dados.dataProximaRevisao ? new Date(dados.dataProximaRevisao) : null;

    if (plano) {
      if (!kmProximaRevisao) {
        kmProximaRevisao = kmAtual + plano.intervaloKm;
      }
      if (!dataProximaRevisao) {
        dataProximaRevisao = adicionarMesesSeguro(new Date(), plano.intervaloMeses);
      }
    }

    const novoVeiculo = await prisma.veiculo.create({
      data: {
        placa: placaFormatada,
        marca: dados.marca,
        modelo: dados.modelo,
        ano: Number(dados.ano),
        kmAtual: kmAtual,
        kmProximaRevisao: kmProximaRevisao,
        dataProximaRevisao: dataProximaRevisao,
        planoManutencaoId: planoId,
        status: dados.status || "EM_OPERACAO",
        categoria: dados.categoria || "Geral",
        capacidadeCargaKg: dados.capacidadeCargaKg ? Number(dados.capacidadeCargaKg) : null,
        motoristaResponsavel: dados.motoristaResponsavel || "Não atribuído"
      },
      include: { planoManutencao: true }
    });

    return this._enriquecerVeiculo(novoVeiculo);
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id);

    if (dados.placa) {
      const placaFormatada = dados.placa.toUpperCase().trim();
      const veiculoComMesmaPlaca = await prisma.veiculo.findUnique({
        where: { placa: placaFormatada }
      });
      if (veiculoComMesmaPlaca && veiculoComMesmaPlaca.id !== Number(id)) {
        const error = new Error(`A placa ${placaFormatada} já pertence a outro veículo.`);
        error.statusCode = 409;
        throw error;
      }
    }

    let planoId = dados.planoManutencaoId !== undefined ? (dados.planoManutencaoId ? Number(dados.planoManutencaoId) : null) : undefined;
    if (planoId) {
      const plano = await prisma.planoManutencao.findUnique({ where: { id: planoId } });
      if (!plano) {
        const error = new Error(`Plano de manutenção com ID ${planoId} não encontrado.`);
        error.statusCode = 400;
        throw error;
      }
    }

    const updateData = {};
    if (dados.placa !== undefined) updateData.placa = dados.placa.toUpperCase().trim();
    if (dados.marca !== undefined) updateData.marca = dados.marca;
    if (dados.modelo !== undefined) updateData.modelo = dados.modelo;
    if (dados.ano !== undefined) updateData.ano = Number(dados.ano);
    if (dados.kmAtual !== undefined) updateData.kmAtual = Number(dados.kmAtual);
    if (dados.kmProximaRevisao !== undefined) updateData.kmProximaRevisao = Number(dados.kmProximaRevisao);
    if (dados.dataProximaRevisao !== undefined) updateData.dataProximaRevisao = dados.dataProximaRevisao ? new Date(dados.dataProximaRevisao) : null;
    if (planoId !== undefined) updateData.planoManutencaoId = planoId;
    if (dados.status !== undefined) updateData.status = dados.status;
    if (dados.categoria !== undefined) updateData.categoria = dados.categoria;
    if (dados.capacidadeCargaKg !== undefined) updateData.capacidadeCargaKg = Number(dados.capacidadeCargaKg);
    if (dados.motoristaResponsavel !== undefined) updateData.motoristaResponsavel = dados.motoristaResponsavel;

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: updateData,
      include: { planoManutencao: true }
    });

    return this._enriquecerVeiculo(veiculoAtualizado);
  }

  async atualizarKm(id, novoKm) {
    const veiculo = await this.buscarPorId(id);

    if (novoKm === undefined || isNaN(Number(novoKm)) || Number(novoKm) < 0) {
      const error = new Error("Quilometragem (KM) inválida.");
      error.statusCode = 400;
      throw error;
    }

    const kmNum = Number(novoKm);
    if (kmNum < veiculo.kmAtual) {
      const error = new Error(`O novo KM (${kmNum}) não pode ser inferior ao KM atual registrado (${veiculo.kmAtual}).`);
      error.statusCode = 400;
      throw error;
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: { kmAtual: kmNum },
      include: { planoManutencao: true }
    });

    return this._enriquecerVeiculo(veiculoAtualizado);
  }

  async deletar(id) {
    await this.buscarPorId(id);

    const osAtivas = await prisma.ordemServico.count({
      where: {
        veiculoId: Number(id),
        status: { in: ["ABERTA", "EM_ANDAMENTO"] }
      }
    });

    if (osAtivas > 0) {
      const error = new Error("Não é possível excluir o veículo pois existem Ordens de Serviço abertas ou em andamento vinculadas a ele.");
      error.statusCode = 400;
      throw error;
    }

    // Remover OS concluídas/canceladas vinculadas antes ou deletar em transação atômica
    await prisma.$transaction(async (tx) => {
      await tx.ordemServico.deleteMany({
        where: { veiculoId: Number(id) }
      });

      await tx.veiculo.delete({
        where: { id: Number(id) }
      });
    });

    return true;
  }

  async listarRevisaoImediata() {
    const todos = await this.listar();
    return todos.filter((v) => v.alertaRevisao.nivelAlerta === "CRITICO");
  }

  async buscarHistorico(veiculoId) {
    await this.buscarPorId(veiculoId);
    const historico = await prisma.ordemServico.findMany({
      where: { veiculoId: Number(veiculoId) },
      include: { veiculo: true },
      orderBy: { dataAbertura: "desc" }
    });

    return historico.map((os) => {
      let pecas = [];
      let maoDeObra = {};
      try { if (os.pecasJson) pecas = JSON.parse(os.pecasJson); } catch {}
      try { if (os.maoDeObraJson) maoDeObra = JSON.parse(os.maoDeObraJson); } catch {}
      return {
        ...os,
        pecas,
        maoDeObra,
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
    });
  }
}

module.exports = new VeiculosService();
