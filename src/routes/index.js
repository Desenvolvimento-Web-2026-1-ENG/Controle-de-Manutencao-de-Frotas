/**
 * Roteador Principal da API
 */

const { Router } = require("express");
const veiculosRoutes = require("./veiculosRoutes");
const planosManutencaoRoutes = require("./planosManutencaoRoutes");
const ordensServicoRoutes = require("./ordensServicoRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = Router();

// Rota de status da API
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    projeto: "Sistema de Controle de Manutenção de Frotas",
    versao: "1.0.0-p1",
    status: "online",
    timestamp: new Date().toISOString(),
    documentacao: "/api-docs",
    wireframes: "/wireframes"
  });
});

// Agrupamento dos módulos
router.use("/veiculos", veiculosRoutes);
router.use("/planos-manutencao", planosManutencaoRoutes);
router.use("/ordens-servico", ordensServicoRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
