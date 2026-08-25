/**
 * Controller de Mecânicos
 */

const mecanicosService = require("../services/mecanicosService");

class MecanicosController {
  listar(req, res, next) {
    try {
      const mecanicos = mecanicosService.listar();
      return res.status(200).json({
        success: true,
        total: mecanicos.length,
        data: mecanicos
      });
    } catch (error) {
      next(error);
    }
  }

  buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const mecanico = mecanicosService.buscarPorId(id);
      return res.status(200).json({
        success: true,
        data: mecanico
      });
    } catch (error) {
      next(error);
    }
  }

  criar(req, res, next) {
    try {
      const novoMecanico = mecanicosService.criar(req.body);
      return res.status(201).json({
        success: true,
        message: "Mecânico cadastrado com sucesso!",
        data: novoMecanico
      });
    } catch (error) {
      next(error);
    }
  }

  atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const mecanicoAtualizado = mecanicosService.atualizar(id, req.body);
      return res.status(200).json({
        success: true,
        message: "Mecânico atualizado com sucesso!",
        data: mecanicoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  deletar(req, res, next) {
    try {
      const { id } = req.params;
      mecanicosService.deletar(id);
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
