const test = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
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

// --- CASOS DE MECÂNICOS ---

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
