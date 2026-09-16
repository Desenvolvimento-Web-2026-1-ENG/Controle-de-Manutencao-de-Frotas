process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";

const test = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");

const prisma = require("../src/config/prisma");
const seedData = require("../src/data/seedData");

let server;
let baseUrl;

async function seedDatabase() {
  await prisma.ordemServico.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.planoManutencao.deleteMany();
  await prisma.mecanico.deleteMany();

  for (const plano of seedData.planosManutencao) {
    await prisma.planoManutencao.create({
      data: {
        id: plano.id,
        nome: plano.nome,
        descricao: plano.descricao,
        intervaloKm: plano.intervaloKm,
        intervaloMeses: plano.intervaloMeses,
        itensChecagem: JSON.stringify(plano.itensChecagem || []),
        criadoEm: new Date(plano.criadoEm)
      }
    });
  }

  for (const v of seedData.veiculos) {
    await prisma.veiculo.create({
      data: {
        id: v.id,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        ano: v.ano,
        kmAtual: v.kmAtual,
        kmProximaRevisao: v.kmProximaRevisao,
        dataProximaRevisao: v.dataProximaRevisao ? new Date(v.dataProximaRevisao) : null,
        status: v.status,
        categoria: v.categoria,
        capacidadeCargaKg: v.capacidadeCargaKg,
        motoristaResponsavel: v.motoristaResponsavel,
        planoManutencaoId: v.planoManutencaoId,
        criadoEm: new Date(v.criadoEm),
        atualizadoEm: new Date(v.atualizadoEm || v.criadoEm)
      }
    });
  }

  for (const os of seedData.ordensServico) {
    await prisma.ordemServico.create({
      data: {
        id: os.id,
        codigoOS: os.codigoOS,
        veiculoId: os.veiculoId,
        tipo: os.tipo,
        status: os.status,
        mecanicoResponsavel: os.mecanicoResponsavel,
        kmNoMomento: os.kmNoMomento,
        dataAbertura: new Date(os.dataAbertura),
        dataPrevisao: os.dataPrevisao ? new Date(os.dataPrevisao) : null,
        dataConclusao: os.dataConclusao ? new Date(os.dataConclusao) : null,
        descricao: os.descricao,
        pecasJson: JSON.stringify(os.pecas || []),
        maoDeObraJson: JSON.stringify(os.maoDeObra || {}),
        valorTotalPecas: os.valorTotalPecas,
        valorTotalMaoDeObra: os.valorTotalMaoDeObra,
        valorTotalGeral: os.valorTotalGeral,
        observacoes: os.observacoes,
        criadoEm: new Date(os.criadoEm),
        atualizadoEm: new Date(os.criadoEm)
      }
    });
  }

  for (const m of seedData.mecanicos) {
    await prisma.mecanico.create({
      data: {
        id: m.id,
        nome: m.nome,
        cargo: m.cargo,
        especialidade: m.especialidade,
        telefone: m.telefone,
        status: m.status,
        criadoEm: new Date(m.criadoEm),
        atualizadoEm: new Date(m.criadoEm)
      }
    });
  }
}

test.before(async () => {
  await seedDatabase();
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await prisma.$disconnect();
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

// --- CASOS DE STATUS & DASHBOARD ---

test("GET /api/status - Deve retornar status online e nome WEBDEV FROTAS (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/status`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.projeto.includes("WEBDEV FROTAS"));
  assert.ok(data.usuarioPadrao.includes("Gabriel Nunes"));
});

test("GET /api/dashboard/resumo - Deve retornar indicadores consolidados (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/dashboard/resumo`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.frota.totalVeiculos >= 5);
  assert.ok(data.data.financeiro.totalGastoGeral > 0);
});

test("GET /api/dashboard/alertas - Deve identificar alertas críticos e de atenção (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/dashboard/alertas`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.totalAlertas > 0);
  assert.ok(data.data.alertasCriticos.length >= 1);
});

// --- CASOS DE MECÂNICOS (CRUD COMPLETO) ---

test("GET /api/mecanicos - Deve listar os mecânicos cadastrados (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/mecanicos`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 4);
  assert.ok(data.data.some((m) => m.nome.includes("Carlos Silva")));
});

