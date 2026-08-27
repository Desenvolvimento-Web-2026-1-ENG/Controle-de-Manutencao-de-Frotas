/**
 * Controller de Veículos (Async / Prisma)
 * Gerencia as requisições HTTP RESTful para os veículos da frota
 */

const veiculosService = require("../services/veiculosService");

class VeiculosController {
  // GET /api/veiculos
  async listar(req, res, next) {
    try {
      const { status, marca, modelo, categoria, busca, apenasAlertas } = req.query;
      const veiculos = await veiculosService.listar({
        status,
        marca,
        modelo,
        categoria,
        busca,
        apenasAlertas
      });

      return res.status(200).json({
        success: true,
        total: veiculos.length,
        data: veiculos
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/veiculos/:id
  async buscarPorId(req, res, next) {
    try {
      const { id } = req.params;
      const veiculo = await veiculosService.buscarPorId(id);

      return res.status(200).json({
        success: true,
        data: veiculo
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/veiculos/revisao-imediata
  async listarRevisaoImediata(req, res, next) {
    try {
      const veiculos = await veiculosService.listarRevisaoImediata();

      return res.status(200).json({
        success: true,
        total: veiculos.length,
        mensagem: "Veículos que necessitam de revisão preventiva imediata (KM ou Data atingida)",
        data: veiculos
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/veiculos/:id/historico
  async buscarHistorico(req, res, next) {
    try {
      const { id } = req.params;
      const historico = await veiculosService.buscarHistorico(id);

      return res.status(200).json({
        success: true,
        veiculoId: Number(id),
        totalManutencoes: historico.length,
        data: historico
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/veiculos
  async criar(req, res, next) {
    try {
      const novoVeiculo = await veiculosService.criar(req.body);

      return res.status(201).json({
        success: true,
        message: "Veículo cadastrado com sucesso!",
        data: novoVeiculo
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/veiculos/:id
  async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const veiculoAtualizado = await veiculosService.atualizar(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Dados do veículo atualizados com sucesso!",
        data: veiculoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/veiculos/:id/km
  async atualizarKm(req, res, next) {
    try {
      const { id } = req.params;
      const { kmAtual } = req.body;

      if (kmAtual === undefined) {
        return res.status(400).json({
          success: false,
          error: "O campo 'kmAtual' é obrigatório no corpo da requisição."
        });
      }

      const veiculoAtualizado = await veiculosService.atualizarKm(id, kmAtual);

      return res.status(200).json({
        success: true,
        message: "Quilometragem do veículo atualizada com sucesso!",
        data: veiculoAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/veiculos/:id
  async deletar(req, res, next) {
    try {
      const { id } = req.params;
      await veiculosService.deletar(id);

      return res.status(200).json({
        success: true,
        message: `Veículo com ID ${id} removido com sucesso!`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VeiculosController();
