/**
 * Dados Iniciais (Seed Data) do Sistema WEBDEV FROTAS
 */

const mecanicos = [
  {
    id: 1,
    nome: "Carlos Silva",
    cargo: "Mecânico Chefe",
    especialidade: "Motores a Diesel & Transmissão Pesada",
    telefone: "(21) 98765-4321",
    status: "DISPONIVEL",
    criadoEm: "2026-01-05T08:00:00.000Z"
  },
  {
    id: 2,
    nome: "José Mendes",
    cargo: "Mecânico Especialista",
    especialidade: "Sistemas de Freios Pneumáticos & Suspensão",
    telefone: "(22) 98123-4567",
    status: "DISPONIVEL",
    criadoEm: "2026-01-05T08:30:00.000Z"
  },
  {
    id: 3,
    nome: "Pedro Alcantara",
    cargo: "Mecânico Eletricista",
    especialidade: "Diagnóstico Eletrônico, Injeção & Baterias",
    telefone: "(22) 97654-3210",
    status: "EM_SERVICO",
    criadoEm: "2026-01-10T09:00:00.000Z"
  },
  {
    id: 4,
    nome: "Mariana Rocha",
    cargo: "Técnica em Mecânica Automotiva",
    especialidade: "Sistemas de Arrefecimento, Fluidos & Lubrificação",
    telefone: "(22) 99887-7665",
    status: "DISPONIVEL",
    criadoEm: "2026-01-15T08:00:00.000Z"
  }
];

const planosManutencao = [
  {
    id: 1,
    nome: "Plano Frota Pesada (Caminhões Trucados/Carretas)",
    descricao: "Revisão preventiva para caminhões pesados de longa distância",
    intervaloKm: 15000,
    intervaloMeses: 6,
    itensChecagem: [
      "Troca de óleo do motor 15W40",
      "Substituição dos filtros de óleo, ar e combustível",
      "Inspeção e regulagem do sistema de freios pneumático",
      "Verificação de alinhamento e balanceamento dos eixos",
      "Engraxamento geral dos pinos e quinta roda",
      "Checagem das baterias e alternador"
    ],
    criadoEm: "2026-01-10T08:00:00.000Z"
  },
  {
    id: 2,
    nome: "Plano Frota Média (Caminhões Urbanos 3/4)",
    descricao: "Manutenção periódica para caminhões de entrega urbana",
    intervaloKm: 10000,
    intervaloMeses: 4,
    itensChecagem: [
      "Troca de óleo do motor",
      "Substituição do filtro de ar e combustível",
      "Revisão de suspensão e amortecedores",
      "Inspeção de lonas e pastilhas de freio",
      "Verificação do sistema de embreagem"
    ],
    criadoEm: "2026-01-10T08:30:00.000Z"
  },
  {
    id: 3,
    nome: "Plano Frota Leve (Vans e Furgões)",
    descricao: "Manutenção preventiva para veículos utilitários rápidos",
    intervaloKm: 10000,
    intervaloMeses: 6,
    itensChecagem: [
      "Troca de óleo sintético 5W30",
      "Troca do filtro de óleo e filtro de cabine",
      "Geometria e rodízio de pneus",
      "Checagem do fluido de arrefecimento e freio",
      "Diagnóstico eletrônico via scanner"
    ],
    criadoEm: "2026-01-15T09:00:00.000Z"
  }
];

const veiculos = [
  {
    id: 1,
    placa: "BRA2E19",
    marca: "Volvo",
    modelo: "FH 540 6x4",
    ano: 2022,
    kmAtual: 92400,
    kmProximaRevisao: 90000, // Ultrapassou a KM -> ALERTA CRÍTICO
    dataProximaRevisao: "2026-09-10",
    planoManutencaoId: 1,
    status: "ALERTA_REVISAO",
    categoria: "Pesado",
    capacidadeCargaKg: 30000,
    motoristaResponsavel: "Marcos Oliveira",
    criadoEm: "2026-01-20T10:00:00.000Z",
    atualizadoEm: "2026-08-20T14:30:00.000Z"
  },
  {
    id: 2,
    placa: "RQX4F88",
    marca: "Mercedes-Benz",
    modelo: "Accelo 1016",
    ano: 2023,
    kmAtual: 39500,
    kmProximaRevisao: 40000, // Faltam 500 km -> ALERTA ATENÇÃO
    dataProximaRevisao: "2026-08-30", // Vencimento próximo
    planoManutencaoId: 2,
    status: "ALERTA_REVISAO",
    categoria: "Médio",
    capacidadeCargaKg: 9600,
    motoristaResponsavel: "Lucas Santana",
    criadoEm: "2026-02-01T11:00:00.000Z",
    atualizadoEm: "2026-08-22T09:15:00.000Z"
  },
  {
    id: 3,
    placa: "GHJ7A23",
    marca: "Volkswagen",
    modelo: "Delivery 11.180",
    ano: 2021,
    kmAtual: 58000,
    kmProximaRevisao: 65000,
    dataProximaRevisao: "2026-11-20",
    planoManutencaoId: 2,
    status: "EM_OPERACAO",
    categoria: "Médio",
    capacidadeCargaKg: 10700,
    motoristaResponsavel: "Roberto Alves",
    criadoEm: "2026-02-10T14:00:00.000Z",
    atualizadoEm: "2026-08-10T16:00:00.000Z"
  },
  {
    id: 4,
    placa: "ABC4D56",
    marca: "Renault",
    modelo: "Master Furgão L3H2",
    ano: 2024,
    kmAtual: 18200,
    kmProximaRevisao: 20000,
    dataProximaRevisao: "2026-08-20", // Data ultrapassada -> ALERTA CRÍTICO
    planoManutencaoId: 3,
    status: "ALERTA_REVISAO",
    categoria: "Leve",
    capacidadeCargaKg: 1522,
    motoristaResponsavel: "Fernando Ramos",
    criadoEm: "2026-03-01T08:30:00.000Z",
    atualizadoEm: "2026-08-21T11:00:00.000Z"
  },
  {
    id: 5,
    placa: "XYZ9K88",
    marca: "Scania",
    modelo: "R 450",
    ano: 2020,
    kmAtual: 145000,
    kmProximaRevisao: 150000,
    dataProximaRevisao: "2026-12-05",
    planoManutencaoId: 1,
    status: "EM_MANUTENCAO",
    categoria: "Pesado",
    capacidadeCargaKg: 35000,
    motoristaResponsavel: "Julio Cesar",
    criadoEm: "2026-01-05T09:00:00.000Z",
    atualizadoEm: "2026-08-24T10:00:00.000Z"
  }
];

