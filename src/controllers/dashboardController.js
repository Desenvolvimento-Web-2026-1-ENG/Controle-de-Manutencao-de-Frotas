/**
 * Controller de Dashboard e Alertas
 * Fornece os endpoints de consolidação da frota e painel de alertas
 */

const dashboardService = require("../services/dashboardService");

class DashboardController {
  // GET /api/dashboard/resumo
  obterResumo(req, res, next) {
    try {
      const resumo = dashboardService.obterResumo();
      return res.status(200).json({
        success: true,
        data: resumo
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/alertas
  obterAlertas(req, res, next) {
    try {
      const alertas = dashboardService.obterAlertas();
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
