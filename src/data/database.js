/**
 * Gerenciador de Banco de Dados em Memória
 * Fornece métodos CRUD e lógica de persistência para Veículos, Planos e Ordens de Serviço
 */

const { planosManutencao: seedPlanos, veiculos: seedVeiculos, ordensServico: seedOS } = require("./seedData");

class Database {
  constructor() {
    this.reset();
  }

  reset() {
    this.planos = JSON.parse(JSON.stringify(seedPlanos));
    this.veiculos = JSON.parse(JSON.stringify(seedVeiculos));
    this.ordensServico = JSON.parse(JSON.stringify(seedOS));
  }

  // --- PLANOS DE MANUTENÇÃO ---
  listarPlanos() {
    return this.planos;
  }

  buscarPlanoPorId(id) {
    return this.planos.find((p) => p.id === Number(id));
  }

  criarPlano(dados) {
    const novoId = this.planos.length > 0 ? Math.max(...this.planos.map((p) => p.id)) + 1 : 1;
    const novoPlano = {
      id: novoId,
      nome: dados.nome,
      descricao: dados.descricao || "",
      intervaloKm: Number(dados.intervaloKm),
      intervaloMeses: Number(dados.intervaloMeses),
      itensChecagem: Array.isArray(dados.itensChecagem) ? dados.itensChecagem : [],
      criadoEm: new Date().toISOString()
    };
    this.planos.push(novoPlano);
    return novoPlano;
  }

  atualizarPlano(id, dados) {
    const index = this.planos.findIndex((p) => p.id === Number(id));
    if (index === -1) return null;

    this.planos[index] = {
      ...this.planos[index],
      nome: dados.nome !== undefined ? dados.nome : this.planos[index].nome,
      descricao: dados.descricao !== undefined ? dados.descricao : this.planos[index].descricao,
      intervaloKm: dados.intervaloKm !== undefined ? Number(dados.intervaloKm) : this.planos[index].intervaloKm,
      intervaloMeses: dados.intervaloMeses !== undefined ? Number(dados.intervaloMeses) : this.planos[index].intervaloMeses,
      itensChecagem: dados.itensChecagem !== undefined ? dados.itensChecagem : this.planos[index].itensChecagem
    };
    return this.planos[index];
  }

  deletarPlano(id) {
    const index = this.planos.findIndex((p) => p.id === Number(id));
    if (index === -1) return false;
    this.planos.splice(index, 1);
    return true;
  }

