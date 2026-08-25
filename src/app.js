/**
 * Configuração da Aplicação Express
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const routes = require("./routes");
const swaggerSpec = require("./config/swagger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Arquivos Estáticos (Interface de Wireframes e Documentação Visual)
app.use(express.static(path.join(__dirname, "../public")));
app.use("/wireframes-docs", express.static(path.join(__dirname, "../docs/wireframes")));

// Documentação Interativa Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Documentação API - Controle de Manutenção de Frotas",
  customCss: ".swagger-ui .topbar { background-color: #1e293b; }",
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Rota raiz de redirecionamento ou boas-vindas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Rotas da API
app.use("/api", routes);

// Tratamento de Rotas não Encontradas (404)
app.use(notFoundHandler);

// Tratamento Centralizado de Erros (500, 400, etc.)
app.use(errorHandler);

module.exports = app;
