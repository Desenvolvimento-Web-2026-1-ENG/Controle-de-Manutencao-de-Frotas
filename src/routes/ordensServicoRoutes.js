/**
 * Rotas de Ordens de Serviço (/api/ordens-servico)
 */

const { Router } = require("express");
const ordensServicoController = require("../controllers/ordensServicoController");
const { validarIdParam, validarOSBody } = require("../middlewares/requestValidator");

const router = Router();

// Listagem de Ordens de Serviço com filtros via query params (status, tipo, veiculoId, mecanico)
router.get("/", (req, res, next) => ordensServicoController.listar(req, res, next));

// Abertura de nova Ordem de Serviço
router.post("/", validarOSBody, (req, res, next) => ordensServicoController.criar(req, res, next));

// Buscar Ordem de Serviço por ID
router.get("/:id", validarIdParam, (req, res, next) => ordensServicoController.buscarPorId(req, res, next));

// Atualizar dados da Ordem de Serviço
router.put("/:id", validarIdParam, (req, res, next) => ordensServicoController.atualizar(req, res, next));

// Alteração de status da OS (ABERTA -> EM_ANDAMENTO -> CONCLUIDA / CANCELADA)
router.patch("/:id/status", validarIdParam, (req, res, next) => ordensServicoController.alterarStatus(req, res, next));

// Deletar ou cancelar OS
router.delete("/:id", validarIdParam, (req, res, next) => ordensServicoController.deletar(req, res, next));

module.exports = router;