test("POST /api/mecanicos - Deve cadastrar novo mecânico (201 Created)", async () => {
  const res = await fetch(`${baseUrl}/mecanicos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Roberto Nascimento",
      cargo: "Mecânico Sênior",
      especialidade: "Injeção Eletrônica",
      telefone: "(11) 98888-7777"
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.nome, "Roberto Nascimento");
});

test("PUT /api/mecanicos/:id - Deve editar dados do mecânico (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/mecanicos/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Carlos Silva Atualizado",
      cargo: "Mecânico Chefe Sênior",
      especialidade: "Motores Pesados e Diagnóstico",
      status: "EM_SERVICO"
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.nome, "Carlos Silva Atualizado");
  assert.strictEqual(data.data.status, "EM_SERVICO");
});

test("DELETE /api/mecanicos/:id - Deve excluir mecânico (200 OK)", async () => {
  // Cadastrar um para deletar
  const resCad = await fetch(`${baseUrl}/mecanicos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Mecânico Temporário" })
  });
  const dataCad = await resCad.json();

  const resDel = await fetch(`${baseUrl}/mecanicos/${dataCad.data.id}`, { method: "DELETE" });
  const dataDel = await resDel.json();
  assert.strictEqual(resDel.status, 200);
  assert.strictEqual(dataDel.success, true);
});

test("POST /api/mecanicos - Deve rejeitar sem nome (400 Bad Request)", async () => {
  const res = await fetch(`${baseUrl}/mecanicos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cargo: "Ajudante" })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
});

test("GET /api/mecanicos/:id - Deve retornar 404 para mecânico inexistente", async () => {
  const res = await fetch(`${baseUrl}/mecanicos/9999`);
  const data = await res.json();
  assert.strictEqual(res.status, 404);
  assert.strictEqual(data.success, false);
});

// --- CASOS DE VEÍCULOS & REGRAS DE NEGÓCIO ---

test("GET /api/veiculos - Deve listar veículos e permitir filtros (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/veiculos?marca=Volvo`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.every((v) => v.marca.toLowerCase().includes("volvo")));
});

test("POST /api/veiculos - Deve validar campos obrigatórios (400 Bad Request)", async () => {
  const res = await fetch(`${baseUrl}/veiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placa: "TEST123" })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.ok(Array.isArray(data.detalhes));
});

test("POST /api/veiculos - Deve recusar placa duplicada (409 Conflict)", async () => {
  const res = await fetch(`${baseUrl}/veiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      placa: "BRA2E19", // Placa já existente no seed
      marca: "Volvo",
      modelo: "FH 540",
      ano: 2022,
      kmAtual: 92400
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 409);
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes("Já existe um veículo"));
});

test("POST /api/veiculos - Deve cadastrar veículo e calcular próxima revisão (201 Created)", async () => {
  const novoVeiculo = {
    placa: "TST9Z99",
    marca: "Scania",
    modelo: "R 500",
    ano: 2024,
    kmAtual: 20000,
    planoManutencaoId: 1
  };
  const res = await fetch(`${baseUrl}/veiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novoVeiculo)
  });
  const data = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.placa, "TST9Z99");
  assert.strictEqual(data.data.kmProximaRevisao, 35000);
});

test("GET /api/veiculos/:id - Deve retornar 404 para veículo inexistente", async () => {
  const res = await fetch(`${baseUrl}/veiculos/9999`);
  const data = await res.json();
  assert.strictEqual(res.status, 404);
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes("não encontrado"));
});

test("GET /api/veiculos/:id - Deve retornar 400 para ID não numérico", async () => {
  const res = await fetch(`${baseUrl}/veiculos/abc`);
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes("número inteiro"));
});

test("PATCH /api/veiculos/:id/km - Deve recusar KM menor que o atual (400 Bad Request)", async () => {
  const res = await fetch(`${baseUrl}/veiculos/1/km`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kmAtual: 50000 }) // Atual é 92400
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes("não pode ser inferior"));
});

test("DELETE /api/veiculos/:id - Deve recusar exclusão de veículo com OS ativa (400 Bad Request)", async () => {
  const res = await fetch(`${baseUrl}/veiculos/5`, { method: "DELETE" }); // Veículo 5 tem OS 3 em andamento
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.ok(data.error.includes("Ordens de Serviço"));
});

// --- CASOS DE ORDENS DE SERVIÇO ---

test("POST /api/ordens-servico - Deve recusar OS para veículo inexistente (404 Not Found)", async () => {
  const res = await fetch(`${baseUrl}/ordens-servico`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      veiculoId: 9999,
      descricao: "Troca de filtros"
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 404);
  assert.strictEqual(data.success, false);
});

test("POST /api/ordens-servico e PATCH status - Deve abrir OS e recalcular revisão na conclusão (201 & 200)", async () => {
  const resCriar = await fetch(`${baseUrl}/ordens-servico`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      veiculoId: 2,
      tipo: "PREVENTIVA",
      mecanicoResponsavel: "Carlos Silva",
      kmNoMomento: 40000,
      descricao: "Troca de óleo e filtros",
      pecas: [{ item: "Óleo 15W40", quantidade: 1, valorUnitario: 300 }],
      maoDeObra: { descricao: "Serviço mecânico", horas: 2, valorHora: 100 }
    })
  });
  const dataOS = await resCriar.json();
  assert.strictEqual(resCriar.status, 201);
  assert.strictEqual(dataOS.data.valorTotalGeral, 500);

  const resConcluir = await fetch(`${baseUrl}/ordens-servico/${dataOS.data.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CONCLUIDA" })
  });
  assert.strictEqual(resConcluir.status, 200);

  const resVeiculo = await fetch(`${baseUrl}/veiculos/2`);
  const dataVeiculo = await resVeiculo.json();
  assert.strictEqual(dataVeiculo.data.kmAtual, 40000);
  assert.strictEqual(dataVeiculo.data.kmProximaRevisao, 50000);
  assert.strictEqual(dataVeiculo.data.alertaRevisao.nivelAlerta, "NORMAL");
});

