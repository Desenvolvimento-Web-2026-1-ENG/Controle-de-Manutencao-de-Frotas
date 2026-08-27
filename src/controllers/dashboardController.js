/**
 * Controller de Dashboard e Alertas (Async / Prisma)
 * Fornece os endpoints de consolidação da frota e painel de alertas
 */

const dashboardService = require("../services/dashboardService");

class DashboardController {
  // GET /api/dashboard/resumo
  async obterResumo(req, res, next) {
    try {
      const resumo = await dashboardService.obterResumo();
      return res.status(200).json({
        success: true,
        data: resumo
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/alertas
  async obterAlertas(req, res, next) {
    try {
      const alertas = await dashboardService.obterAlertas();
      return res.status(200).json({
        success: true,
        data: alertas
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
