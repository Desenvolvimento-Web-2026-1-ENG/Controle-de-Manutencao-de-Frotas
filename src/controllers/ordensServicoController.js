/**
 * Controller de Ordens de Serviço (O.S.)
 * Gerencia as operações de registro, atualização, aprovação e conclusão de O.S.
 */

const ordensServicoService = require("../services/ordensServicoService");

class OrdensServicoController {
  // GET /api/ordens-servico
  listar(req, res, next) {
    try {
      const { status, tipo, veiculoId, mecanico } = req.query;
      const ordens = ordensServicoService.listar({ status, tipo, veiculoId, mecanico });

      return res.status(200).json({
        success: true,
        total: ordens.length,
        data: ordens
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/ordens-servico/:id
  buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const os = ordensServicoService.buscarPorId(id);

      return res.status(200).json({
        success: true,
        data: os
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/ordens-servico
  criar(req, res, next) {
    try {
      const novaOS = ordensServicoService.criar(req.body);

      return res.status(201).json({
        success: true,
        message: "Ordem de Serviço aberta com sucesso!",
        data: novaOS
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/ordens-servico/:id
  atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const osAtualizada = ordensServicoService.atualizar(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Ordem de Serviço atualizada com sucesso!",
        data: osAtualizada
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/ordens-servico/:id/status
  alterarStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "O campo 'status' é obrigatório no corpo da requisição."
        });
      }

      const osAtualizada = ordensServicoService.alterarStatus(id, status, observacoes);

      return res.status(200).json({
        success: true,
        message: `Status da OS atualizado com sucesso para '${status}'!`,
        data: osAtualizada
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/ordens-servico/:id
  deletar(req, res, next) {
    try {
      const { id } = req.params;
      ordensServicoService.deletar(id);

      return res.status(200).json({
        success: true,
        message: `Ordem de Serviço com ID ${id} cancelada/removida com sucesso!`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrdensServicoController();