  // --- VEÍCULOS ---
  listarVeiculos(filtros = {}) {
    let resultado = this.veiculos.map((v) => this._enriquecerVeiculo(v));

    if (filtros.status) {
      resultado = resultado.filter((v) => v.status.toUpperCase() === filtros.status.toUpperCase());
    }

    if (filtros.marca) {
      resultado = resultado.filter((v) => v.marca.toLowerCase().includes(filtros.marca.toLowerCase()));
    }

    if (filtros.modelo) {
      resultado = resultado.filter((v) => v.modelo.toLowerCase().includes(filtros.modelo.toLowerCase()));
    }

    if (filtros.categoria) {
      resultado = resultado.filter((v) => v.categoria && v.categoria.toLowerCase() === filtros.categoria.toLowerCase());
    }

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.placa.toLowerCase().includes(termo) ||
          v.modelo.toLowerCase().includes(termo) ||
          v.marca.toLowerCase().includes(termo) ||
          (v.motoristaResponsavel && v.motoristaResponsavel.toLowerCase().includes(termo))
      );
    }

    if (filtros.apenasAlertas === "true" || filtros.apenasAlertas === true) {
      resultado = resultado.filter((v) => v.alertaRevisao.necessitaAtencao);
    }

    return resultado;
  }

  buscarVeiculoPorId(id) {
    const veiculo = this.veiculos.find((v) => v.id === Number(id));
    if (!veiculo) return null;
    return this._enriquecerVeiculo(veiculo);
  }

  buscarVeiculoPorPlaca(placa) {
    const placaLimpa = placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return this.veiculos.find((v) => v.placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === placaLimpa);
  }

  criarVeiculo(dados) {
    const novoId = this.veiculos.length > 0 ? Math.max(...this.veiculos.map((v) => v.id)) + 1 : 1;
    const plano = this.buscarPlanoPorId(dados.planoManutencaoId);

    // Calcular automaticamente próxima revisão se não fornecida
    const kmAtual = Number(dados.kmAtual) || 0;
    let kmProximaRevisao = dados.kmProximaRevisao ? Number(dados.kmProximaRevisao) : null;
    let dataProximaRevisao = dados.dataProximaRevisao || null;

    if (plano) {
      if (!kmProximaRevisao) {
        kmProximaRevisao = kmAtual + plano.intervaloKm;
      }
      if (!dataProximaRevisao) {
        const dataRevisao = new Date();
        dataRevisao.setMonth(dataRevisao.getMonth() + plano.intervaloMeses);
        dataProximaRevisao = dataRevisao.toISOString().split("T")[0];
      }
    }

    const novoVeiculo = {
      id: novoId,
      placa: dados.placa.toUpperCase().trim(),
      marca: dados.marca,
      modelo: dados.modelo,
      ano: Number(dados.ano),
      kmAtual: kmAtual,
      kmProximaRevisao: kmProximaRevisao,
      dataProximaRevisao: dataProximaRevisao,
      planoManutencaoId: dados.planoManutencaoId ? Number(dados.planoManutencaoId) : null,
      status: dados.status || "EM_OPERACAO",
      categoria: dados.categoria || "Geral",
      capacidadeCargaKg: dados.capacidadeCargaKg ? Number(dados.capacidadeCargaKg) : null,
      motoristaResponsavel: dados.motoristaResponsavel || "Não atribuído",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    this.veiculos.push(novoVeiculo);
    return this._enriquecerVeiculo(novoVeiculo);
  }

  atualizarVeiculo(id, dados) {
    const index = this.veiculos.findIndex((v) => v.id === Number(id));
    if (index === -1) return null;

    const veiculoAtual = this.veiculos[index];

    this.veiculos[index] = {
      ...veiculoAtual,
      placa: dados.placa !== undefined ? dados.placa.toUpperCase().trim() : veiculoAtual.placa,
      marca: dados.marca !== undefined ? dados.marca : veiculoAtual.marca,
      modelo: dados.modelo !== undefined ? dados.modelo : veiculoAtual.modelo,
      ano: dados.ano !== undefined ? Number(dados.ano) : veiculoAtual.ano,
      kmAtual: dados.kmAtual !== undefined ? Number(dados.kmAtual) : veiculoAtual.kmAtual,
      kmProximaRevisao: dados.kmProximaRevisao !== undefined ? Number(dados.kmProximaRevisao) : veiculoAtual.kmProximaRevisao,
      dataProximaRevisao: dados.dataProximaRevisao !== undefined ? dados.dataProximaRevisao : veiculoAtual.dataProximaRevisao,
      planoManutencaoId: dados.planoManutencaoId !== undefined ? Number(dados.planoManutencaoId) : veiculoAtual.planoManutencaoId,
      status: dados.status !== undefined ? dados.status : veiculoAtual.status,
      categoria: dados.categoria !== undefined ? dados.categoria : veiculoAtual.categoria,
      capacidadeCargaKg: dados.capacidadeCargaKg !== undefined ? Number(dados.capacidadeCargaKg) : veiculoAtual.capacidadeCargaKg,
      motoristaResponsavel: dados.motoristaResponsavel !== undefined ? dados.motoristaResponsavel : veiculoAtual.motoristaResponsavel,
      atualizadoEm: new Date().toISOString()
    };

    return this._enriquecerVeiculo(this.veiculos[index]);
  }

  atualizarKmVeiculo(id, novoKm) {
    const index = this.veiculos.findIndex((v) => v.id === Number(id));
    if (index === -1) return null;

    this.veiculos[index].kmAtual = Number(novoKm);
    this.veiculos[index].atualizadoEm = new Date().toISOString();

    return this._enriquecerVeiculo(this.veiculos[index]);
  }

  deletarVeiculo(id) {
    const index = this.veiculos.findIndex((v) => v.id === Number(id));
    if (index === -1) return false;
    this.veiculos.splice(index, 1);
    return true;
  }

  // --- ORDENS DE SERVIÇO ---
  listarOrdensServico(filtros = {}) {
    let resultado = this.ordensServico.map((os) => this._enriquecerOS(os));

    if (filtros.status) {
      resultado = resultado.filter((os) => os.status.toUpperCase() === filtros.status.toUpperCase());
    }

    if (filtros.tipo) {
      resultado = resultado.filter((os) => os.tipo.toUpperCase() === filtros.tipo.toUpperCase());
    }

    if (filtros.veiculoId) {
      resultado = resultado.filter((os) => os.veiculoId === Number(filtros.veiculoId));
    }

    if (filtros.mecanico) {
      resultado = resultado.filter((os) => os.mecanicoResponsavel.toLowerCase().includes(filtros.mecanico.toLowerCase()));
    }

    return resultado;
  }

  buscarOSPorId(id) {
    const os = this.ordensServico.find((o) => o.id === Number(id));
    if (!os) return null;
    return this._enriquecerOS(os);
  }

  listarHistoricoPorVeiculo(veiculoId) {
    const idNum = Number(veiculoId);
    return this.ordensServico
      .filter((os) => os.veiculoId === idNum)
      .map((os) => this._enriquecerOS(os))
      .sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
  }

  criarOS(dados) {
    const novoId = this.ordensServico.length > 0 ? Math.max(...this.ordensServico.map((o) => o.id)) + 1 : 1;
    const anoAtual = new Date().getFullYear();
    const codigoOS = `OS-${anoAtual}-${String(novoId).padStart(3, "0")}`;

    // Calcular valores das peças
    const pecasProcessadas = (dados.pecas || []).map((p) => {
      const qtd = Number(p.quantidade) || 1;
      const unit = Number(p.valorUnitario) || 0;
      return {
        item: p.item,
        quantidade: qtd,
        valorUnitario: unit,
        valorTotal: qtd * unit
      };
    });
    const valorTotalPecas = pecasProcessadas.reduce((acc, p) => acc + p.valorTotal, 0);

    // Calcular valor da mão de obra
    let maoDeObra = { descricao: "Serviço mecânico padrão", horas: 0, valorHora: 0, valorTotal: 0 };
    if (dados.maoDeObra) {
      const horas = Number(dados.maoDeObra.horas) || 0;
      const valorHora = Number(dados.maoDeObra.valorHora) || 0;
      const valorFixo = Number(dados.maoDeObra.valorTotal) || 0;
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

    const novaOS = {
      id: novoId,
      codigoOS: codigoOS,
      veiculoId: Number(dados.veiculoId),
      tipo: dados.tipo || "PREVENTIVA",
      status: dados.status || "ABERTA",
      mecanicoResponsavel: dados.mecanicoResponsavel || "Não designado",
      kmNoMomento: Number(dados.kmNoMomento) || 0,
      dataAbertura: dados.dataAbertura || new Date().toISOString(),
      dataPrevisao: dados.dataPrevisao || null,
      dataConclusao: dados.status === "CONCLUIDA" ? (dados.dataConclusao || new Date().toISOString()) : null,
      descricao: dados.descricao,
      pecas: pecasProcessadas,
      maoDeObra: maoDeObra,
      valorTotalPecas: valorTotalPecas,
      valorTotalMaoDeObra: valorTotalMaoDeObra,
      valorTotalGeral: valorTotalGeral,
      observacoes: dados.observacoes || "",
      criadoEm: new Date().toISOString()
    };

    this.ordensServico.push(novaOS);

    // Se a OS for iniciada como EM_ANDAMENTO, atualiza status do veículo
    if (novaOS.status === "EM_ANDAMENTO") {
      const veiculoIdx = this.veiculos.findIndex((v) => v.id === novaOS.veiculoId);
      if (veiculoIdx !== -1) {
        this.veiculos[veiculoIdx].status = "EM_MANUTENCAO";
      }
    }

    return this._enriquecerOS(novaOS);
  }

  atualizarOS(id, dados) {
    const index = this.ordensServico.findIndex((o) => o.id === Number(id));
    if (index === -1) return null;

    const osAtual = this.ordensServico[index];

    let pecasProcessadas = osAtual.pecas;
    let valorTotalPecas = osAtual.valorTotalPecas;
    if (dados.pecas !== undefined) {
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
    if (dados.maoDeObra !== undefined) {
      const horas = Number(dados.maoDeObra.horas) || 0;
      const valorHora = Number(dados.maoDeObra.valorHora) || 0;
      const valorFixo = Number(dados.maoDeObra.valorTotal) || 0;
      const totalMo = valorFixo > 0 ? valorFixo : horas * valorHora;

      maoDeObra = {
        descricao: dados.maoDeObra.descricao || (osAtual.maoDeObra && osAtual.maoDeObra.descricao) || "Mão de obra",
        horas: horas,
        valorHora: valorHora,
        valorTotal: totalMo
      };
      valorTotalMaoDeObra = totalMo;
    }

    const valorTotalGeral = valorTotalPecas + valorTotalMaoDeObra;

    this.ordensServico[index] = {
      ...osAtual,
      veiculoId: dados.veiculoId !== undefined ? Number(dados.veiculoId) : osAtual.veiculoId,
      tipo: dados.tipo !== undefined ? dados.tipo : osAtual.tipo,
      status: dados.status !== undefined ? dados.status : osAtual.status,
      mecanicoResponsavel: dados.mecanicoResponsavel !== undefined ? dados.mecanicoResponsavel : osAtual.mecanicoResponsavel,
      kmNoMomento: dados.kmNoMomento !== undefined ? Number(dados.kmNoMomento) : osAtual.kmNoMomento,
      dataPrevisao: dados.dataPrevisao !== undefined ? dados.dataPrevisao : osAtual.dataPrevisao,
      dataConclusao: dados.dataConclusao !== undefined ? dados.dataConclusao : osAtual.dataConclusao,
      descricao: dados.descricao !== undefined ? dados.descricao : osAtual.descricao,
      pecas: pecasProcessadas,
      maoDeObra: maoDeObra,
      valorTotalPecas: valorTotalPecas,
      valorTotalMaoDeObra: valorTotalMaoDeObra,
      valorTotalGeral: valorTotalGeral,
      observacoes: dados.observacoes !== undefined ? dados.observacoes : osAtual.observacoes
    };

    return this._enriquecerOS(this.ordensServico[index]);
  }

  alterarStatusOS(id, novoStatus, observacoesAdicionais = "") {
    const index = this.ordensServico.findIndex((o) => o.id === Number(id));
    if (index === -1) return null;

    const os = this.ordensServico[index];
    const statusAnterior = os.status;
    os.status = novoStatus.toUpperCase();

    if (observacoesAdicionais) {
      os.observacoes = os.observacoes ? `${os.observacoes}\n${observacoesAdicionais}` : observacoesAdicionais;
    }

    const veiculoIdx = this.veiculos.findIndex((v) => v.id === os.veiculoId);
    const veiculo = veiculoIdx !== -1 ? this.veiculos[veiculoIdx] : null;

    if (novoStatus === "EM_ANDAMENTO" && veiculo) {
      veiculo.status = "EM_MANUTENCAO";
    }

    if (novoStatus === "CONCLUIDA") {
      os.dataConclusao = new Date().toISOString();

      if (veiculo) {
        // Atualizar KM do veículo se o KM da OS for maior
        if (os.kmNoMomento && os.kmNoMomento > veiculo.kmAtual) {
          veiculo.kmAtual = os.kmNoMomento;
        }

        // Se a OS for preventiva, calcular próximo ciclo de manutenção
        if (os.tipo === "PREVENTIVA" && veiculo.planoManutencaoId) {
          const plano = this.buscarPlanoPorId(veiculo.planoManutencaoId);
          if (plano) {
            veiculo.kmProximaRevisao = veiculo.kmAtual + plano.intervaloKm;
            const proximaData = new Date();
            proximaData.setMonth(proximaData.getMonth() + plano.intervaloMeses);
            veiculo.dataProximaRevisao = proximaData.toISOString().split("T")[0];
          }
        }

        // Retorna status para EM_OPERACAO
        veiculo.status = "EM_OPERACAO";
        veiculo.atualizadoEm = new Date().toISOString();
      }
    }

    if (novoStatus === "CANCELADA" && veiculo && statusAnterior === "EM_ANDAMENTO") {
      veiculo.status = "EM_OPERACAO";
    }

    return this._enriquecerOS(os);
  }

  deletarOS(id) {
    const index = this.ordensServico.findIndex((o) => o.id === Number(id));
    if (index === -1) return false;
    this.ordensServico.splice(index, 1);
    return true;
  }

  // --- HELPERS E ENRIQUECIMENTO DE DADOS COM LÓGICA DE ALERTAS ---
  _enriquecerVeiculo(veiculo) {
    const plano = this.planos.find((p) => p.id === veiculo.planoManutencaoId) || null;
    const alerta = this._calcularAlertaRevisao(veiculo);

    return {
      ...veiculo,
      planoManutencao: plano ? { id: plano.id, nome: plano.nome, intervaloKm: plano.intervaloKm, intervaloMeses: plano.intervaloMeses } : null,
      alertaRevisao: alerta
    };
  }

  _enriquecerOS(os) {
    const veiculo = this.veiculos.find((v) => v.id === os.veiculoId);
    return {
      ...os,
      veiculo: veiculo
        ? {
            id: veiculo.id,
            placa: veiculo.placa,
            marca: veiculo.marca,
            modelo: veiculo.modelo,
            kmAtual: veiculo.kmAtual
          }
        : null
    };
  }

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
}

module.exports = new Database();
