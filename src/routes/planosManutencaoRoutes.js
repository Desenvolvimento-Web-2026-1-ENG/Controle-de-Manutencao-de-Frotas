/**
 * Rotas de Planos de Manutenção (/api/planos-manutencao)
 */

const { Router } = require("express");
const planosController = require("../controllers/planosManutencaoController");
const { validarIdParam, validarPlanoBody } = require("../middlewares/requestValidator");

const router = Router();

// Listagem de todos os planos
router.get("/", (req, res, next) => planosController.listar(req, res, next));

// Cadastro de novo plano
router.post("/", validarPlanoBody, (req, res, next) => planosController.criar(req, res, next));

// Buscar plano por ID
router.get("/:id", validarIdParam, (req, res, next) => planosController.buscarPorId(req, res, next));

// Atualizar plano
router.put("/:id", validarIdParam, (req, res, next) => planosController.atualizar(req, res, next));

// Excluir plano
router.delete("/:id", validarIdParam, (req, res, next) => planosController.deletar(req, res, next));

module.exports = router;
