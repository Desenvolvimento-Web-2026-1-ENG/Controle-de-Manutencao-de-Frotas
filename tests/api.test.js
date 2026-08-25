const test = require("node:test");
const assert = require("node:assert");
const app = require("../src/app");
const http = require("node:http");

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

test("GET /api/status - Deve retornar status online da API", async () => {
  const res = await fetch(`${baseUrl}/status`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.status, "online");
});

test("GET /api/dashboard/resumo - Deve retornar indicadores consolidados", async () => {
  const res = await fetch(`${baseUrl}/dashboard/resumo`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.frota.totalVeiculos >= 5);
  assert.ok(data.data.financeiro.totalGastoGeral > 0);
});

test("GET /api/dashboard/alertas - Deve identificar alertas críticos e de atenção", async () => {
  const res = await fetch(`${baseUrl}/dashboard/alertas`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.totalAlertas > 0);
  assert.ok(data.data.alertasCriticos.length >= 1);
});

test("GET /api/veiculos - Deve listar veículos e permitir filtros", async () => {
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
});

test("POST /api/veiculos - Deve cadastrar veículo e calcular próxima revisão", async () => {
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
  assert.strictEqual(data.data.kmProximaRevisao, 35000); // 20000 + 15000 do plano
});

test("POST /api/ordens-servico e PATCH status - Deve abrir OS e recalcular revisão na conclusão", async () => {
  // 1. Abrir OS
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

  // 2. Concluir OS
  const resConcluir = await fetch(`${baseUrl}/ordens-servico/${dataOS.data.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CONCLUIDA" })
  });
  assert.strictEqual(resConcluir.status, 200);

  // 3. Verificar veículo atualizado
  const resVeiculo = await fetch(`${baseUrl}/veiculos/2`);
  const dataVeiculo = await resVeiculo.json();
  assert.strictEqual(dataVeiculo.data.kmAtual, 40000);
  assert.strictEqual(dataVeiculo.data.kmProximaRevisao, 50000); // 40000 + 10000 (Plano 2)
  assert.strictEqual(dataVeiculo.data.alertaRevisao.nivelAlerta, "NORMAL");
});
