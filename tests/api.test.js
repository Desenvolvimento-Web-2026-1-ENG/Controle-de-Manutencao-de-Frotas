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

test("GET /api/status - Deve retornar status online e nome WEBDEV FROTAS", async () => {
  const res = await fetch(`${baseUrl}/status`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.projeto.includes("WEBDEV FROTAS"));
  assert.ok(data.usuarioPadrao.includes("Gabriel Nunes"));
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

test("GET /api/mecanicos - Deve listar os mecânicos cadastrados", async () => {
  const res = await fetch(`${baseUrl}/mecanicos`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 4);
  assert.ok(data.data.some((m) => m.nome.includes("Carlos Silva")));
});

test("POST /api/mecanicos - Deve cadastrar novo mecânico", async () => {
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
  assert.strictEqual(data.data.kmProximaRevisao, 35000);
});

test("POST /api/ordens-servico e PATCH status - Deve abrir OS e recalcular revisão na conclusão", async () => {
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
