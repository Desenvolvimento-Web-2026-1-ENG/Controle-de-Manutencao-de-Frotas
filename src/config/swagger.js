/**
 * Especificação OpenAPI 3.0 / Swagger para a API de Controle de Manutenção de Frotas
 */

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "API de Controle de Manutenção de Frotas (Logística)",
    version: "1.0.0-p1",
    description: `
**Sistema de Gerenciamento de Manutenção Preventiva de Veículos e Ordens de Serviço**
Desenvolvido para a Avaliação Parcial (P1) da disciplina de Desenvolvimento Web.

### Perfis de Acesso:
- **Gestor de Frota:** Acompanha alertas de revisão, cadastra veículos, define planos preventivos e monitora indicadores.
- **Mecânico (Admin):** Abre e gerencia Ordens de Serviço (O.S.), registra peças utilizadas, valores de mão de obra e finaliza manutenções.

### Lógica Central de Alertas:
- **Alerta Crítico (Revisão Imediata):** Gerado quando o \`kmAtual >= kmProximaRevisao\` ou \`dataProximaRevisao <= dataAtual\`.
- **Alerta de Atenção:** Faltando menos de 1.000 km ou menos de 15 dias para a data prevista.
- **Conclusão de O.S. Preventiva:** Ao concluir uma OS preventiva, o sistema recalcula automaticamente a próxima revisão com base no plano de manutenção do veículo.
    `,
    contact: {
      name: "Gabriel - Desenvolvedor Fullstack",
      url: "https://github.com/Gabriel-lns"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de Desenvolvimento Local"
    }
  ],
  tags: [
    { name: "Dashboard e Alertas", description: "Indicadores analíticos da frota e painel de alertas de revisão" },
    { name: "Veículos", description: "Gerenciamento e controle cadastral da frota de veículos" },
    { name: "Ordens de Serviço", description: "Registro, acompanhamento e fechamento de ordens de serviço (peças e mão de obra)" },
    { name: "Planos de Manutenção", description: "Configuração dos intervalos e itens de revisão preventiva" }
  ],
  paths: {
    "/api/status": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Verifica a integridade e status da API",
        responses: {
          200: {
            description: "API operacional",
            content: {
              "application/json": {
                example: {
                  success: true,
                  projeto: "Sistema de Controle de Manutenção de Frotas",
                  versao: "1.0.0-p1",
                  status: "online"
                }
              }
            }
          }
        }
      }
    },
    "/api/dashboard/resumo": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Obtém métricas consolidadas da frota, OS e financeiro",
        responses: {
          200: {
            description: "Métricas consolidadas retornadas com sucesso",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    frota: {
                      totalVeiculos: 5,
                      emOperacao: 3,
                      emManutencao: 1,
                      revisaoCritica: 2,
                      revisaoAtencao: 1,
                      revisaoEmDia: 2,
                      totalPlanosAtivos: 3
                    },
                    ordensServico: {
                      total: 3,
                      abertas: 0,
                      emAndamento: 1,
                      concluidas: 2,
                      canceladas: 0
                    },
                    financeiro: {
                      totalGastoGeral: 3190.00,
                      totalGastoPecas: 2290.00,
                      totalGastoMaoDeObra: 900.00,
                      custoMedioPorOS: 1595.00
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/dashboard/alertas": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Lista todos os alertas de revisão classificados por criticidade",
        responses: {
          200: {
            description: "Lista de alertas retornada com sucesso",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    totalAlertas: 3,
                    alertasCriticos: [
                      {
                        veiculoId: 1,
                        placa: "BRA2E19",
                        modelo: "Volvo FH 540 6x4",
                        kmAtual: 92400,
                        kmProximaRevisao: 90000,
                        gravidade: "CRÍTICA (Revisão Imediata)",
                        motivos: ["KM de revisão ultrapassado em 2400 km"],
                        acaoRecomendada: "Abrir Ordem de Serviço Preventiva imediatamente."
                      }
                    ],
                    alertasAtencao: [
                      {
                        veiculoId: 2,
                        placa: "RQX4F88",
                        modelo: "Mercedes-Benz Accelo 1016",
                        kmAtual: 39500,
                        kmProximaRevisao: 40000,
                        gravidade: "ATENÇÃO (Revisão Próxima)",
                        motivos: ["Faltam apenas 500 km para a revisão preventiva"]
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/veiculos": {
      get: {
        tags: ["Veículos"],
        summary: "Lista todos os veículos cadastrados na frota",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filtrar por status (EM_OPERACAO, EM_MANUTENCAO, ALERTA_REVISAO)" },
          { name: "marca", in: "query", schema: { type: "string" }, description: "Filtrar por marca do veículo" },
          { name: "modelo", in: "query", schema: { type: "string" }, description: "Filtrar por modelo" },
          { name: "categoria", in: "query", schema: { type: "string" }, description: "Filtrar por categoria (Pesado, Médio, Leve)" },
          { name: "busca", in: "query", schema: { type: "string" }, description: "Busca textual por placa, modelo ou motorista" },
          { name: "apenasAlertas", in: "query", schema: { type: "boolean" }, description: "Filtrar apenas veículos que requerem atenção/revisão" }
        ],
        responses: {
          200: {
            description: "Lista de veículos recuperada com sucesso"
          }
        }
      },
      post: {
        tags: ["Veículos"],
        summary: "Cadastra um novo veículo na frota",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                placa: "ABC1D23",
                marca: "Scania",
                modelo: "R 450 Plus",
                ano: 2023,
                kmAtual: 45000,
                planoManutencaoId: 1,
                categoria: "Pesado",
                capacidadeCargaKg: 32000,
                motoristaResponsavel: "João Pedro Santos"
              }
            }
          }
        },
        responses: {
          201: { description: "Veículo cadastrado com sucesso" },
          400: { description: "Dados inválidos ou campos obrigatórios ausentes" },
          409: { description: "Placa já cadastrada no sistema" }
        }
      }
    },
    "/api/veiculos/revisao-imediata": {
      get: {
        tags: ["Veículos"],
        summary: "Lista veículos com necessidade urgente de revisão (KM ou Data estourada)",
        responses: {
          200: { description: "Lista de veículos com revisão crítica" }
        }
      }
    },
    "/api/veiculos/{id}": {
      get: {
        tags: ["Veículos"],
        summary: "Obtém detalhes de um veículo específico",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Detalhes do veículo" },
          404: { description: "Veículo não encontrado" }
        }
      },
      put: {
        tags: ["Veículos"],
        summary: "Atualiza os dados cadastrais do veículo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                placa: "BRA2E19",
                marca: "Volvo",
                modelo: "FH 540 Globetrotter",
                ano: 2022,
                kmAtual: 92400,
                planoManutencaoId: 1,
                motoristaResponsavel: "Marcos Oliveira Jr"
              }
            }
          }
        },
        responses: {
          200: { description: "Veículo atualizado com sucesso" },
          400: { description: "Dados inválidos" },
          404: { description: "Veículo não encontrado" }
        }
      },
      delete: {
        tags: ["Veículos"],
        summary: "Remove um veículo da frota",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Veículo removido com sucesso" },
          400: { description: "Não é possível excluir veículo com OS ativas" },
          404: { description: "Veículo não encontrado" }
        }
      }
    },
    "/api/veiculos/{id}/km": {
      patch: {
        tags: ["Veículos"],
        summary: "Atualiza especificamente a quilometragem (KM) do veículo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                kmAtual: 93500
              }
            }
          }
        },
        responses: {
          200: { description: "KM atualizado com sucesso" },
          400: { description: "KM inválido ou inferior ao registrado" },
          404: { description: "Veículo não encontrado" }
        }
      }
    },
    "/api/veiculos/{id}/historico": {
      get: {
        tags: ["Veículos"],
        summary: "Histórico completo de ordens de serviço realizadas no veículo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Histórico de manutenções retornado com sucesso" },
          404: { description: "Veículo não encontrado" }
        }
      }
    },
    "/api/ordens-servico": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Lista todas as Ordens de Serviço (O.S.)",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filtrar por status (ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA)" },
          { name: "tipo", in: "query", schema: { type: "string" }, description: "Filtrar por tipo (PREVENTIVA, CORRETIVA, EMERGENCIAL)" },
          { name: "veiculoId", in: "query", schema: { type: "integer" }, description: "Filtrar por ID do veículo" },
          { name: "mecanico", in: "query", schema: { type: "string" }, description: "Filtrar por mecânico responsável" }
        ],
        responses: {
          200: { description: "Lista de OS recuperada com sucesso" }
        }
      },
      post: {
        tags: ["Ordens de Serviço"],
        summary: "Abre uma nova Ordem de Serviço com peças e mão de obra",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                veiculoId: 1,
                tipo: "PREVENTIVA",
                mecanicoResponsavel: "Carlos Silva (Mecânico Chefe)",
                kmNoMomento: 92400,
                descricao: "Revisão preventiva de 90.000 KM - Troca de fluidos e pastilhas",
                dataPrevisao: "2026-08-30T18:00:00.000Z",
                pecas: [
                  { item: "Óleo Motor 15W40", quantidade: 2, valorUnitario: 390.00 },
                  { item: "Filtro de Óleo e Combustível", quantidade: 2, valorUnitario: 160.00 }
                ],
                maoDeObra: {
                  descricao: "Troca de óleos, filtros e revisão geral",
                  horas: 5,
                  valorHora: 90.00
                },
                observacoes: "Veículo estacionado na rampa 01."
              }
            }
          }
        },
        responses: {
          201: { description: "Ordem de Serviço criada com sucesso" },
          400: { description: "Dados inválidos" },
          404: { description: "Veículo não encontrado" }
        }
      }
    },
    "/api/ordens-servico/{id}": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Obtém detalhes completos de uma Ordem de Serviço",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Detalhes da OS" },
          404: { description: "OS não encontrada" }
        }
      },
      put: {
        tags: ["Ordens de Serviço"],
        summary: "Atualiza itens, mecânico e descrição da Ordem de Serviço",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                descricao: "Revisão e substituição preventiva de correias e filtros",
                mecanicoResponsavel: "Carlos Silva (Mecânico Chefe)",
                pecas: [
                  { item: "Kit Correias", quantidade: 1, valorUnitario: 450.00 }
                ],
                maoDeObra: {
                  descricao: "Mão de obra especializada",
                  horas: 4,
                  valorHora: 100.00
                }
              }
            }
          }
        },
        responses: {
          200: { description: "OS atualizada com sucesso" },
          404: { description: "OS não encontrada" }
        }
      },
      delete: {
        tags: ["Ordens de Serviço"],
        summary: "Exclui uma Ordem de Serviço",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "OS excluída com sucesso" },
          400: { description: "Não é possível excluir OS em andamento" },
          404: { description: "OS não encontrada" }
        }
      }
    },
    "/api/ordens-servico/{id}/status": {
      patch: {
        tags: ["Ordens de Serviço"],
        summary: "Altera o status da OS (ABERTA -> EM_ANDAMENTO -> CONCLUIDA / CANCELADA)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                status: "CONCLUIDA",
                observacoes: "Serviço finalizado com sucesso e veículo liberado."
              }
            }
          }
        },
        responses: {
          200: { description: "Status atualizado. Se for preventiva, recalcula próximo ciclo de revisão do veículo." },
          400: { description: "Status inválido" },
          404: { description: "OS não encontrada" }
        }
      }
    },
    "/api/planos-manutencao": {
      get: {
        tags: ["Planos de Manutenção"],
        summary: "Lista todos os planos de manutenção preventiva",
        responses: {
          200: { description: "Lista de planos recuperada" }
        }
      },
      post: {
        tags: ["Planos de Manutenção"],
        summary: "Cria um novo plano de manutenção",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                nome: "Plano Frota Executiva (Sedans e SUVs)",
                descricao: "Revisão para veículos de diretoria e passageiros",
                intervaloKm: 10000,
                intervaloMeses: 12,
                itensChecagem: [
                  "Troca de óleo sintético",
                  "Filtros de ar, óleo e ar-condicionado",
                  "Alinhamento 3D e balanceamento",
                  "Inspeção de pastilhas e amortecedores"
                ]
              }
            }
          }
        },
        responses: {
          201: { description: "Plano criado com sucesso" },
          400: { description: "Dados inválidos" }
        }
      }
    },
    "/api/planos-manutencao/{id}": {
      get: {
        tags: ["Planos de Manutenção"],
        summary: "Obtém detalhes de um plano de manutenção",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Detalhes do plano" },
          404: { description: "Plano não encontrado" }
        }
      },
      put: {
        tags: ["Planos de Manutenção"],
        summary: "Atualiza um plano de manutenção",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                nome: "Plano Frota Pesada Atualizado",
                intervaloKm: 20000,
                intervaloMeses: 6
              }
            }
          }
        },
        responses: {
          200: { description: "Plano atualizado" },
          404: { description: "Plano não encontrado" }
        }
      },
      delete: {
        tags: ["Planos de Manutenção"],
        summary: "Remove um plano de manutenção",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Plano excluído" },
          400: { description: "Existem veículos vinculados a este plano" },
          404: { description: "Plano não encontrado" }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
