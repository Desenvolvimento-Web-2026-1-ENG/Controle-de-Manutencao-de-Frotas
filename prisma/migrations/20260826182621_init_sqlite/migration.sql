-- CreateTable
CREATE TABLE "planos_manutencao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "intervalo_km" INTEGER NOT NULL,
    "intervalo_meses" INTEGER NOT NULL,
    "itens_checagem" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "km_atual" INTEGER NOT NULL,
    "km_proxima_revisao" INTEGER,
    "data_proxima_revisao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'EM_OPERACAO',
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "capacidade_carga_kg" REAL,
    "motorista_responsavel" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    "plano_manutencao_id" INTEGER,
    CONSTRAINT "veiculos_plano_manutencao_id_fkey" FOREIGN KEY ("plano_manutencao_id") REFERENCES "planos_manutencao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_os" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PREVENTIVA',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "mecanico_responsavel" TEXT NOT NULL,
    "km_no_momento" INTEGER NOT NULL,
    "data_abertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_previsao" DATETIME,
    "data_conclusao" DATETIME,
    "descricao" TEXT NOT NULL,
    "pecas_json" TEXT,
    "mao_de_obra_json" TEXT,
    "valor_total_pecas" REAL NOT NULL DEFAULT 0,
    "valor_total_mao_de_obra" REAL NOT NULL DEFAULT 0,
    "valor_total_geral" REAL NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    "veiculo_id" INTEGER NOT NULL,
    CONSTRAINT "ordens_servico_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mecanicos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "telefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_codigo_os_key" ON "ordens_servico"("codigo_os");