const ordensServico = [
  {
    id: 1,
    codigoOS: "OS-2026-001",
    veiculoId: 1,
    tipo: "PREVENTIVA",
    status: "CONCLUIDA",
    mecanicoResponsavel: "Carlos Silva (Mecânico Chefe)",
    kmNoMomento: 75000,
    dataAbertura: "2026-03-10T08:00:00.000Z",
    dataPrevisao: "2026-03-11T18:00:00.000Z",
    dataConclusao: "2026-03-11T17:30:00.000Z",
    descricao: "Revisão periódica preventiva de 75.000 km conforme plano",
    pecas: [
      { item: "Óleo 15W40 Galão 20L", quantidade: 2, valorUnitario: 380.00, valorTotal: 760.00 },
      { item: "Filtro de Óleo Lubrificante", quantidade: 1, valorUnitario: 140.00, valorTotal: 140.00 },
      { item: "Filtro de Ar Primário e Secundário", quantidade: 1, valorUnitario: 290.00, valorTotal: 290.00 },
      { item: "Filtro de Combustível Racor", quantidade: 1, valorUnitario: 110.00, valorTotal: 110.00 }
    ],
    maoDeObra: {
      descricao: "Serviço de troca de fluídos, filtros e engraxamento de eixos",
      horas: 6,
      valorHora: 90.00,
      valorTotal: 540.00
    },
    valorTotalPecas: 1300.00,
    valorTotalMaoDeObra: 540.00,
    valorTotalGeral: 1840.00,
    observacoes: "Revisão concluída com sucesso. Sistema de freios verificado e sem folgas.",
    criadoEm: "2026-03-10T08:00:00.000Z"
  },
  {
    id: 2,
    codigoOS: "OS-2026-002",
    veiculoId: 3,
    tipo: "CORRETIVA",
    status: "CONCLUIDA",
    mecanicoResponsavel: "José Mendes (Mecânico Especialista)",
    kmNoMomento: 52000,
    dataAbertura: "2026-05-14T09:30:00.000Z",
    dataPrevisao: "2026-05-15T18:00:00.000Z",
    dataConclusao: "2026-05-15T16:00:00.000Z",
    descricao: "Substituição do jogo de pastilhas de freio dianteiro e disco",
    pecas: [
      { item: "Jogo de Pastilhas de Freio Dianteiro", quantidade: 1, valorUnitario: 320.00, valorTotal: 320.00 },
      { item: "Par de Discos de Freio Ventilados", quantidade: 1, valorUnitario: 580.00, valorTotal: 580.00 },
      { item: "Fluído de Freio DOT 4 500ml", quantidade: 2, valorUnitario: 45.00, valorTotal: 90.00 }
    ],
    maoDeObra: {
      descricao: "Troca de discos, pastilhas e sangria do sistema de freio",
      horas: 4,
      valorHora: 90.00,
      valorTotal: 360.00
    },
    valorTotalPecas: 990.00,
    valorTotalMaoDeObra: 360.00,
    valorTotalGeral: 1350.00,
    observacoes: "Freios testados em pista e calibrados.",
    criadoEm: "2026-05-14T09:30:00.000Z"
  },
  {
    id: 3,
    codigoOS: "OS-2026-003",
    veiculoId: 5,
    tipo: "PREVENTIVA",
    status: "EM_ANDAMENTO",
    mecanicoResponsavel: "Pedro Alcantara (Mecânico Eletricista)",
    kmNoMomento: 145000,
    dataAbertura: "2026-08-24T08:00:00.000Z",
    dataPrevisao: "2026-08-26T18:00:00.000Z",
    dataConclusao: null,
    descricao: "Revisão geral do sistema de arrefecimento e troca de correias",
    pecas: [
      { item: "Kit Correia Dentada e Tensor", quantidade: 1, valorUnitario: 750.00, valorTotal: 750.00 },
      { item: "Bomba d'Água Original", quantidade: 1, valorUnitario: 890.00, valorTotal: 890.00 },
      { item: "Aditivo de Radiador Concentrado 5L", quantidade: 3, valorUnitario: 65.00, valorTotal: 195.00 }
    ],
    maoDeObra: {
      descricao: "Desmontagem da dianteira, instalação de bomba e sangria do arrefecimento",
      horas: 8,
      valorHora: 95.00,
      valorTotal: 760.00
    },
    valorTotalPecas: 1835.00,
    valorTotalMaoDeObra: 760.00,
    valorTotalGeral: 2595.00,
    observacoes: "Veículo em box 2. Aguardando finalização da sangria e teste de pressão.",
    criadoEm: "2026-08-24T08:00:00.000Z"
  }
];

module.exports = {
  mecanicos,
  planosManutencao,
  veiculos,
  ordensServico
};
