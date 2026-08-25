/**
 * Rotas de Mecânicos (/api/mecanicos)
 */

const { Router } = require("express");
const mecanicosController = require("../controllers/mecanicosController");
const { validarIdParam } = require("../middlewares/requestValidator");

const router = Router();

router.get("/", (req, res, next) => mecanicosController.listar(req, res, next));
router.post("/", (req, res, next) => mecanicosController.criar(req, res, next));
router.get("/:id", validarIdParam, (req, res, next) => mecanicosController.buscarPorId(req, res, next));

module.exports = router;