test("PATCH /api/ordens-servico/:id/status - Deve recusar status inválido (400 Bad Request)", async () => {
  const res = await fetch(`${baseUrl}/ordens-servico/1/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "STATUS_INEXISTENTE" })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
});

// --- CASOS DE PLANOS DE MANUTENÇÃO (CRUD) ---

test("GET /api/planos-manutencao - Deve listar planos preventivos cadastrados (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/planos-manutencao`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 3);
  assert.ok(data.data.some((p) => p.nome.includes("Pesada")));
});

test("POST /api/planos-manutencao - Deve cadastrar novo plano de manutenção (201 Created)", async () => {
  const res = await fetch(`${baseUrl}/planos-manutencao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Plano Teste Severo",
      descricao: "Aplicação off-road e mineração",
      intervaloKm: 8000,
      intervaloMeses: 4,
      toleranciaKm: 500,
      itensChecagem: ["Troca de filtros especiais", "Inspeção do diferencial"]
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.nome, "Plano Teste Severo");
  assert.strictEqual(data.data.intervaloKm, 8000);
});

test("PUT /api/planos-manutencao/:id - Deve atualizar plano de manutenção (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/planos-manutencao/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Plano Pesado - Rodoviário Atualizado",
      intervaloKm: 16000,
      intervaloMeses: 6
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.nome, "Plano Pesado - Rodoviário Atualizado");
  assert.strictEqual(data.data.intervaloKm, 16000);
});

test("DELETE /api/planos-manutencao/:id - Deve excluir plano de manutenção (200 OK)", async () => {
  // Cria um plano para excluir
  const resCad = await fetch(`${baseUrl}/planos-manutencao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Plano Temporário",
      intervaloKm: 5000,
      intervaloMeses: 3
    })
  });
  const dataCad = await resCad.json();

  const resDel = await fetch(`${baseUrl}/planos-manutencao/${dataCad.data.id}`, {
    method: "DELETE"
  });
  const dataDel = await resDel.json();
  assert.strictEqual(resDel.status, 200);
  assert.strictEqual(dataDel.success, true);
});

// --- ROTAS COMPLEMENTARES DE VEÍCULOS E O.S. ---

test("GET /api/veiculos/revisao-imediata - Deve listar veículos com alerta crítico (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/veiculos/revisao-imediata`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.every((v) => v.alertaRevisao.nivelAlerta === "CRITICO"));
});

test("GET /api/veiculos/:id/historico - Deve retornar histórico de O.S. de um veículo (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/veiculos/1/historico`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test("GET /api/ordens-servico/:id - Deve buscar detalhes de uma O.S. por ID (200 OK)", async () => {
  const res = await fetch(`${baseUrl}/ordens-servico/1`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.id, 1);
  assert.ok(data.data.codigoOS);
});

