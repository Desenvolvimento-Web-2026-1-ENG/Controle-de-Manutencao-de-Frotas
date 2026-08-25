/**
 * Middleware para validação de dados de entrada da API
 */

function validarIdParam(req, res, next) {
  const id = req.params.id || req.params.veiculoId;
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    const error = new Error("O parâmetro ID deve ser um número inteiro positivo válido.");
    error.statusCode = 400;
    return next(error);
  }
  next();
}

function validarVeiculoBody(req, res, next) {
  const { placa, marca, modelo, ano, kmAtual } = req.body;
  const erros = [];

  if (!placa || typeof placa !== "string" || placa.trim().length < 6) {
    erros.push("O campo 'placa' é obrigatório e deve ter no mínimo 6 caracteres.");
  }

  if (!marca || typeof marca !== "string" || marca.trim().length === 0) {
    erros.push("O campo 'marca' é obrigatório.");
  }

  if (!modelo || typeof modelo !== "string" || modelo.trim().length === 0) {
    erros.push("O campo 'modelo' é obrigatório.");
  }

  if (ano === undefined || isNaN(Number(ano)) || Number(ano) < 1970 || Number(ano) > new Date().getFullYear() + 1) {
    erros.push("O campo 'ano' deve ser um ano válido.");
  }

  if (kmAtual === undefined || isNaN(Number(kmAtual)) || Number(kmAtual) < 0) {
    erros.push("O campo 'kmAtual' é obrigatório e não pode ser negativo.");
  }

  if (erros.length > 0) {
    const error = new Error("Falha na validação dos dados do veículo.");
    error.statusCode = 400;
    error.detalhes = erros;
    return next(error);
  }

  next();
}

function validarOSBody(req, res, next) {
  const { veiculoId, descricao, tipo, pecas, maoDeObra } = req.body;
  const erros = [];

  if (!veiculoId || isNaN(Number(veiculoId))) {
    erros.push("O campo 'veiculoId' é obrigatório e deve ser numérico.");
  }

  if (!descricao || typeof descricao !== "string" || descricao.trim().length < 5) {
    erros.push("O campo 'descricao' é obrigatório e deve ter no mínimo 5 caracteres.");
  }

  if (tipo && !["PREVENTIVA", "CORRETIVA", "EMERGENCIAL"].includes(tipo.toUpperCase())) {
    erros.push("O campo 'tipo' deve ser PREVENTIVA, CORRETIVA ou EMERGENCIAL.");
  }

  if (pecas && !Array.isArray(pecas)) {
    erros.push("O campo 'pecas' deve ser um array de itens.");
  }

  if (erros.length > 0) {
    const error = new Error("Falha na validação dos dados da Ordem de Serviço.");
    error.statusCode = 400;
    error.detalhes = erros;
    return next(error);
  }

  next();
}

function validarPlanoBody(req, res, next) {
  const { nome, intervaloKm, intervaloMeses } = req.body;
  const erros = [];

  if (!nome || typeof nome !== "string" || nome.trim().length < 3) {
    erros.push("O campo 'nome' é obrigatório e deve ter ao menos 3 caracteres.");
  }

  if (intervaloKm === undefined || isNaN(Number(intervaloKm)) || Number(intervaloKm) <= 0) {
    erros.push("O campo 'intervaloKm' é obrigatório e deve ser maior que zero.");
  }

  if (intervaloMeses === undefined || isNaN(Number(intervaloMeses)) || Number(intervaloMeses) <= 0) {
    erros.push("O campo 'intervaloMeses' é obrigatório e deve ser maior que zero.");
  }

  if (erros.length > 0) {
    const error = new Error("Falha na validação dos dados do Plano de Manutenção.");
    error.statusCode = 400;
    error.detalhes = erros;
    return next(error);
  }

  next();
}

module.exports = {
  validarIdParam,
  validarVeiculoBody,
  validarOSBody,
  validarPlanoBody
};
