/**
 * Inicializador do Servidor HTTP
 */

require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log("==================================================================");
  console.log(`🚀 Servidor rodando com sucesso na porta: ${PORT}`);
  console.log(`📄 Documentação Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`🎨 Wireframes e Mapeamento:  http://localhost:${PORT}/wireframes.html`);
  console.log(`🔍 Status da API:            http://localhost:${PORT}/api/status`);
  console.log("==================================================================");
});

module.exports = server;
