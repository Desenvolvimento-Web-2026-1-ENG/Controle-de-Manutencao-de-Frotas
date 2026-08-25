/**
 * Roteador Principal da API - WEBDEV FROTAS
 */

const { Router } = require("express");
const veiculosRoutes = require("./veiculosRoutes");
const planosManutencaoRoutes = require("./planosManutencaoRoutes");
const ordensServicoRoutes = require("./ordensServicoRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const mecanicosRoutes = require("./mecanicosRoutes");

const router = Router();

// Rota de status da API
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    projeto: "WEBDEV FROTAS — Controle de Manutenção de Frotas",
    versao: "1.0.0-p1",
    usuarioPadrao: "Gabriel Nunes (Gestor)",
    status: "online",
    timestamp: new Date().toISOString(),
    documentacao: "/api-docs",
    wireframes: "/wireframes.html"
  });
});

// Agrupamento dos módulos
router.use("/veiculos", veiculosRoutes);
router.use("/planos-manutencao", planosManutencaoRoutes);
router.use("/ordens-servico", ordensServicoRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/mecanicos", mecanicosRoutes);

module.exports = router;
