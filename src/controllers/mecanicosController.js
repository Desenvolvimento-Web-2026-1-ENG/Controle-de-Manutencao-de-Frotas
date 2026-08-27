/**
 * Controller de Mecânicos (Async / Prisma)
 */

const mecanicosService = require("../services/mecanicosService");

class MecanicosController {
  async listar(req, res, next) {
    try {
      const mecanicos = await mecanicosService.listar();
      return res.status(200).json({
        success: true,
        total: mecanicos.length,
        data: mecanicos
      });
    } catch (error) {
      next(error);
    }
  }

  async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const mecanico = await mecanicosService.buscarPorId(id);
      return res.status(200).json({
        success: true,
        data: mecanico
      });
    } catch (error) {
      next(error);
    }
  }

  async criar(req, res, next) {
    try {
      const novoMecanico = await mecanicosService.criar(req.body);
      return res.status(201).json({
        success: true,
        message: "Mecânico cadastrado com sucesso!",
        data: novoMecanico
      });
    } catch (error) {
      next(error);
    }
  }

  async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const mecanicoAtualizado = await mecanicosService.atualizar(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Mecânico atualizado com sucesso!",
        data: mecanicoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  async deletar(req, res, next) {
    try {
      const { id } = req.params;
      await mecanicosService.deletar(id);
      return res.status(200).json({
        success: true,
        message: `Mecânico #${id} removido com sucesso.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MecanicosController();
