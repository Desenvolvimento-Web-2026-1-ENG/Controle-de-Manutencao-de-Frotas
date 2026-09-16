/**
 * Configuração da Aplicação Express
 * Suporte a API RESTful, Swagger UI e Front-end SPA React
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
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

// 1. Arquivos Estáticos da Aplicação Front-end React (Vite Build)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// 2. Arquivos Estáticos Legados e Wireframes
app.use(express.static(path.join(__dirname, "../public")));
app.use("/wireframes-docs", express.static(path.join(__dirname, "../docs/wireframes")));

// 3. Documentação Interativa Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "WEBDEV FROTAS — Documentação da API (OpenAPI/Swagger)",
    customCss: ".swagger-ui .topbar { background-color: #1e293b; }",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// 4. Rotas da API REST
app.use("/api", routes);

// 5. Fallback para SPA React (Rotas do lado do cliente)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
    return next();
  }

  const reactIndex = path.join(frontendDistPath, "index.html");
  if (fs.existsSync(reactIndex)) {
    return res.sendFile(reactIndex);
  }

  return res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 6. Tratamento de Rotas não Encontradas para a API (404)
app.use(notFoundHandler);

// 7. Tratamento Centralizado de Erros (500, 400, 409, etc.)
app.use(errorHandler);

module.exports = app;
