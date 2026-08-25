/**
 * Inicializador do Servidor HTTP
 */

require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log("==================================================================");
  console.log(`🚀 Servidor rodando com sucesso na porta: ${PORT}`);
  console.log(`🌐 Aplicação Web (Front-end): http://localhost:${PORT}`);
  console.log(`📄 Documentação Swagger UI:   http://localhost:${PORT}/api-docs`);
  console.log(`🎨 Wireframes e Mapeamento:   http://localhost:${PORT}/wireframes.html`);
  console.log(`🔍 Status da API:             http://localhost:${PORT}/api/status`);
  console.log("==================================================================");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n❌ [ERRO] A porta ${PORT} já está em uso por outro processo.`);
    console.error(`👉 Para liberar a porta no Linux, execute: fuser -k ${PORT}/tcp`);
    console.error(`👉 Ou altere a variável PORT no arquivo .env (ex: PORT=3001)\n`);
    process.exit(1);
  } else {
    console.error("❌ [ERRO] Erro inesperado ao inicializar o servidor:", error);
    process.exit(1);
  }
});

// Encerramento limpo (Graceful Shutdown)
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\n🛑 Servidor encerrado com sucesso.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("\n🛑 Servidor terminado.");
    process.exit(0);
  });
});

module.exports = server;
