/**
 * Especificação OpenAPI 3.0 / Swagger Completa para WEBDEV FROTAS
 * Padrão Enterprise: Documentação exaustiva de Casos de Sucesso (200, 201) e Erros (400, 404, 409, 500)
 */

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "WEBDEV FROTAS — API de Controle de Manutenção de Frotas (Logística)",
    version: "1.0.0-p1",
    description: `
**Sistema de Gerenciamento de Manutenção Preventiva de Veículos e Ordens de Serviço**
Desenvolvido para a Avaliação Parcial (P1) da disciplina de Desenvolvimento Web.

### 👥 Perfis de Acesso:
- **Gestor de Frota (Gabriel Nunes):** Acompanha alertas de revisão, cadastra veículos, define planos preventivos e monitora indicadores analíticos.
- **Mecânico (Admin):** Abre e gerencia Ordens de Serviço (O.S.), vincula peças, horas de mão de obra e executa recálculos automáticos de ciclo preventivo na conclusão.

### ⚙️ Lógica Central de Negócio & Alertas:
1. **Alerta Crítico (Revisão Imediata):** Ativado quando \`kmAtual >= kmProximaRevisao\` OU \`dataProximaRevisao <= dataAtual\`.
2. **Alerta de Atenção:** Ativado quando faltam \`< 1.000 km\` OU \`< 15 dias\` para a revisão prevista.
3. **Conclusão de O.S. Preventiva:** Ao transicionar uma O.S. preventiva para \`CONCLUIDA\`, o sistema recalcula automaticamente a próxima revisão somando o \`intervaloKm\` e \`intervaloMeses\` do plano vinculado.

### 🛡️ Tratamento de Erros Padronizado:
Todas as respostas de erro seguem o formato:
\`\`\`json
{
  "success": false,
  "status": 400 | 404 | 409 | 500,
  "error": "Descrição semântica do erro ocorrido",
  "detalhes": ["Lista de inconsistências ou campos ausentes"],
  "path": "/api/...",
  "timestamp": "2026-08-25T19:00:00.000Z"
}
\`\`\`
    `,
    contact: {
      name: "Gabriel Nunes - Desenvolvedor Fullstack",
      url: "https://github.com/Gabriel-lns"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local de Desenvolvimento"
    }
  ],
  tags: [
    { name: "Dashboard e Alertas", description: "Indicadores analíticos da frota e painel de alertas de revisão preventiva" },
    { name: "Veículos", description: "Gerenciamento cadastral, atualização de KM e histórico de revisões da frota" },
    { name: "Ordens de Serviço", description: "Registro, cálculo de peças/mão de obra e encerramento de manutenções" },
    { name: "Planos de Manutenção", description: "Configuração de intervalos de quilometragem e tempo para revisões" },
    { name: "Mecânicos", description: "Quadro de mecânicos e especialistas da oficina" }
  ],
  paths: {
    "/api/status": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Verifica a integridade operacional da API",
        responses: {
          200: {
            description: "API online e operacional",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    projeto: { type: "string", example: "WEBDEV FROTAS — Controle de Manutenção de Frotas" },
                    versao: { type: "string", example: "1.0.0-p1" },
                    usuarioPadrao: { type: "string", example: "Gabriel Nunes (Gestor)" },
                    status: { type: "string", example: "online" },
                    timestamp: { type: "string", format: "date-time" },
                    documentacao: { type: "string", example: "/api-docs" },
                    wireframes: { type: "string", example: "/wireframes.html" }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/dashboard/resumo": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Obtém métricas consolidadas da frota, ordens de serviço e custos",
        responses: {
          200: {
            description: "Métricas consolidadas recuperadas com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DashboardResumo" }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/dashboard/alertas": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Lista todos os alertas de revisão classificados por criticidade",
        responses: {
          200: {
            description: "Alertas recuperados com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        totalAlertas: { type: "integer", example: 3 },
                        criticos: { type: "integer", example: 2 },
                        atencao: { type: "integer", example: 1 },
                        alertasCriticos: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Veiculo" }
                        },
                        alertasAtencao: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Veiculo" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/veiculos": {
      get: {
        tags: ["Veículos"],
        summary: "Lista os veículos com suporte a filtros avançados e busca",
        parameters: [
          { name: "busca", in: "query", description: "Termo de busca por placa, modelo, marca ou motorista", schema: { type: "string" } },
          { name: "status", in: "query", description: "Filtrar por status (EM_OPERACAO, EM_MANUTENCAO, ALERTA_REVISAO)", schema: { type: "string" } },
          { name: "categoria", in: "query", description: "Filtrar por categoria (Pesado, Médio, Leve)", schema: { type: "string" } },
          { name: "apenasAlertas", in: "query", description: "Se true, retorna apenas veículos que necessitam de revisão", schema: { type: "boolean" } }
        ],
        responses: {
          200: {
            description: "Lista de veículos recuperada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "integer", example: 5 },
                    data: { type: "array", items: { $ref: "#/components/schemas/Veiculo" } }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      post: {
        tags: ["Veículos"],
        summary: "Cadastra um novo veículo na frota com cálculo de revisão preventiva",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VeiculoInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Veículo cadastrado e ciclo de revisão projetado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Veículo cadastrado com sucesso!" },
                    data: { $ref: "#/components/schemas/Veiculo" }
                  }
                }
              }
            }
          },
          400: {
            description: "Erro 400 - Falha de validação ou campos obrigatórios ausentes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 400,
                  error: "Falha na validação dos dados do veículo.",
                  detalhes: ["O campo 'placa' é obrigatório no formato Mercosul ou Padrão.", "O campo 'kmAtual' deve ser um número maior ou igual a 0."],
                  path: "/api/veiculos",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          409: {
            description: "Erro 409 - Conflito: Placa já cadastrada no sistema",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 409,
                  error: "Já existe um veículo cadastrado com a placa BRA2E19.",
                  detalhes: null,
                  path: "/api/veiculos",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/veiculos/{id}": {
      get: {
        tags: ["Veículos"],
        summary: "Obtém os dados detalhados e alertas de um veículo por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Veículo encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Veiculo" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      put: {
        tags: ["Veículos"],
        summary: "Atualiza os dados cadastrais do veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VeiculoUpdateInput" }
            }
          }
        },
        responses: {
          200: {
            description: "Veículo atualizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Veículo atualizado com sucesso!" },
                    data: { $ref: "#/components/schemas/Veiculo" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          409: { $ref: "#/components/responses/ConflictError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      delete: {
        tags: ["Veículos"],
        summary: "Remove um veículo da frota",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Veículo removido com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Veículo #1 removido com sucesso." }
                  }
                }
              }
            }
          },
          400: {
            description: "Erro 400 - Não é permitido excluir veículo com O.S. aberta ou em andamento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 400,
                  error: "Não é possível excluir o veículo pois existem Ordens de Serviço abertas ou em andamento vinculadas a ele.",
                  detalhes: null,
                  path: "/api/veiculos/1",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/veiculos/{id}/km": {
      patch: {
        tags: ["Veículos"],
        summary: "Atualiza o odômetro (KM) do veículo e recalcula alertas instantaneamente",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AtualizarKmInput" }
            }
          }
        },
        responses: {
          200: {
            description: "KM atualizado e alertas de revisão recalculados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "KM atualizado e alertas recalculados com sucesso!" },
                    data: { $ref: "#/components/schemas/Veiculo" }
                  }
                }
              }
            }
          },
          400: {
            description: "Erro 400 - Novo KM inválido ou menor que o KM atual registrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 400,
                  error: "O novo KM (35000) não pode ser inferior ao KM atual registrado (39500).",
                  detalhes: null,
                  path: "/api/veiculos/2/km",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/veiculos/{id}/historico": {
      get: {
        tags: ["Veículos"],
        summary: "Histórico completo de ordens de serviço e manutenções do veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Histórico recuperado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "integer", example: 2 },
                    data: { type: "array", items: { $ref: "#/components/schemas/OrdemServico" } }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/ordens-servico": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Lista todas as Ordens de Serviço com filtros por status e tipo",
        parameters: [
          { name: "status", in: "query", description: "ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA", schema: { type: "string" } },
          { name: "tipo", in: "query", description: "PREVENTIVA, CORRETIVA, EMERGENCIAL", schema: { type: "string" } },
          { name: "veiculoId", in: "query", description: "Filtrar por ID do veículo", schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Lista de OS recuperada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "integer", example: 3 },
                    data: { type: "array", items: { $ref: "#/components/schemas/OrdemServico" } }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      post: {
        tags: ["Ordens de Serviço"],
        summary: "Abre uma nova Ordem de Serviço com cálculo automático de peças e mão de obra",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrdemServicoInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Ordem de Serviço criada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Ordem de Serviço criada com sucesso!" },
                    data: { $ref: "#/components/schemas/OrdemServico" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          404: {
            description: "Erro 404 - Veículo informado não existe",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 404,
                  error: "Veículo com ID 999 não encontrado.",
                  detalhes: null,
                  path: "/api/ordens-servico",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/ordens-servico/{id}": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Obtém detalhes de uma Ordem de Serviço específica",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "OS recuperada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/OrdemServico" }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      delete: {
        tags: ["Ordens de Serviço"],
        summary: "Remove uma Ordem de Serviço",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "OS removida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Ordem de Serviço #1 removida com sucesso." }
                  }
                }
              }
            }
          },
          400: {
            description: "Erro 400 - Não é permitido excluir OS em andamento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 400,
                  error: "Não é possível excluir uma Ordem de Serviço em andamento. Altere o status para CANCELADA antes de excluir.",
                  detalhes: null,
                  path: "/api/ordens-servico/1",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/ordens-servico/{id}/status": {
      patch: {
        tags: ["Ordens de Serviço"],
        summary: "Transiciona o status da OS (Recalcula ciclo de revisão preventiva na CONCLUSAO)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StatusOSInput" }
            }
          }
        },
        responses: {
          200: {
            description: "Status atualizado e ciclo preventivo recalculado se aplicável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Status da Ordem de Serviço atualizado para CONCLUIDA." },
                    data: { $ref: "#/components/schemas/OrdemServico" }
                  }
                }
              }
            }
          },
          400: {
            description: "Erro 400 - Status inválido informado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  status: 400,
                  error: "Status inválido. Status permitidos: ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA",
                  detalhes: null,
                  path: "/api/ordens-servico/1/status",
                  timestamp: "2026-08-25T19:00:00.000Z"
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/planos-manutencao": {
      get: {
        tags: ["Planos de Manutenção"],
        summary: "Lista todos os planos preventivos cadastrados",
        responses: {
          200: {
            description: "Lista de planos preventivos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "integer", example: 3 },
                    data: { type: "array", items: { $ref: "#/components/schemas/PlanoManutencao" } }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      post: {
        tags: ["Planos de Manutenção"],
        summary: "Cadastra um novo plano de manutenção preventiva",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PlanoManutencaoInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Plano criado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Plano de manutenção criado com sucesso!" },
                    data: { $ref: "#/components/schemas/PlanoManutencao" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/planos-manutencao/{id}": {
      get: {
        tags: ["Planos de Manutenção"],
        summary: "Obtém detalhes do plano de manutenção por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Plano recuperado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PlanoManutencao" }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/mecanicos": {
      get: {
        tags: ["Mecânicos"],
        summary: "Lista todos os mecânicos e especialistas da oficina",
        responses: {
          200: {
            description: "Lista de mecânicos recuperada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    total: { type: "integer", example: 4 },
                    data: { type: "array", items: { $ref: "#/components/schemas/Mecanico" } }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      },
      post: {
        tags: ["Mecânicos"],
        summary: "Cadastra um novo mecânico no quadro da oficina",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MecanicoInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Mecânico cadastrado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Mecânico cadastrado com sucesso!" },
                    data: { $ref: "#/components/schemas/Mecanico" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequestError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    },
    "/api/mecanicos/{id}": {
      get: {
        tags: ["Mecânicos"],
        summary: "Obtém detalhes do mecânico por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Mecânico recuperado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Mecanico" }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalServerError" }
        }
      }
    }
  },
  components: {
    responses: {
      BadRequestError: {
        description: "Erro 400 - Requisição inválida ou campos incorretos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              status: 400,
              error: "Falha na validação dos parâmetros enviados.",
              detalhes: ["O parâmetro ID deve ser um número inteiro válido."],
              path: "/api/...",
              timestamp: "2026-08-25T19:00:00.000Z"
            }
          }
        }
      },
      NotFoundError: {
        description: "Erro 404 - O recurso solicitado não foi encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              status: 404,
              error: "Recurso com o identificador informado não foi encontrado.",
              detalhes: null,
              path: "/api/...",
              timestamp: "2026-08-25T19:00:00.000Z"
            }
          }
        }
      },
      ConflictError: {
        description: "Erro 409 - Conflito de integridade (ex: placa duplicada)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              status: 409,
              error: "Já existe um registro conflitante com os dados informados.",
              detalhes: null,
              path: "/api/...",
              timestamp: "2026-08-25T19:00:00.000Z"
            }
          }
        }
      },
      InternalServerError: {
        description: "Erro 500 - Falha interna do servidor",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              status: 500,
              error: "Ocorreu um erro interno no servidor.",
              detalhes: null,
              path: "/api/...",
              timestamp: "2026-08-25T19:00:00.000Z"
            }
          }
        }
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          status: { type: "integer", example: 400 },
          error: { type: "string", example: "Descrição clara da falha ou regra violada" },
          detalhes: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["Campo X é obrigatório", "Campo Y deve ser maior que zero"]
          },
          path: { type: "string", example: "/api/veiculos" },
          timestamp: { type: "string", format: "date-time", example: "2026-08-25T19:00:00.000Z" }
        },
        required: ["success", "status", "error", "path", "timestamp"]
      },
      AlertaRevisao: {
        type: "object",
        properties: {
          nivelAlerta: { type: "string", enum: ["NORMAL", "ATENCAO", "CRITICO"], example: "CRITICO" },
          necessitaAtencao: { type: "boolean", example: true },
          kmDiferenca: { type: "integer", example: -2400 },
          diasRestantes: { type: "integer", example: 16 },
          kmVencido: { type: "boolean", example: true },
          dataVencida: { type: "boolean", example: false },
          motivos: {
            type: "array",
            items: { type: "string" },
            example: ["KM de revisão ultrapassado em 2400 km"]
          }
        }
      },
      Veiculo: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          placa: { type: "string", example: "BRA2E19" },
          marca: { type: "string", example: "Volvo" },
          modelo: { type: "string", example: "FH 540 6x4" },
          ano: { type: "integer", example: 2022 },
          kmAtual: { type: "integer", example: 92400 },
          kmProximaRevisao: { type: "integer", example: 90000 },
          dataProximaRevisao: { type: "string", format: "date", example: "2026-09-10" },
          planoManutencaoId: { type: "integer", example: 1 },
          status: { type: "string", enum: ["EM_OPERACAO", "EM_MANUTENCAO", "ALERTA_REVISAO"], example: "ALERTA_REVISAO" },
          categoria: { type: "string", example: "Pesado" },
          capacidadeCargaKg: { type: "integer", example: 30000 },
          motoristaResponsavel: { type: "string", example: "Marcos Oliveira" },
          planoManutencao: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              nome: { type: "string", example: "Plano Frota Pesada" },
              intervaloKm: { type: "integer", example: 15000 },
              intervaloMeses: { type: "integer", example: 6 }
            }
          },
          alertaRevisao: { $ref: "#/components/schemas/AlertaRevisao" },
          criadoEm: { type: "string", format: "date-time" },
          atualizadoEm: { type: "string", format: "date-time" }
        }
      },
      VeiculoInput: {
        type: "object",
        required: ["placa", "marca", "modelo", "ano", "kmAtual"],
        properties: {
          placa: { type: "string", example: "MER3A89" },
          marca: { type: "string", example: "Mercedes-Benz" },
          modelo: { type: "string", example: "Actros 2651" },
          ano: { type: "integer", example: 2023 },
          kmAtual: { type: "integer", example: 60000 },
          categoria: { type: "string", enum: ["Pesado", "Médio", "Leve"], example: "Pesado" },
          planoManutencaoId: { type: "integer", example: 1 },
          motoristaResponsavel: { type: "string", example: "Antônio Prado" },
          capacidadeCargaKg: { type: "integer", example: 32000 }
        }
      },
      VeiculoUpdateInput: {
        type: "object",
        properties: {
          placa: { type: "string", example: "MER3A89" },
          marca: { type: "string", example: "Mercedes-Benz" },
          modelo: { type: "string", example: "Actros 2651 Atualizado" },
          ano: { type: "integer", example: 2023 },
          kmAtual: { type: "integer", example: 62000 },
          categoria: { type: "string", example: "Pesado" },
          planoManutencaoId: { type: "integer", example: 1 },
          motoristaResponsavel: { type: "string", example: "Antônio Prado" },
          status: { type: "string", example: "EM_OPERACAO" }
        }
      },
      AtualizarKmInput: {
        type: "object",
        required: ["kmAtual"],
        properties: {
          kmAtual: { type: "integer", example: 95000, description: "Novo valor do odômetro (deve ser maior ou igual ao KM atual)" }
        }
      },
      OrdemServico: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          codigoOS: { type: "string", example: "OS-2026-001" },
          veiculoId: { type: "integer", example: 1 },
          tipo: { type: "string", enum: ["PREVENTIVA", "CORRETIVA", "EMERGENCIAL"], example: "PREVENTIVA" },
          status: { type: "string", enum: ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"], example: "CONCLUIDA" },
          mecanicoResponsavel: { type: "string", example: "Carlos Silva (Mecânico Chefe)" },
          kmNoMomento: { type: "integer", example: 75000 },
          dataAbertura: { type: "string", format: "date-time" },
          dataConclusao: { type: "string", format: "date-time", nullable: true },
          descricao: { type: "string", example: "Revisão periódica preventiva de 75.000 km" },
          pecas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string", example: "Óleo 15W40 Galão 20L" },
                quantidade: { type: "integer", example: 2 },
                valorUnitario: { type: "number", example: 380.0 },
                valorTotal: { type: "number", example: 760.0 }
              }
            }
          },
          maoDeObra: {
            type: "object",
            properties: {
              descricao: { type: "string", example: "Troca de filtros e fluidos" },
              horas: { type: "number", example: 6 },
              valorHora: { type: "number", example: 90.0 },
              valorTotal: { type: "number", example: 540.0 }
            }
          },
          valorTotalPecas: { type: "number", example: 1300.0 },
          valorTotalMaoDeObra: { type: "number", example: 540.0 },
          valorTotalGeral: { type: "number", example: 1840.0 },
          veiculo: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              placa: { type: "string", example: "BRA2E19" },
              marca: { type: "string", example: "Volvo" },
              modelo: { type: "string", example: "FH 540" },
              kmAtual: { type: "integer", example: 92400 }
            }
          }
        }
      },
      OrdemServicoInput: {
        type: "object",
        required: ["veiculoId", "descricao"],
        properties: {
          veiculoId: { type: "integer", example: 1 },
          tipo: { type: "string", enum: ["PREVENTIVA", "CORRETIVA", "EMERGENCIAL"], example: "PREVENTIVA" },
          mecanicoResponsavel: { type: "string", example: "Carlos Silva (Mecânico Chefe)" },
          kmNoMomento: { type: "integer", example: 92400 },
          descricao: { type: "string", example: "Revisão preventiva de freios e filtros" },
          pecas: {
            type: "array",
            items: {
              type: "object",
              required: ["item", "quantidade", "valorUnitario"],
              properties: {
                item: { type: "string", example: "Óleo 15W40 20L" },
                quantidade: { type: "integer", example: 2 },
                valorUnitario: { type: "number", example: 380.0 }
              }
            }
          },
          maoDeObra: {
            type: "object",
            properties: {
              descricao: { type: "string", example: "Mão de obra especializada" },
              horas: { type: "number", example: 4 },
              valorHora: { type: "number", example: 90.0 }
            }
          }
        }
      },
      StatusOSInput: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"], example: "CONCLUIDA" },
          observacoes: { type: "string", example: "Revisão realizada e sistema liberado para operação." }
        }
      },
      PlanoManutencao: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nome: { type: "string", example: "Plano Frota Pesada" },
          descricao: { type: "string", example: "Revisão preventiva para caminhões pesados" },
          intervaloKm: { type: "integer", example: 15000 },
          intervaloMeses: { type: "integer", example: 6 },
          itensChecagem: {
            type: "array",
            items: { type: "string" },
            example: ["Troca de óleo", "Filtro de ar", "Regulagem de freios"]
          }
        }
      },
      PlanoManutencaoInput: {
        type: "object",
        required: ["nome", "intervaloKm", "intervaloMeses"],
        properties: {
          nome: { type: "string", example: "Plano Caminhões Leves 3/4" },
          descricao: { type: "string", example: "Revisão preventiva urbana" },
          intervaloKm: { type: "integer", example: 10000 },
          intervaloMeses: { type: "integer", example: 4 },
          itensChecagem: {
            type: "array",
            items: { type: "string" },
            example: ["Troca de óleo", "Inspeção de pastilhas"]
          }
        }
      },
      Mecanico: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nome: { type: "string", example: "Carlos Silva" },
          cargo: { type: "string", example: "Mecânico Chefe" },
          especialidade: { type: "string", example: "Motores a Diesel & Transmissão Pesada" },
          telefone: { type: "string", example: "(11) 98765-4321" },
          status: { type: "string", enum: ["DISPONIVEL", "EM_SERVICO"], example: "DISPONIVEL" }
        }
      },
      MecanicoInput: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string", example: "Roberto Nascimento" },
          cargo: { type: "string", example: "Mecânico Especialista" },
          especialidade: { type: "string", example: "Injeção Eletrônica e Scanner" },
          telefone: { type: "string", example: "(11) 98888-7777" }
        }
      },
      DashboardResumo: {
        type: "object",
        properties: {
          frota: {
            type: "object",
            properties: {
              totalVeiculos: { type: "integer", example: 5 },
              emOperacao: { type: "integer", example: 3 },
              emManutencao: { type: "integer", example: 1 },
              alertaRevisao: { type: "integer", example: 3 },
              revisaoCritica: { type: "integer", example: 2 },
              revisaoAtencao: { type: "integer", example: 1 }
            }
          },
          ordensServico: {
            type: "object",
            properties: {
              total: { type: "integer", example: 3 },
              abertas: { type: "integer", example: 0 },
              emAndamento: { type: "integer", example: 1 },
              concluidas: { type: "integer", example: 2 },
              preventivas: { type: "integer", example: 2 },
              corretivas: { type: "integer", example: 1 }
            }
          },
          financeiro: {
            type: "object",
            properties: {
              totalGastoGeral: { type: "number", example: 3190.0 },
              totalGastoPecas: { type: "number", example: 2290.0 },
              totalGastoMaoDeObra: { type: "number", example: 900.0 }
            }
          }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
