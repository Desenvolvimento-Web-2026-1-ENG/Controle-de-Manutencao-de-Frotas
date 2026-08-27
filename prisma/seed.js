/**
 * Script de Seed para o Prisma ORM (SQLite)
 * Popula o banco com os dados iniciais do WEBDEV FROTAS
 */

const prisma = require("../src/config/prisma");
const seedData = require("../src/data/seedData");

async function main() {
  console.log("🌱 Iniciando o povoamento do banco SQLite via Prisma...");

  // 1. Limpar tabelas existentes na ordem correta das FKs
  await prisma.ordemServico.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.planoManutencao.deleteMany();
  await prisma.mecanico.deleteMany();

  console.log("🧹 Tabelas limpas com sucesso.");

  // 2. Inserir Planos de Manutenção
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
  console.log(`✅ ${seedData.planosManutencao.length} Planos de Manutenção inseridos.`);

  // 3. Inserir Veículos
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
  console.log(`✅ ${seedData.veiculos.length} Veículos inseridos.`);

  // 4. Inserir Ordens de Serviço
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
  console.log(`✅ ${seedData.ordensServico.length} Ordens de Serviço inseridas.`);

  // 5. Inserir Mecânicos
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
  console.log(`✅ ${seedData.mecanicos.length} Mecânicos inseridos.`);

  console.log("🎉 Seed do Prisma concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
