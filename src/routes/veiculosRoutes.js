/**
 * Rotas de Veículos (/api/veiculos)
 */

const { Router } = require("express");
const veiculosController = require("../controllers/veiculosController");
const { validarIdParam, validarVeiculoBody } = require("../middlewares/requestValidator");

const router = Router();

// Rota específica de veículos com revisão imediata (deve vir antes de /:id)
router.get("/revisao-imediata", (req, res, next) => veiculosController.listarRevisaoImediata(req, res, next));

// Listagem de veículos com filtros via query params
router.get("/", (req, res, next) => veiculosController.listar(req, res, next));

// Cadastro de novo veículo
router.post("/", validarVeiculoBody, (req, res, next) => veiculosController.criar(req, res, next));

// Obter detalhes de um veículo por ID
router.get("/:id", validarIdParam, (req, res, next) => veiculosController.buscarPorId(req, res, next));

// Histórico de manutenções de um veículo
router.get("/:id/historico", validarIdParam, (req, res, next) => veiculosController.buscarHistorico(req, res, next));

// Atualização completa dos dados do veículo
router.put("/:id", validarIdParam, (req, res, next) => veiculosController.atualizar(req, res, next));

// Atualização parcial específica da quilometragem (KM)
router.patch("/:id/km", validarIdParam, (req, res, next) => veiculosController.atualizarKm(req, res, next));

// Exclusão de veículo
router.delete("/:id", validarIdParam, (req, res, next) => veiculosController.deletar(req, res, next));

module.exports = router;
