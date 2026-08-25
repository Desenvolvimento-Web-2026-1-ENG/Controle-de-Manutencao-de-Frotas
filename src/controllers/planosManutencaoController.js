/**
 * Controller de Planos de Manutenção
 * Gerencia as requisições HTTP RESTful para os planos preventivos
 */

const planosService = require("../services/planosManutencaoService");

class PlanosManutencaoController {
  // GET /api/planos-manutencao
  listar(req, res, next) {
    try {
      const planos = planosService.listar();
      return res.status(200).json({
        success: true,
        total: planos.length,
        data: planos
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/planos-manutencao/:id
  buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const plano = planosService.buscarPorId(id);
      return res.status(200).json({
        success: true,
        data: plano
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/planos-manutencao
  criar(req, res, next) {
    try {
      const novoPlano = planosService.criar(req.body);
      return res.status(201).json({
        success: true,
        message: "Plano de manutenção criado com sucesso!",
        data: novoPlano
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/planos-manutencao/:id
  atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const planoAtualizado = planosService.atualizar(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Plano de manutenção atualizado com sucesso!",
        data: planoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/planos-manutencao/:id
  deletar(req, res, next) {
    try {
      const { id } = req.params;
      planosService.deletar(id);
      return res.status(200).json({
        success: true,
        message: `Plano de manutenção com ID ${id} removido com sucesso!`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlanosManutencaoController();
