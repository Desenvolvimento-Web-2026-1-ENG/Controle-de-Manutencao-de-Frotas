/**
 * Especificação OpenAPI 3.0 / Swagger para WEBDEV FROTAS
 */

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "WEBDEV FROTAS — API de Controle de Manutenção de Frotas (Logística)",
    version: "1.0.0-p1",
    description: `
**Sistema de Gerenciamento de Manutenção Preventiva de Veículos e Ordens de Serviço**
Desenvolvido para a Avaliação Parcial (P1) da disciplina de Desenvolvimento Web.

### Perfis de Acesso:
- **Gestor de Frota (Gabriel Nunes):** Acompanha alertas de revisão, cadastra veículos, define planos preventivos e monitora indicadores.
- **Mecânico (Admin):** Abre e gerencia Ordens de Serviço (O.S.), registra peças utilizadas, valores de mão de obra e finaliza manutenções.

### Lógica Central de Alertas:
- **Alerta Crítico (Revisão Imediata):** Gerado quando o \`kmAtual >= kmProximaRevisao\` ou \`dataProximaRevisao <= dataAtual\`.
- **Alerta de Atenção:** Faltando menos de 1.000 km ou menos de 15 dias para a data prevista.
- **Conclusão de O.S. Preventiva:** Ao concluir uma OS preventiva, o sistema recalcula automaticamente a próxima revisão com base no plano de manutenção do veículo.
    `,
    contact: {
      name: "Gabriel Nunes - Desenvolvedor Fullstack",
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
    { name: "Planos de Manutenção", description: "Configuração dos intervalos e itens de revisão preventiva" },
    { name: "Mecânicos", description: "Gestão do quadro de mecânicos e especialistas da oficina" }
  ],
  paths: {
    "/api/status": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Verifica a integridade e status da API",
        responses: {
          200: { description: "API operacional" }
        }
      }
    },
    "/api/dashboard/resumo": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Obtém métricas consolidadas da frota, OS e financeiro",
        responses: {
          200: { description: "Métricas consolidadas retornadas com sucesso" }
        }
      }
    },
    "/api/dashboard/alertas": {
      get: {
        tags: ["Dashboard e Alertas"],
        summary: "Lista todos os alertas de revisão classificados por criticidade",
        responses: {
          200: { description: "Lista de alertas retornada com sucesso" }
        }
      }
    },
    "/api/veiculos": {
      get: {
        tags: ["Veículos"],
        summary: "Lista todos os veículos cadastrados na frota",
        responses: {
          200: { description: "Lista de veículos recuperada" }
        }
      },
      post: {
        tags: ["Veículos"],
        summary: "Cadastra um novo veículo na frota",
        responses: {
          201: { description: "Veículo criado" }
        }
      }
    },
    "/api/veiculos/{id}": {
      get: {
        tags: ["Veículos"],
        summary: "Obtém detalhes do veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Detalhes do veículo" } }
      },
      put: {
        tags: ["Veículos"],
        summary: "Atualiza o veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Veículo atualizado" } }
      },
      delete: {
        tags: ["Veículos"],
        summary: "Remove o veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Veículo removido" } }
      }
    },
    "/api/veiculos/{id}/km": {
      patch: {
        tags: ["Veículos"],
        summary: "Atualiza especificamente o KM do veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "KM atualizado" } }
      }
    },
    "/api/veiculos/{id}/historico": {
      get: {
        tags: ["Veículos"],
        summary: "Histórico completo de manutenções do veículo",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Histórico recuperado" } }
      }
    },
    "/api/ordens-servico": {
      get: {
        tags: ["Ordens de Serviço"],
        summary: "Lista todas as Ordens de Serviço",
        responses: { 200: { description: "Lista de OS" } }
      },
      post: {
        tags: ["Ordens de Serviço"],
        summary: "Abre nova Ordem de Serviço",
        responses: { 201: { description: "OS criada" } }
      }
    },
    "/api/ordens-servico/{id}/status": {
      patch: {
        tags: ["Ordens de Serviço"],
        summary: "Altera o status da OS (Recalcula ciclo na conclusão)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Status atualizado" } }
      }
    },
    "/api/planos-manutencao": {
      get: {
        tags: ["Planos de Manutenção"],
        summary: "Lista planos preventivos",
        responses: { 200: { description: "Lista de planos" } }
      },
      post: {
        tags: ["Planos de Manutenção"],
        summary: "Cria plano preventivo",
        responses: { 201: { description: "Plano criado" } }
      }
    },
    "/api/mecanicos": {
      get: {
        tags: ["Mecânicos"],
        summary: "Lista todos os mecânicos da oficina",
        responses: { 200: { description: "Lista de mecânicos" } }
      },
      post: {
        tags: ["Mecânicos"],
        summary: "Cadastra um novo mecânico",
        responses: { 201: { description: "Mecânico cadastrado" } }
      }
    }
  }
};

module.exports = swaggerSpec;
