/**
 * Rotas do Dashboard e Alertas (/api/dashboard)
 */

const { Router } = require("express");
const dashboardController = require("../controllers/dashboardController");

const router = Router();

// Métricas e resumo geral da frota e custos
router.get("/resumo", (req, res, next) => dashboardController.obterResumo(req, res, next));

// Listagem consolidada de alertas de revisão (críticos e atenção)
router.get("/alertas", (req, res, next) => dashboardController.obterAlertas(req, res, next));

module.exports = router;
